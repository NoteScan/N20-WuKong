import * as msgpack from '@msgpack/msgpack'
import { networks } from 'bitcoinjs-lib'
import BtcWalletConnect from 'n20-connect'
import { Mempool } from './mempool'
import { NoteOrg } from './notescanio'
import {
  hash256,
  num2bin,
  splitBufferIntoSegments,
  toXOnly,
  stringToBytes,
  sleep,
} from './n20_utils'

import type {
  IBroadcastResult,
  ICoinConfig,
  ISendToAddress,
  ISendToScript,
  ITokenUtxo,
  ITransaction,
  ITransferN20Data,
  IUtxo,
  IWalletAccount,
  NotePayload,
  ISendTarget,
  IDeployN20Data,
  IMintN20Data,
} from './n20_types'

import {
  MAX_SCRIPT_ELEMENT_SIZE,
  MAX_SCRIPT_FULL_SIZE,
  MAX_STACK_FULL_SIZE,
  MAX_STANDARD_STACK_ITEM_SIZE,
  MIN_SATOSHIS,
  MAX_LOCKTIME,
  MAX_SEQUENCE,
  coins_config,
} from './n20_config'

import { Urchain } from './urchain'
import {
  generateP2TRNoteAddress,
  generateP2TRCommitNoteAddress,
  generateP2WPHKAddress,
  createP2TRNotePsbt,
  createP2TRCommitNotePsbt,
  createCoinPsbt,
} from './btc-note'

const mintData: IMintN20Data = {
  p: 'n20',
  op: 'mint',
  tick: 'WUKONG',
  amt: 900000000000n,
  nonce: 0n,
}

class N20Wallet {
  config: ICoinConfig
  urchain!: Urchain
  currentAccount!: IWalletAccount
  btc_wallet!: BtcWalletConnect
  constructor(btc_wallet: BtcWalletConnect) {
    this.btc_wallet = btc_wallet
    this.config = coins_config.find((c) => btc_wallet.network.includes(c.network)) as ICoinConfig
    this.urchain = new Urchain(this.config.urchain.host, this.config.urchain.apiKey)
    if (this.btc_wallet.publicKey !== undefined) {
      this.currentAccount = this.createAccount(this.btc_wallet.publicKey)
    }
  }

  private createAccount(pubkey: string): IWalletAccount {
    const publicKeyBuffer = Buffer.from(pubkey, 'hex')

    const xOnlyPubkey = toXOnly(publicKeyBuffer)

    const network = networks[this.btc_wallet.network.includes('livenet') ? 'bitcoin' : 'testnet']
    const addressP2WPKH = generateP2WPHKAddress(Buffer.from(pubkey, 'hex'), network)

    const addressP2TRNote = generateP2TRNoteAddress(Buffer.from(pubkey, 'hex'), network)

    const account = {
      publicKey: publicKeyBuffer,
      xOnlyPubkey: xOnlyPubkey.toString('hex'),
      mainAddress: addressP2WPKH,
      tokenAddress: addressP2TRNote,
    }

    return account
  }
  async getTokenUtxos(tick: string, amount?: bigint) {
    const tokenUtxos = await this.urchain.tokenutxos(
      [this.currentAccount.tokenAddress!.scriptHash],
      tick,
      amount
    )
    if (tokenUtxos.length === 0) {
      throw new Error('No UTXOs found')
    }

    return tokenUtxos
  }

  async getBalance() {
    const p2wpkh = await this.urchain.balance(this.currentAccount.mainAddress!.scriptHash)
    const p2trnode = await this.urchain.balance(this.currentAccount.tokenAddress!.scriptHash)
    return {
      mainAddress: {
        confirmed: BigInt(p2wpkh.confirmed),
        unconfirmed: BigInt(p2wpkh.unconfirmed),
      },
      tokenAddress: {
        confirmed: BigInt(p2trnode.confirmed),
        unconfirmed: BigInt(p2trnode.unconfirmed),
      },
    }
  }

  async tokenList() {
    const results = await this.urchain.tokenList(this.currentAccount.tokenAddress!.scriptHash)
    return results
  }

