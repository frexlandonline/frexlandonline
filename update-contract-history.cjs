const fs = require('fs');
const path = require('path');

const contractTsPath = path.join(__dirname, 'src/web3/contract.ts');
let contractTs = fs.readFileSync(contractTsPath, 'utf8');

const newFunctions = `
/**
 * Obtiene el historial de transacciones del usuario.
 */
export async function getTransactionHistory(address: string): Promise<any[]> {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return [];
  const publicClient = getPublicClient();
  
  try {
    const fromBlock = 10000000n; // approximate safe block on base sepolia

    const deposits = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'EntradaRegistrada',
        inputs: [
          { indexed: true, name: 'usuario', type: 'address' },
          { indexed: false, name: 'monto', type: 'uint256' }
        ]
      },
      args: {
        usuario: address as \`0x\${string}\`
      },
      fromBlock,
      toBlock: 'latest'
    });

    const withdrawals = await publicClient.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'RetiroCapital',
        inputs: [
          { indexed: true, name: 'usuario', type: 'address' },
          { indexed: false, name: 'monto', type: 'uint256' }
        ]
      },
      args: {
        usuario: address as \`0x\${string}\`
      },
      fromBlock,
      toBlock: 'latest'
    });

    const allEvents = [];
    for (const log of deposits) {
      const block = await publicClient.getBlock({ blockNumber: log.blockNumber! });
      allEvents.push({
        type: 'Depósito',
        amount: Number(log.args.monto || 0n) / 1e6,
        hash: log.transactionHash,
        timestamp: Number(block.timestamp) * 1000
      });
    }

    for (const log of withdrawals) {
      const block = await publicClient.getBlock({ blockNumber: log.blockNumber! });
      allEvents.push({
        type: 'Retiro',
        amount: Number(log.args.monto || 0n) / 1e6,
        hash: log.transactionHash,
        timestamp: Number(block.timestamp) * 1000
      });
    }

    // Sort by timestamp descending
    return allEvents.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}
`;

if (!contractTs.includes('getTransactionHistory')) {
  contractTs += newFunctions;
  fs.writeFileSync(contractTsPath, contractTs);
  console.log('Added getTransactionHistory to contract.ts');
}
