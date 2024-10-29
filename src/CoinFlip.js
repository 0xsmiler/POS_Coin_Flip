import React, { useState, useEffect } from 'react';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import heads from '../public/heads.png'; // Adjust the import according to your file structure
import tails from '../public/tails.png'; // Adjust the import according to your file structure
import Coin from './Coin';
import './CoinToss.css';

import { TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount, getAssociatedTokenAddress, transfer, getAccount, createTransferInstruction } from '@solana/spl-token';
const DECIMALS = 6; // Number of decimals for the POS token
const POS_AMOUNT = 50;

const COIN_FLIP_AMOUNT = POS_AMOUNT * (10 ** DECIMALS); // 0.01 SOL in lamports (1 SOL = 1,000,000,000 lamports)

// const HOUSE_PUBLIC_KEY = new PublicKey('APu8XaL1L8vHFiBdcVWxDcU2uouFiWJFMG8ePTW8mBPz'); // Replace with the house's public key-
const HOUSE_PUBLIC_KEY = new PublicKey('6XRbeYdCysj3yn4rmveoipom9UHK9suM9FcNmFCKEQe'); // Replace with the house's public key
const POS_TOKEN_MINT_ADDRESS = new PublicKey("B8vV6An7xFF3bARB1cmU7TMfKNjjes2WvY7jWqiRc6K6");

const CoinFlip = ({ coinFace = [heads, tails] }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flipAnimation, setFlipAnimation] = useState(false);
  // const [frontFace, setFrontFace] = useState(randomCoinFace());
  // const [backFace, setBackFace] = useState(randomCoinFace());
  const [face, setCoinFace ] = useState(randomCoinFace());
  // const [isWin, setWinStatus ] = useState()
  const [flips, setFlips] = useState(0);
  const [headsCount, setHeadsCount] = useState(0);
  const [tailsCount, setTailsCount] = useState(0);
  const [balance, setBalance ] = useState(0);

  function randomCoinFace() {
    return coinFace[Math.floor(Math.random() * coinFace.length)];
  }

  useEffect(() => {
    if (publicKey) {
      getBalance();
    }
  }, [publicKey]);

  const getBalance = async () => {
    try {
      const tokenAccountAddress = await getAssociatedTokenAddress(
        POS_TOKEN_MINT_ADDRESS,
        publicKey
      );
      console.log("tokenAccountAddress:", tokenAccountAddress.toString());
      const tokenPublicKey = new PublicKey(tokenAccountAddress);

      const accountInfo = await getAccount(connection, tokenPublicKey);
      console.log("accountInfo:", accountInfo);
      setBalance(Number(accountInfo.amount) / 1e6);
  
    } catch (error) {
      console.error("Error fetching balance:", error);
      if (error.name === 'TokenAccountNotFoundError') {
        console.warn("Token account not found, creating new associated token account...");
        // Create token account logic...
      } else {
        console.error("Failed to fetch balance:", error);
      }
    }
  };

  const reset = () => {
    setFlips(0);
    setHeadsCount(0);
    setTailsCount(0);
  };

  let flipCoinInner = 'flip-coin-inner';

  if (flipAnimation) {
    flipCoinInner += 'flip-animation';
  }

  const flipCoin = async (e) => {


    setFlipAnimation(true);

    const changeFace = randomCoinFace();
    const isHead = e.target.innerText === "Toss Head!";
    const isWin = isHead ? changeFace === heads : changeFace === tails;

    setTimeout(() => {
      setCoinFace(changeFace === heads ? coinFace[0] : coinFace[1]);
      setHeadsCount(prev => changeFace === heads ? prev + 1 : prev);
      setTailsCount(prev => changeFace === tails ? prev + 1 : prev);
      setFlips(prev => prev + 1);
    }, 50);


    setTimeout(() => {
      setFlipAnimation(false);
    }, 100);
    if (!publicKey) {
      alert('Please connect your wallet!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const fromPubkey = isWin ? HOUSE_PUBLIC_KEY : publicKey; // House pays if the user wins
      const toPubkey = isWin ? publicKey : HOUSE_PUBLIC_KEY;   // User pays if they lose

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        POS_TOKEN_MINT_ADDRESS,
        fromPubkey
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        POS_TOKEN_MINT_ADDRESS,
        toPubkey
      );

      if (!fromTokenAccount || !toTokenAccount) {
        throw new Error('Token accounts are undefined');
      }
      console.log("fromTokenAccount:", fromTokenAccount.address.toString(), "toTokenAccount:", toTokenAccount.address.toString());

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount.address,
          toTokenAccount.address,
          publicKey,
          COIN_FLIP_AMOUNT,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendTransaction(transaction, connection);


      setResult(isWin ? 'You won 50 POS tokens!' : 'You lost 50 POS tokens.');
      await getBalance();
    } catch (error) {
      console.error('Transaction failed:', error);
      setResult('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // <div>
    //   <button onClick={flipCoin} disabled={loading}>
    //     {loading ? 'Flipping...' : 'Flip Coin'}
    //   </button>
    //   {result && <p>{result}</p>}
    // </div>
    <div className="CoinToss">
      <h1>Coin Toss</h1>
      <p>Balance: {balance} POS</p>
      <div className="flip-coin">
        <div className={flipCoinInner}>
          {/* <div className="flip-coin-front">
            <Coin face={frontFace} />
          </div>
          <div className="flip-coin-back">
            <Coin face={backFace} />
          </div> */}
          <Coin face={face}/>
        </div>
      </div>
      <button disabled={loading} value="Head" onClick={flipCoin} >
        {loading ? 'Waiting...' : 'Toss Head!'}
      </button>
      <button disabled={loading} onClick={flipCoin} value="Tail">
        {loading ? 'Waiting...' : 'Toss Tail!'}
      </button>
      <button onClick={reset}>Reset</button>
      <p>
        Out of {flips}, there has been {headsCount} heads and {tailsCount} tails.
      </p>
      {result && <p>{result}</p>}
    
    </div>
  );
};

export default CoinFlip;