  async fetchAllAccountUtxos(includeUnbondedTokenUtxos = false) {
    const allScriptHashs: string[] = []
    const allAccounts = new Map<string, IWalletAccount>()

    allScriptHashs.push(this.currentAccount.mainAddress!.scriptHash)
    allAccounts.set(this.currentAccount.mainAddress!.scriptHash, this.currentAccount)
    // In blockchain development, it's not uncommon for users to accidentally send small
    // amounts of Bitcoin (satoshis) to token addresses. To recover these funds, there's an
    // option that allows you to access the related Unspent Transaction Outputs (UTXOs). But
    // beware! Enabling this feature could lead to unintended spending of your tokens. Always
    // double-check before proceeding!
    if (includeUnbondedTokenUtxos) {
      allScriptHashs.push(this.currentAccount.tokenAddress!.scriptHash)
      allAccounts.set(this.currentAccount.tokenAddress!.scriptHash, this.currentAccount)
    }

    const allUtxos: IUtxo[] = await this.urchain.utxos(allScriptHashs)
    for (const utxo of allUtxos) {
      const account = allAccounts.get(utxo.scriptHash)
      if (account) {
        //        utxo.privateKeyWif = account.privateKey;
        if (utxo.scriptHash === account.mainAddress?.scriptHash) {
          utxo.type = account.mainAddress?.type
        }
        if (utxo.scriptHash === account.tokenAddress?.scriptHash) {
          utxo.type = account.tokenAddress?.type
        }
      }
    }
    return allUtxos
  }

  async broadcastTransaction(tx: ITransaction): Promise<IBroadcastResult> {
    return await this.urchain.broadcast(tx.txHex)
  }

  async bestBlock() {
    const results = await this.urchain.bestBlock()
    return results
  }

  async tokenInfo(tick: string) {
    const result = await this.urchain.tokenInfo(tick)
    return result
  }

  async buildN20Transaction(
    payload: NotePayload,
    tokenAddresses: ISendToAddress[] | ISendToScript[],
    noteUtxos: IUtxo[],
    payUtxos: IUtxo[],
    feeRate: number
  ) {
    const network = networks[this.btc_wallet.network.includes('livenet') ? 'bitcoin' : 'testnet']

    const finalTx = await createP2TRNotePsbt(
      this,
      payload,
      noteUtxos,
      payUtxos,
      tokenAddresses as ISendToAddress[],
      network,
      feeRate
    )

    return {
      noteUtxos,
      payUtxos,
      txId: finalTx.getId(),
      txHex: finalTx.toHex(),
      feeRate,
    }
  }

  private buildN20Payload(data: string | object, useScriptSize = false) {
    const encodedData = msgpack.encode(data, {
      sortKeys: true,
      useBigInt64: true,
    })
    const payload: NotePayload = {
      data0: '',
      data1: '',
      data2: '',
      data3: '',
      data4: '',
    }
    const buffer = Buffer.from(encodedData)

    let dataList
    if (buffer.length <= MAX_STACK_FULL_SIZE) {
      dataList = splitBufferIntoSegments(buffer, MAX_STANDARD_STACK_ITEM_SIZE)
    } else if (useScriptSize && buffer.length <= MAX_SCRIPT_FULL_SIZE) {
      dataList = splitBufferIntoSegments(buffer, MAX_SCRIPT_ELEMENT_SIZE)
    } else {
      throw new Error('data is too long')
    }
    if (dataList) {
      payload.data0 = dataList[0] !== undefined ? dataList[0].toString('hex') : ''
      payload.data1 = dataList[1] !== undefined ? dataList[1].toString('hex') : ''
      payload.data2 = dataList[2] !== undefined ? dataList[2].toString('hex') : ''
      payload.data3 = dataList[3] !== undefined ? dataList[3].toString('hex') : ''
      payload.data4 = dataList[4] !== undefined ? dataList[4].toString('hex') : ''
    } else {
      payload.data0 = buffer.toString('hex')
      payload.data1 = ''
      payload.data2 = ''
      payload.data3 = ''
      payload.data4 = ''
    }
    return payload
  }

  private commitPayloadAddress(payload: NotePayload) {
    const address = generateP2TRCommitNoteAddress(
      payload,
      Buffer.from(this.btc_wallet.publicKey!, 'hex'),
      networks[this.btc_wallet.network.includes('livenet') ? 'bitcoin' : 'testnet']
    )
    return address
  }

