import { assert, ByteString, method, prop, SmartContract, hash256, slice, rshift, len, toByteString, FixedArray } from 'scrypt-ts'
import { num2bin } from 'scryptlib'

export type Input = {
    prevTxId: ByteString
    outputIndex: bigint
    sequenceNumber: bigint
}

export class N20_WuKong extends SmartContract {
    static readonly INPUT_NUM = 1

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
    getBitwork(currentMined: bigint): ByteString {
        let bitwork: ByteString = toByteString('')

        // Set the initial halving threshold
        const threshold = this.max / 9n

        // Increase difficulty max 9 times
        for (let difficulty = 0n; difficulty < 9n; difficulty++) {
            if (threshold * difficulty < currentMined) {
                bitwork += toByteString('00')
            }
        }

        return bitwork
    }

    @method()
    public mint(tick: ByteString, amt: bigint, total: bigint, nonce: bigint, inputs: FixedArray<Input, typeof N20_WuKong.INPUT_NUM>) {
        const data = hash256(inputs[0].prevTxId + num2bin(inputs[0].outputIndex, 4) + num2bin(nonce, 8))
        const workproof = hash256(data)

        const bitwork = this.getBitwork(total)
        assert(slice(workproof, 0n, len(bitwork)) == bitwork, 'not match target')

        assert(this.max == 0n || total <= this.max, 'Over max')
        assert(tick == this.tick, 'Tick does not match')
        assert(amt <= this.lim && amt <= this.max - total, 'Amount check failed')
    }

    @method()
    public transfer(tick: ByteString) {
        assert(tick == this.tick, 'Tick does not match')
    }
}
