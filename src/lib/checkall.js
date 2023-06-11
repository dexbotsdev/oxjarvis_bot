
import axios from 'axios';
import HoneypotCheckerCaller from '../api/HoneypotCheckerCaller.js';
import Web3 from 'web3';

import { HoneypotIsV1 } from '@normalizex/honeypot-is';



const checkAll = async (tokenAddress) => {

  const checkAllresult = await getTokenDetails(tokenAddress).then(res => res);
  return checkAllresult;
}

const getTokenDetails = async (tokenAddress) => {
  let tokenInfo = {};
  const honeypotis = new HoneypotIsV1();

  if (!Web3.utils.isAddress(tokenAddress)) {
    tokenInfo = {
      status: 0,
      mesg: 'Not a Valid Address'
    }
    return tokenInfo;
  }
  const dexscreener = await axios
    .get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
    .then((res) => res)
    .catch((err) => null);


  if (dexscreener === null) {
    tokenInfo = {
      status: 0,
      mesg: 'Token data not updated'
    }
    return tokenInfo;

  }


  if (dexscreener.data.pairs != null) {

    const pusd = Number(dexscreener.data.pairs[0].priceUsd);
    const pnat = Number(dexscreener.data.pairs[0].priceNative)

    const quotePrice = 2 * pusd / pnat;

    let liquidityinQuote = 0;
    let liquiditys = 0;
    if (dexscreener.data.pairs[0]?.liquidity) {
      liquidityinQuote = Number(dexscreener.data.pairs[0]?.liquidity?.usd) / quotePrice;
      liquiditys = Number(dexscreener.data.pairs[0]?.liquidity?.usd);
    }
    const liquidity = Number(liquidityinQuote).toFixed(2) + dexscreener.data.pairs[0].quoteToken.symbol + ' ($' + liquiditys.toFixed(2) / 2 + ')';

    const chainId = dexscreener.data.pairs[0].chainId;
    const dexId = dexscreener.data.pairs[0].dexId;
    const name = dexscreener.data.pairs[0].baseToken.name;
    const symbol = dexscreener.data.pairs[0].baseToken.symbol;
    const priceUsd = dexscreener.data.pairs[0].priceUsd;
    const pairCreatedAt = dexscreener.data.pairs[0].pairCreatedAt;
    const h1 = dexscreener.data.pairs[0].priceChange.h1;
    const fdv = dexscreener?.data?.pairs[0]?.fdv;
    await honeypotis.honeypotScan(
      BUSD,
      BUSD_PAIRS[0].Router,
      BUSD_PAIRS[0].Pair,
      CHAIN_ID
    ).then((result) => {

      tokenInfo = {
        status: 1,
        name: name,
        symbol: symbol,
        network: String(chainId).toUpperCase(),
        dexId: String(dexId).toUpperCase(),
        h1: h1,
        buygas: result.BuyGas,
        sellgas: result.SellGas,
        buyTax: result.BuyTax,
        sellTax: result.SellTax,
        liquidity: liquidity,
        priceUsd: Number(priceUsd) + ' (in usd )',
        pairCreatedAt: new Date(pairCreatedAt).toLocaleDateString(),
        isHoneyPot: result.IsHoneyPot ? 'FAILED' : 'PASSED',
        fdv: fdv
      }
    });

  }

  return tokenInfo;

}


export default getTokenDetails;