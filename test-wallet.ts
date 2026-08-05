import 'dotenv/config';
import { getHighScoreFromChain, checkVerificationOnChain, getRewardTokenAddress, getTransactionHistory } from './src/web3/contract.ts';

async function main() {
  const address = '0xbB72CAf6cE7D61941F3798B3B86843219774B874';
  
  console.log("Testing getHighScoreFromChain...");
  try { await getHighScoreFromChain(address); console.log("OK"); } catch (e) { console.error(e); }

  console.log("Testing checkVerificationOnChain...");
  try { await checkVerificationOnChain(address); console.log("OK"); } catch (e) { console.error(e); }

  console.log("Testing getRewardTokenAddress...");
  try { await getRewardTokenAddress(); console.log("OK"); } catch (e) { console.error(e); }
  
  console.log("Testing getTransactionHistory...");
  try { await getTransactionHistory(address); console.log("OK"); } catch (e) { console.error(e); }
}

main().catch(console.error);
