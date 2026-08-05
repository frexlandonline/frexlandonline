require("dotenv/config");

module.exports = {
  plugins: [
    "@nomicfoundation/hardhat-ethers",
    "@nomicfoundation/hardhat-verify"
  ],
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    baseMainnet: {
      type: "http",
      url: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: {
      base: "9VZ75BJXQSWYH2QTNKV636UH916MR5HK5B"
    }
  }
};