  async buildCommitPayloadTransaction(
    payload: NotePayload,
    toAddress?: string,
    noteUtxo?: IUtxo,
    payUtxos?: IUtxo[],
    feeRate?: number
  ) {
    const commitAddress = this.commitPayloadAddress(payload)
    if (undefined === noteUtxo) {
      let noteUtxos = await this.urchain.utxos([commitAddress.scriptHash])
      if (noteUtxos.length === 0) {
        const result = await this.send([{ address: commitAddress.address!, amount: MIN_SATOSHIS }])
        if (result.success) {
          for (let i = 0; i < 10; i++) {
            noteUtxos = await this.urchain.utxos([commitAddress.scriptHash])
            if (noteUtxos.length > 0) {
              break
            } else if (i === 9) {
              throw new Error('can not get commit note utxo: ' + commitAddress.address!)
            }
            await sleep(1000)
          }
        } else {
          throw new Error(result.error)
        }
      }
      noteUtxo = noteUtxos[0]!
      noteUtxo.type = 'P2TR-COMMIT-NOTE'
    }
    if (undefined === toAddress) {
      toAddress = this.currentAccount.tokenAddress!.address!
    }
    const to: ISendToAddress = {
      address: toAddress!,
      amount: MIN_SATOSHIS,
    }

    if (undefined === payUtxos) {
      payUtxos = await this.fetchAllAccountUtxos()
    }
    if (undefined === feeRate) {
      feeRate = (await this.getFeePerKb()).avgFee
    }
    const network = networks[this.btc_wallet.network.includes('livenet') ? 'bitcoin' : 'testnet']

    const finalTx = await createP2TRCommitNotePsbt(
      this,
      payload,
      noteUtxo,
      payUtxos,
      to,
      this.currentAccount.mainAddress!.address!,
      network,
      feeRate
    )
    return {
      noteUtxo: noteUtxo,
      payUtxos,
      txId: finalTx.getId(),
      txHex: finalTx.toHex(),
      feeRate,
    }
  }

  async send(toAddresses: ISendToAddress[]) {
    const utxos = await this.fetchAllAccountUtxos()
    const feeRate = await this.getFeePerKb()
    const network = networks[this.btc_wallet.network.includes('livenet') ? 'bitcoin' : 'testnet']

    const finalTx = await createCoinPsbt(
      this,
      utxos,
      toAddresses,
      this.currentAccount.mainAddress!.address!,
      network,
      feeRate.avgFee
    )
    return await this.urchain.broadcast(finalTx.toHex())
  }

  async sendTokens(tick: string, targets: ISendTarget[]) {
    if (targets == undefined || targets.length < 1) {
      throw new Error('No address found')
    }

    let totalAmt = BigInt(0)
    for (let i = 0; i < targets.length; i++) {
      const curAmt = targets[i].amount
      if (curAmt !== undefined) {
        totalAmt += curAmt
      }
    }

    const tokenUtxos = await this.getTokenUtxos(tick, totalAmt)
    const balance = tokenUtxos.reduce(
      (acc: bigint, cur: ITokenUtxo) => acc + BigInt(cur.amount),
      BigInt(0)
    )
    if (balance < totalAmt) {
      throw new Error('Insufficient balance')
    }

    const amts: bigint[] = []
    const curAddress = targets[0].address
    amts.push(targets[0].amount)

    if (curAddress == undefined) {
      throw new Error('No address found')
    }
    const toAddresses: ISendToAddress[] = [{ address: curAddress, amount: MIN_SATOSHIS }]
    for (let i = 1; i < targets.length; i++) {
      const curAddress = targets[i].address
      amts.push(targets[i].amount)

      if (curAddress !== undefined) {
        toAddresses.push({
          address: curAddress,
          amount: MIN_SATOSHIS,
        })
      }
    }

    const missedTokenUtxos = await this.urchain.tokenutxos(
      [this.currentAccount.mainAddress!.scriptHash],
      tick
    )
    if (balance > BigInt(totalAmt) || missedTokenUtxos.length > 0) {
      toAddresses.push({
        address: this.currentAccount.tokenAddress!.address!,
        amount: MIN_SATOSHIS,
      })
    }
    const transferData: ITransferN20Data = {
      p: 'n20',
      op: 'transfer',
      tick,
      amt: amts,
    }

    const payUtxos: IUtxo[] = await this.fetchAllAccountUtxos()
    if (missedTokenUtxos.length > 0) {
      payUtxos.push(
        ...missedTokenUtxos.map((utxo: IUtxo) => {
          //            utxo.privateKeyWif = this.currentAccount.privateKey;
          utxo.type = this.currentAccount.mainAddress!.type
          return utxo
        })
      )
    }

    const payload = this.buildN20Payload(transferData)
    const feerate = (await this.getFeePerKb()).avgFee
    const tx = await this.buildN20Transaction(payload, toAddresses, tokenUtxos, payUtxos, feerate)

    const result = await this.broadcastTransaction(tx) // {txId:'111111', success: true}; //await this.broadcastTransaction(tx);

    return {
      transferData,
      result,
    }
  }

