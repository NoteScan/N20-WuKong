# WuKong Smart Contract

This smart contract, built using sCrypt, is designed for the [NOTE Protocol](https://noteprotocol.org).

The contract features an adaptive mining difficulty that adjusts based on mining progress, with a maximum of 9 difficulty levels. The total token supply is divided into 9 parts, with the mining difficulty quadrupling after each part is mined.

## Getting Started

Follow these steps to set up and test the smart contract.

### Prerequisites

- [Node.js](https://nodejs.org/)
- [sCrypt Bitcoin Script Language](https://docs.scrypt.io/)
- [NOTE Protocol](https://noteprotocol.org/)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/NoteScan/N20-WuKong
cd N20-WuKong/SmartContract
```

1. Install dependencies:

```bash
pnpm i
```

### Usage

To compile the contract:

```bash
pnpm compile
```

To test the contract:

```bash
pnpm test
```

## License

This project is licensed under the MIT License.
