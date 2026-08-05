import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const CONTRACT_ADDRESS = '0x8bb01A4e20638A58c168a9a6745d0F62231B0b94';
const aUSDCAddress = '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB';

const CONTRACT_ABI = [
  { inputs: [], name: 'totalCapitalDepositado', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'saldosUsuarios', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
];

const aUSDC_ABI = [
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
];

async function main() {
  const client = createPublicClient({ chain: base, transport: http() });

  try {
    const totalDepositedRaw = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'totalCapitalDepositado'
    });
    console.log("Total Deposited:", totalDepositedRaw);
    
    const currentBalanceRaw = await client.readContract({
      address: aUSDCAddress,
      abi: aUSDC_ABI,
      functionName: 'balanceOf',
      args: [CONTRACT_ADDRESS]
    });
    console.log("Current aUSDC Balance:", currentBalanceRaw);

    const totalDeposited = Number(totalDepositedRaw) / 1e6;
    const currentBalance = Number(currentBalanceRaw) / 1e6;
    const interest = Math.max(0, currentBalance - totalDeposited);
    console.log({ totalDeposited, currentBalance, interest });

  } catch (e) {
    console.error("Error reading financial data:", e);
  }

  try {
    console.log("Fetching logs...");
    const deposits = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'EntradaRegistrada',
        inputs: [
          { indexed: true, name: 'usuario', type: 'address' },
          { indexed: false, name: 'monto', type: 'uint256' }
        ]
      },
      fromBlock: await client.getBlockNumber() - 2000n,
      toBlock: 'latest'
    });
    console.log("Logs count:", deposits.length);
  } catch (e) {
    console.error("Error fetching logs:", e);
  }
}

main().catch(console.error);