  async deployToken(
    tick: string,
    max: number,
    lim: number,
    dec: number,
    bitwork: string,
    start: number,
    sch: string | undefined,
    desc: string | undefined,
    logo: string | undefined,
    web: string | undefined
  ) {
    const toAddress = this.currentAccount.mainAddress!.address!
    const deployData: IDeployN20Data = {
      p: 'n20',
      op: 'deploy',
      tick,
      bitwork: stringToBytes(bitwork),
      max: BigInt(max) * 10n ** BigInt(dec),
      lim: BigInt(lim) * 10n ** BigInt(dec),
      dec,
    }

    if (sch == undefined || sch === '') {
      delete deployData.sch
    } else {
      deployData.sch = sch
    }

    if (start == undefined) {
      const bestBlock = await this.bestBlock()
      deployData.start = bestBlock.height
    } else {
      deployData.start = start
    }
    if (desc !== undefined) {
      deployData.desc = desc
    }
    if (logo !== undefined) {
      deployData.logo = logo
    }
    if (web !== undefined) {
      deployData.web = web
    }

    const tx = await this.buildCommitPayloadTransaction(this.buildN20Payload(deployData), toAddress)
    const result = await this.broadcastTransaction(tx) // const result = { success: true, txId: 0 }
    return {
      deployData,
      result,
    }
  }

  async prepareN20PayloadTransaction(
    payload: NotePayload,
    toAddress?: string,
    noteUtxo?: IUtxo,
    payUtxos?: IUtxo[],
    feeRate?: number
  ) {
    if (undefined === noteUtxo) {
      const commitAddress = this.currentAccount.tokenAddress!
      let noteUtxos = await this.urchain.utxos([commitAddress.scriptHash])
      if (noteUtxos.length === 0) {
        const result = await this.send([{ address: commitAddress.address!, amount: MIN_SATOSHIS }])
        if (result.success) {
          for (let i = 0; i < 10; i++) {
            noteUtxos = await this.urchain.utxos([commitAddress.scriptHash])
            if (noteUtxos.length > 0) {
              break
            } else if (i === 9) {
              throw new Error('can not get commit note utxo')
            }
            await sleep(1000)
          }
        } else {
          throw new Error(result.error)
        }
      }
      noteUtxo = noteUtxos[0]!
      noteUtxo.type = 'P2TR-NOTE'
    }
    if (payUtxos === undefined) {
      payUtxos = await this.fetchAllAccountUtxos()
      payUtxos = payUtxos?.filter((utxo) => utxo.scriptHash !== noteUtxo!.scriptHash)
    }
    if (undefined === feeRate) {
      feeRate = (await this.getFeePerKb()).avgFee
    }
    return {
      payload: payload,
      toAddress: toAddress,
      noteUtxo: noteUtxo,
      payUtxos: payUtxos,
      feeRate: feeRate,
    }
  }

  async buildN20PayloadTransaction(
    payload: NotePayload,
    noteUtxo: IUtxo,
    payUtxos: IUtxo[],
    toAddress: string,
    feeRate: number
  ) {
    const result = await this.buildN20Transaction(
      payload,
      [{ address: toAddress, amount: MIN_SATOSHIS }],
      [noteUtxo],
      payUtxos,
      feeRate
    )

    return {
      ...result,
      noteUtxo: result.noteUtxos ? result.noteUtxos[0] : undefined,
    }
  }

