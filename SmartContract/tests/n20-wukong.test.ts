/* eslint-disable @typescript-eslint/no-unused-vars */
import { expect, use } from 'chai'
import { toByteString } from 'scrypt-ts'
import { N20_WuKong } from '../src/contracts/n20-wukong'
import { getDefaultSigner } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)
import { stringToBytes } from 'scryptlib'
import { offlineVerify } from 'scrypt-verify'
import wuKongJson from '../artifacts/n20-wukong.json'

const tick = 'WUKONG'

const deployData = {
    p: 'n20',
    op: 'deploy',
    tick,
    max: 81n * 10000n * 10000n * 10n ** 8n,
    lim: 1000n * 10n ** 8n,
    dec: 8,
    sch: '50b13619d4d936d7c5c7fb7dfbe752e33b85b33774e9e2b3779f16791fb1c749',
}

const mintData = {
    p: 'n20',
    op: 'mint',
    tick,
    amt: 1000n * 10n ** 8n,
    nonce: 0n,
}

const inputData = {
    prevTxId: 'c3d007b2ad1789c885d6cc5b9c02bbe6a00ff56bca5af70f25cb7209ddf0413c',
    outputIndex: 0n,
    sequenceNumber: 0xffffffffn,
}

describe('Test SmartContract `N20_WuKong`', () => {
    let instance: N20_WuKong

    before(async () => {})

    it('offline verify successfully.', async () => {
        const dataMap = {
            constructor: {
                p: stringToBytes(deployData.p),
                op: stringToBytes(deployData.op),
                tick: stringToBytes(deployData.tick),
                max: deployData.max,
                lim: deployData.lim,
                dec: deployData.dec,
                sch: deployData.sch,
            },
            mint: {
                p: stringToBytes(mintData.p),
                op: stringToBytes(mintData.op),
                tick: stringToBytes(mintData.tick),
                max: deployData.max,
                lim: deployData.lim,
                dec: deployData.dec,
                sch: deployData.sch,
                amt: mintData.amt,
                total: 90000000000000000n,
                inputs: [inputData, inputData, inputData, inputData, inputData, inputData, inputData],
                nonce: 203723n, //7224857n,
            },
            transfer: { tick: stringToBytes(deployData.tick) },
        }
        console.log('🚀 ~ it ~ dataMap:', dataMap)

        const result = offlineVerify(wuKongJson, dataMap, 'mint')
        console.log('🚀 ~ it ~ result:', result)
        expect(result.success).is.true
    })
    it('should pass the public method unit test successfully.', async () => {
        await N20_WuKong.loadArtifact()

        instance = new N20_WuKong(toByteString(tick, true), deployData.max, deployData.lim, BigInt(deployData.dec))

        await instance.connect(getDefaultSigner())

        const deployTx = await instance.deploy(1000)

        const call = async () => {
            {
                const callRes = await instance.methods.mint(toByteString(tick, true), mintData.amt, 180000000000000000n, 203723n, [inputData])
            }
        }
        await expect(call()).not.to.be.rejected
    })
})
