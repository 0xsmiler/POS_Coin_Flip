import React from 'react';

const Coin = ({ face }) => {
  return (
    <img className='Coin-img' src={face} alt={`coin showing ${face}`} />
  );
};

export default Coin;