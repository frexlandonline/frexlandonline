import ethersPlugin from "@nomicfoundation/hardhat-ethers";
import verifyPlugin from "@nomicfoundation/hardhat-verify";
import upgradesPlugin from "@openzeppelin/hardhat-upgrades";
import "dotenv/config";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  plugins: [ethersPlugin, verifyPlugin, upgradesPlugin],
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
    baseSepolia: {
      type: "http",
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
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
