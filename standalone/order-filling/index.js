import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

// Constants
const CONSTANTS = {
  EIP712_FILL_HASHER: '0x845a2Da2D70fEDe8474b1C8518200798c60aC364',
  TOKEN_TRANSFER_PROXY: '0x38aef22152BC8965bf0af7Cf53586e4b0C4E9936',
  USDC_ADDRESS: '0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B',
  TAKER_ADDRESS: '0xADb93842A9cEa59A11Fed9E3D9870D37eb2eC9Dd',
  DOMAIN_NAME: 'SX Bet',
  DOMAIN_VERSION: '6.0',
  CHAIN_ID: 4162,
  API_BASE_URL: 'https://api.sx.bet'
};

/**
 * Fetches active orders from the SX Bet API
 * @param {string} maker The maker's address
 * @param {string} [chainVersion='SXR'] The chain version
 * @returns {Promise<Array>} Array of active orders
 */
async function fetchActiveOrders(maker, chainVersion = 'SXR') {
  try {
    const response = await fetch(
      `${CONSTANTS.API_BASE_URL}/orders?maker=${maker}&chainVersion=${chainVersion}`
    );
    
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(`API error: ${JSON.stringify(data)}`);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching active orders:', error.message);
    return [];
  }
}

/**
 * Converts percentage odds to display format
 * @param {string} percentageOdds The odds in percentage format (10^20 precision)
 * @returns {string} Formatted odds string
 */
function formatOdds(percentageOdds) {
  const impliedOdds = BigInt(percentageOdds) * BigInt(100) / BigInt(10**20);
  return `${impliedOdds.toString()}%`;
}

/**
 * Calculates potential payout based on bet amount and odds
 * @param {string} betAmount The bet amount (in base units)
 * @param {string} percentageOdds The odds in percentage format (10^20 precision)
 * @returns {string} Potential payout amount (in base units)
 */
function calculatePotentialPayout(betAmount, percentageOdds) {
  const amount = BigInt(betAmount);
  const odds = BigInt(percentageOdds);
  const base = BigInt(10**20);
  
  const denominator = base - odds;
  const payout = amount * base / denominator;
  
  return payout.toString();
}

/**
 * Generates a random fill salt
 * @returns {string} Random fill salt as a string
 */
function generateFillSalt() {
  const bytes = randomBytes(32);
  return ethers.toBigInt('0x' + bytes.toString('hex')).toString();
}

/**
 * Calculates the fill amount for the API based on taker bet amount
 * @param {string} takerBetAmount The taker's bet amount (in base units)
 * @param {string} percentageOdds The odds in percentage format (10^20 precision)
 * @returns {string} Fill amount (in base units)
 */
function calculateFillAmount(takerBetAmount, percentageOdds) {
  const betAmount = BigInt(takerBetAmount);
  const odds = BigInt(percentageOdds);
  const base = BigInt(10**20);
  
  const denominator = base - odds;
  const fillAmount = betAmount * odds / denominator;
  
  return fillAmount.toString();
}

/**
 * Creates the EIP-712 signing payload for filling an order
 * @param {Object} order The order object
 * @param {string} takerBetAmount The taker's bet amount (in base units)
 * @returns {Object} Signing payload with fillAmount and fillSalt
 */
function createSigningPayload(order, takerBetAmount) {
  const fillSalt = generateFillSalt();
  const fillAmount = calculateFillAmount(takerBetAmount, order.percentageOdds);
  
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Details: [
        { name: 'action', type: 'string' },
        { name: 'market', type: 'string' },
        { name: 'betting', type: 'string' },
        { name: 'stake', type: 'string' },
        { name: 'odds', type: 'string' },
        { name: 'returning', type: 'string' },
        { name: 'fills', type: 'FillObject' }
      ],
      FillObject: [
        { name: 'orders', type: 'Order[]' },
        { name: 'makerSigs', type: 'bytes[]' },
        { name: 'takerAmounts', type: 'uint256[]' },
        { name: 'fillSalt', type: 'uint256' },
        { name: 'beneficiary', type: 'address' },
        { name: 'beneficiaryType', type: 'uint8' },
        { name: 'cashOutTarget', type: 'bytes32' }
      ],
      Order: [
        { name: 'marketHash', type: 'bytes32' },
        { name: 'baseToken', type: 'address' },
        { name: 'totalBetSize', type: 'uint256' },
        { name: 'percentageOdds', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'salt', type: 'uint256' },
        { name: 'maker', type: 'address' },
        { name: 'executor', type: 'address' },
        { name: 'isMakerBettingOutcomeOne', type: 'bool' }
      ]
    },
    primaryType: 'Details',
    domain: {
      name: CONSTANTS.DOMAIN_NAME,
      version: CONSTANTS.DOMAIN_VERSION,
      chainId: CONSTANTS.CHAIN_ID,
      verifyingContract: CONSTANTS.EIP712_FILL_HASHER
    },
    message: {
      action: 'N/A',
      market: 'N/A',
      betting: 'N/A',
      stake: 'N/A',
      odds: 'N/A',
      returning: 'N/A',
      fills: {
        makerSigs: [order.signature],
        orders: [{
          marketHash: order.marketHash,
          baseToken: order.baseToken,
          totalBetSize: order.totalBetSize,
          percentageOdds: order.percentageOdds,
          expiry: order.expiry.toString(),
          salt: order.salt,
          maker: order.maker,
          executor: order.executor,
          isMakerBettingOutcomeOne: order.isMakerBettingOutcomeOne
        }],
        takerAmounts: [fillAmount],
        fillSalt: fillSalt,
        beneficiary: ethers.ZeroAddress,
        beneficiaryType: 0,
        cashOutTarget: ethers.ZeroHash
      }
    },
    fillAmount,
    fillSalt
  };
}

/**
 * Fills an order with the specified bet amount
 * @param {Object} order The order to fill
 * @param {ethers.Wallet} wallet The wallet to sign with
 * @param {string} betAmount The bet amount (in base units)
 * @returns {Promise<Object>} API response
 */
async function fillOrder(order, wallet, betAmount) {
  try {
    // Create signing payload with amount conversion
    const signingPayload = createSigningPayload(order, betAmount);
    const fillAmount = signingPayload.fillAmount;
    const fillSalt = signingPayload.fillSalt;
    
    // Sign the payload with EIP-712
    const signature = await wallet.signTypedData(
      signingPayload.domain,
      { Details: signingPayload.types.Details, FillObject: signingPayload.types.FillObject, Order: signingPayload.types.Order },
      signingPayload.message
    );
    
    // Prepare API payload
    const apiPayload = {
      orderHashes: [order.orderHash],
      takerAmounts: [fillAmount],
      taker: CONSTANTS.TAKER_ADDRESS,
      takerSig: signature,
      fillSalt: fillSalt,
      action: 'N/A',
      market: 'N/A',
      betting: 'N/A',
      stake: 'N/A',
      odds: 'N/A',
      returning: 'N/A'
    };
    
    // Submit to API
    const response = await fetch(`${CONSTANTS.API_BASE_URL}/orders/fill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status !== 'success') {
      throw new Error(`API Error: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error filling order:', error);
    throw error;
  }
}

export {
  fetchActiveOrders,
  formatOdds,
  calculatePotentialPayout,
  calculateFillAmount,
  fillOrder,
  CONSTANTS
}; 