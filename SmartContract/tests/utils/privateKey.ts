import { bsv } from 'scrypt-ts'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

export function genPrivKey(network: bsv.Networks.Network): bsv.PrivateKey {
    dotenv.config({
        path: '.env',
    })

    const privKeyStr = process.env.PRIVATE_KEY
    let privKey: bsv.PrivateKey
    if (privKeyStr) {
        privKey = bsv.PrivateKey.fromWIF(privKeyStr as string)
    } else {
        privKey = bsv.PrivateKey.fromRandom(network)

        fs.writeFileSync('.env', `PRIVATE_KEY="${privKey}"`)
    }

    return privKey
}

export const myPrivateKey = genPrivKey(bsv.Networks.testnet)

export const myPublicKey = bsv.PublicKey.fromPrivateKey(myPrivateKey)
export const myPublicKeyHash = bsv.crypto.Hash.sha256ripemd160(myPublicKey.toBuffer())
export const myAddress = myPublicKey.toAddress()
