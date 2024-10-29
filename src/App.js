import logo from './logo.svg';
import './App.css';
import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import CoinFlip from './CoinFlip.js';


function App() {
  const endpoint = useMemo(() => "https://burned-convincing-season.solana-mainnet.quiknode.pro/0dc131b3dc50bc60b14daa97edf2a257af0dd3f7", []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <h1>Solana Coin Flip</h1>
            <WalletMultiButton />
            <CoinFlip />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
