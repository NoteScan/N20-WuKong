import varuint from 'varuint-bitcoin'
import ecc from '@bitcoinerlab/secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import { NotePayload } from './n20_types'
import { ECPairFactory } from 'ecpair'

import { MAX_DATA_SEGMENTS, MAX_SCRIPT_ELEMENT_SIZE, NOTE_PROTOCOL_ENVELOPE_ID } from './n20_config'

bitcoin.initEccLib(ecc)
const ECPair = ECPairFactory(ecc)

export function splitBufferIntoSegments(
  buffer: Buffer,
  segmentSize = MAX_SCRIPT_ELEMENT_SIZE,
  maxSegments = MAX_DATA_SEGMENTS
): Buffer[] {
  if (buffer.length / segmentSize > maxSegments) {
    throw new Error(`Buffer size exceeds the maximum allowed number of segments (${maxSegments}).`)
  }

  const segments: Buffer[] = []
  let i = 0
  while (i < buffer.length) {
    const start = i
    const end = Math.min((i += segmentSize), buffer.length)
    const segment = buffer.subarray(start, end)
    segments.push(Buffer.from(segment))
  }

  return segments
}

export function interpolate(template: string, params: any) {
  const names = Object.keys(params)
  const vals = Object.values(params)
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(...names, `return \`${template}\`;`)(...vals)
}

export function buildNoteScript(xOnlyPubkey: Buffer) {
  //4e4f5445 -> NOTE
  const scriptASM = `${Buffer.from(NOTE_PROTOCOL_ENVELOPE_ID, 'utf8').toString(
    'hex'
  )} OP_2DROP OP_2DROP OP_2DROP ${xOnlyPubkey.toString('hex')} OP_CHECKSIG`
  return scriptASM
}

export function buildCommitNoteScript(payload: NotePayload, xOnlyPubkey: Buffer) {
  //4e4f5445 -> NOTE
  const scriptASM = `${payload.data0 !== '' ? payload.data0 : 'OP_FALSE'} ${payload.data1 !== '' ? payload.data1 : 'OP_FALSE'} ${payload.data2 !== '' ? payload.data2 : 'OP_FALSE'} ${payload.data3 !== '' ? payload.data3 : 'OP_FALSE'} ${payload.data4 !== '' ? payload.data4 : 'OP_FALSE'} ${Buffer.from(
    NOTE_PROTOCOL_ENVELOPE_ID,
    'utf8'
  ).toString('hex')} OP_2DROP OP_2DROP OP_2DROP ${xOnlyPubkey.toString('hex')} OP_CHECKSIG`
  return scriptASM
}

/**
 * Helper function that produces a serialized witness script
 * https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/csv.spec.ts#L477
 */
export function witnessStackToScriptWitness(witness: Buffer[]) {
  let buffer = Buffer.allocUnsafe(0)

  function writeSlice(slice: Buffer) {
    buffer = Buffer.concat([buffer, Buffer.from(slice)])
  }

  function writeVarInt(i: number) {
    const currentLen = buffer.length
    const varintLen = varuint.encodingLength(i)

    buffer = Buffer.concat([buffer, Buffer.allocUnsafe(varintLen)])
    varuint.encode(i, buffer, currentLen)
  }

  function writeVarSlice(slice: Buffer) {
    writeVarInt(slice.length)
    writeSlice(slice)
  }

  function writeVector(vector: Buffer[]) {
    writeVarInt(vector.length)
    vector.forEach(writeVarSlice)
  }

  writeVector(witness)

  return buffer
}

export function toXOnly(pubkey: Buffer): Buffer {
  return Buffer.from(pubkey.subarray(1, 33))
}

export async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function getValidatedHexString(hex: string, allowEmpty: boolean = true): string {
  const ret = hex.trim()
  if (ret.length < 1 && !allowEmpty) {
    throw new Error("can't be empty string")
  }
  if (ret.length % 2) {
    throw new Error('<'.concat(ret, '> should have even length'))
  }
  if (ret.length > 0 && !/^[\da-f]+$/i.test(ret)) {
    throw new Error('<'.concat(ret, '> should only contain [0-9] or characters [a-fA-F]'))
  }
  return ret
}

export function stringToBytes(str: string) {
  const encoder = new TextEncoder()
  const uint8array = encoder.encode(str)
  return getValidatedHexString(Buffer.from(uint8array).toString('hex'))
}

export function num2bin(num: bigint, bytes: number): string {
  if (num < 0n) {
    throw new Error("Input must be a non-negative bigint");
  }
  const hex = num.toString(16).padStart(bytes * 2, '0');

  if (hex.length > bytes * 2) {
    throw new Error(`Number too large to fit in ${bytes} bytes`);
  }

  // Reverse the byte order
  const byteArray = hex.match(/.{1,2}/g)?.reverse() || [];
  return byteArray.join('');
}

export function hash256(hexstr, encoding) {
  return bitcoin.crypto.hash256(Buffer.from(hexstr, encoding || 'hex')).toString('hex');
}
