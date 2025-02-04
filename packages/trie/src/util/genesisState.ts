import { RLP } from '@nomicfoundation/ethereumjs-rlp'
import {
  Account,
  isHexPrefixed,
  toBytes,
  unpadBytes,
  unprefixedHexToBytes,
} from '@nomicfoundation/ethereumjs-util'
import { keccak256 as bufferKeccak256 } from 'ethereum-cryptography/keccak.js'

import { Trie } from '../trie.js'

import type { AccountState, GenesisState } from '@nomicfoundation/ethereumjs-util'

function keccak256(msg: Uint8Array): Uint8Array {
  return new Uint8Array(bufferKeccak256(Buffer.from(msg)))
}

/**
 * Derives the stateRoot of the genesis block based on genesis allocations
 */
export async function genesisStateRoot(genesisState: GenesisState) {
  const trie = new Trie({ useKeyHashing: true })
  for (const [key, value] of Object.entries(genesisState)) {
    const address = isHexPrefixed(key) ? toBytes(key) : unprefixedHexToBytes(key)
    const account = new Account()
    if (typeof value === 'string') {
      account.balance = BigInt(value)
    } else {
      const [balance, code, storage, nonce] = value as Partial<AccountState>
      if (balance !== undefined) {
        account.balance = BigInt(balance)
      }
      if (code !== undefined) {
        const codeBytes = isHexPrefixed(code) ? toBytes(code) : unprefixedHexToBytes(code)
        account.codeHash = keccak256(codeBytes)
      }
      if (storage !== undefined) {
        const storageTrie = new Trie({ useKeyHashing: true })
        for (const [k, val] of storage) {
          const storageKey = isHexPrefixed(k) ? toBytes(k) : unprefixedHexToBytes(k)
          const storageVal = RLP.encode(
            unpadBytes(isHexPrefixed(val) ? toBytes(val) : unprefixedHexToBytes(val))
          )
          await storageTrie.put(storageKey, storageVal)
        }
        account.storageRoot = storageTrie.root()
      }
      if (nonce !== undefined) {
        account.nonce = BigInt(nonce)
      }
    }
    await trie.put(address, account.serialize())
  }
  return trie.root()
}
