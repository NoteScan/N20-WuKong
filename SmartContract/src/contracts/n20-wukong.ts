import { assert, ByteString, method, prop, SmartContract, hash256, slice, byteString2Int, toByteString, FixedArray } from 'scrypt-ts'
import { num2bin } from 'scryptlib'

export type Input = {
    prevTxId: ByteString
    outputIndex: bigint
    sequenceNumber: bigint
}

export class N20_WuKong extends SmartContract {
    static readonly INPUT_NUM = 1
    static readonly MAX_DIFFICULTY = 9n

    @prop()
    readonly tick: ByteString

    @prop()
    readonly max: bigint

    @prop()
    readonly lim: bigint

    @prop()
    readonly dec: bigint

    constructor(tick: ByteString, max: bigint, lim: bigint, dec: bigint) {
        super(...arguments)
        this.tick = tick
        this.max = max
        this.lim = lim
        this.dec = dec
    }

    @method()
    getDifficulty(currentMined: bigint): bigint {
        let difficulty: bigint = 0n

        const threshold = this.max / N20_WuKong.MAX_DIFFICULTY

        for (let n = 0n; n < N20_WuKong.MAX_DIFFICULTY; n++) {
            if (threshold * n < currentMined) {
                difficulty = n
            }
        }

        return difficulty
    }

    @method()
    public mint(tick: ByteString, amt: bigint, total: bigint, nonce: bigint, inputs: FixedArray<Input, typeof N20_WuKong.INPUT_NUM>) {
        const data = hash256(inputs[0].prevTxId + num2bin(inputs[0].outputIndex, 4) + num2bin(nonce, 8))
        const workproof = hash256(data)

        const difficulty = this.getDifficulty(total)

        assert(slice(workproof, 0n, 2n) == toByteString('0000'), 'not match target')
        
        if (difficulty >= 4n) {
            assert(slice(workproof, 0n, 3n) == toByteString('000000'), 'not match target')
        }
        if (difficulty >= 8n) {
            assert(slice(workproof, 0n, 4n) == toByteString('00000000'), 'not match target')
        }

        if (difficulty == 1n) {
            assert(byteString2Int(slice(workproof, 2n, 3n) + toByteString('00')) < 64, 'not match target')
        } else if (difficulty == 2n) {
            assert(byteString2Int(slice(workproof, 2n, 3n) + toByteString('00')) < 16, 'not match target')
        } else if (difficulty == 3n) {
            assert(byteString2Int(slice(workproof, 2n, 3n) + toByteString('00')) < 4, 'not match target')
        } else if (difficulty == 5n) {
            assert(byteString2Int(slice(workproof, 3n, 4n) + toByteString('00')) < 64, 'not match target')
        } else if (difficulty == 6n) {
            assert(byteString2Int(slice(workproof, 3n, 4n) + toByteString('00')) < 16, 'not match target')
        } else if (difficulty == 7n) {
            assert(byteString2Int(slice(workproof, 3n, 4n) + toByteString('00')) < 4, 'not match target')
        } 

        assert(this.max == 0n || total <= this.max, 'Over max')
        assert(tick == this.tick, 'Tick does not match')
        assert(amt <= this.lim && amt <= this.max - total, 'Amount check failed')
    }

    @method()
    public transfer(tick: ByteString) {
        assert(tick == this.tick, 'Tick does not match')
    }
}