  async mintWuKong(
    tick: string,
    amount: bigint,
    difficulty: bigint,
    log_item: HTMLDivElement,
    result_item: HTMLDivElement,
    t: any
  ) {
    let noteNote, payNotes, feeRate
    let result

    mintData.amt = amount
    mintData.tick = tick

    let payload = this.buildN20Payload(mintData)
    //Mint token to the token address
    const toAddress = this.currentAccount.tokenAddress!.address!

    log_item.innerHTML = t('sign1')
    const pre_trans = await this.prepareN20PayloadTransaction(
      payload,
      toAddress,
      noteNote,
      payNotes,
      feeRate
    )
    log_item.innerHTML = t('minting')

    await sleep(100)

    let nonce = 0n
    const startTime = Date.now()
    while (nonce < BigInt(MAX_LOCKTIME)) {
      const ori_data =
        pre_trans.noteUtxo.txId +
        num2bin(BigInt(pre_trans.noteUtxo.outputIndex), 4) +
        num2bin(nonce, 8)
      const hash_data = hash256(ori_data, 'hex')
      const workproof = hash256(hash_data, 'hex')
      const short_proof = workproof.slice(0, 10) + '...' + workproof.slice(-5)
      if (nonce % (5000n * (difficulty + 1n)) === 0n) {
        const elapsed = Date.now() - startTime
        if (elapsed > 0) {
          const hashRate = (nonce * 2000n) / BigInt(elapsed)
          log_item.innerHTML = t('minting') + ' ' + hashRate.toString() + ' Hash/s'
        }
        result_item.innerHTML = short_proof
        await sleep(1)
      }
      if (
        (difficulty === 0n && short_proof.startsWith('0000')) ||
        (difficulty === 2n && short_proof.startsWith('00000')) ||
        (difficulty === 4n && short_proof.startsWith('000000')) ||
        (difficulty === 6n && short_proof.startsWith('0000000')) ||
        (difficulty === 8n && short_proof.startsWith('00000000'))
      ) {
        result_item.innerHTML = short_proof
        break
      } else if (
        difficulty === 1n &&
        short_proof.startsWith('0000') &&
        parseInt(short_proof.slice(4, 6), 16) < 64
      ) {
        result_item.innerHTML = short_proof
        break
      } else if (
        difficulty === 3n &&
        short_proof.startsWith('0000') &&
        parseInt(short_proof.slice(4, 6), 16) < 4
      ) {
        result_item.innerHTML = short_proof
        break
      } else if (
        difficulty === 5n &&
        short_proof.startsWith('000000') &&
        parseInt(short_proof.slice(6, 8), 16) < 64
      ) {
        result_item.innerHTML = short_proof
        break
      } else if (
        difficulty === 7n &&
        short_proof.startsWith('000000') &&
        parseInt(short_proof.slice(6, 8), 16) < 4
      ) {
        result_item.innerHTML = short_proof
        break
      }
      nonce += 1n
    }

    mintData.nonce = nonce
    payload = this.buildN20Payload(mintData)
    log_item.innerHTML = t('sign2')
    const tx = await this.buildN20PayloadTransaction(
      payload,
      pre_trans.noteUtxo,
      pre_trans.payUtxos,
      pre_trans.toAddress!,
      pre_trans.feeRate
    )

    try {
      result = await this.broadcastTransaction(tx)
      return result
    } catch (error) {
      result = await this.broadcastTransaction(tx)
      return result
    }
  }

  async getFeePerKb() {
    let hostname =
      this.config.network === 'testnet' ? 'https://mempool.space/testnet4' : 'https://mempool.space'
    hostname += '/api/v1/'
    const memPool = new Mempool(hostname)
    const feesRecommended = await memPool.getFeePerKb()
    return {
      slowFee: Math.min(feesRecommended.hourFee, feesRecommended.halfHourFee) * 1000,
      avgFee: Math.max(feesRecommended.hourFee, feesRecommended.halfHourFee) * 1000,
      fastFee:
        Math.max(feesRecommended.hourFee, feesRecommended.halfHourFee, feesRecommended.fastestFee) *
        1000,
    }
  }

  async getContracts() {
    const noteOrg = new NoteOrg('https://notescan.io')
    const contracts = await noteOrg.getContracts(this.config.network)
    return contracts
  }
}

export default N20Wallet
