import 'dotenv/config';
import { getAaveFinancialData, getTransactionHistory } from './src/web3/contract.ts';

async function main() {
  const address = '0xbB72CAf6cE7D61941F3798B3B86843219774B874';
  
  console.log("=== Testing getAaveFinancialData ===");
  try { 
    const data = await getAaveFinancialData();
    console.log("Aave Data:", data);
  } catch (e) { 
    console.error("Aave Error:", e);
  }

  console.log("\n=== Testing getTransactionHistory ===");
  try {
    const history = await getTransactionHistory(address);
    console.log("History Data:", history);
  } catch (e) {
    console.error("History Error:", e);
  }
}

main().catch(console.error);
