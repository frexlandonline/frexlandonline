import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

async function main() {
  const client = createPublicClient({ chain: base, transport: http() });
  const CONTRACT_ADDRESS = '0x8bb01A4e20638A58c168a9a6745d0F62231B0b94';
  
  try {
    const logs = await client.getLogs({
      address: CONTRACT_ADDRESS,
      event: {
        type: 'event',
        name: 'EntradaRegistrada',
        inputs: [
          { indexed: true, name: 'usuario', type: 'address' },
          { indexed: false, name: 'monto', type: 'uint256' }
        ]
      },
      fromBlock: 15000000n, // an older block
      toBlock: 'latest'
    });
    console.log("Logs fetched from 15000000n:", logs.length);
  } catch (e) {
    console.error("Failed from 15000000n:", e.message);
  }
}

main();
