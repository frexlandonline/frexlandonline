const fs = require('fs');

const code = `
export async function getAaveFinancialData() {
  if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return { totalDeposited: 0, currentBalance: 0, interest: 0 };
  try {
    const client = createPublicClient({ chain: base, transport: http() });
    const totalDepositedRaw = await client.readContract({
      address: CONTRACT_ADDRESS as \`0x\${string}\`,
      abi: CONTRACT_ABI,
      functionName: 'totalCapitalDepositado'
    });

    const aUSDCAddress = '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB';
    const aUSDC_ABI = [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }];

    const currentBalanceRaw = await client.readContract({
      address: aUSDCAddress,
      abi: aUSDC_ABI,
      functionName: 'balanceOf',
      args: [CONTRACT_ADDRESS]
    });

    const totalDeposited = Number(totalDepositedRaw) / 1e6;
    const currentBalance = Number(currentBalanceRaw) / 1e6;
    const interest = Math.max(0, currentBalance - totalDeposited);

    return { totalDeposited, currentBalance, interest };
  } catch (error) {
    console.error('Error fetching Aave data:', error);
    return { totalDeposited: 0, currentBalance: 0, interest: 0 };
  }
}
`;

fs.appendFileSync('src/web3/contract.ts', code);
console.log('Appended successfully');
