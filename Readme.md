# Tournament lottery

Implementation of a lottery in Ethereum that uses a tournament of coin tosses. This project is heavily inspired by Miller and Bentov's paper [Zero-Collateral Lotteries in Bitcoin and Ethereum](https://ieeexplore.ieee.org/abstract/document/7966964).


## How to build

Make sure you have
- NPM/Yarn
- Truffle
- Ganache
  
You might need to configure `truffle-config.js` if you run Ganache on a different port or something.

```bash
# Install packages
npm install
# Or if you use yarn
yarn

# Start your Ganache blockchain
ganache-cli

# Compile solidity contracts
truffle compile

# Run the tests
truffle test
```

## Notes

There are currently two slightly different implementations in two separate branches.