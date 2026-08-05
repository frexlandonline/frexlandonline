import { base } from '@reown/appkit/networks';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

export const projectId = '1399d82c6b4784de43805943031fefa6'; // User's Reown ID

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [base]
});

export const config = wagmiAdapter.wagmiConfig;
