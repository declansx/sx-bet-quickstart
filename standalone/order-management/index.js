import { ethers } from 'ethers';

// Constants
const CONSTANTS = {
  chainId: 4162,
  postOrderUrl: 'https://api.sx.bet/orders/new',
  cancelOrderUrl: 'https://api.sx.bet/orders/cancel/v2?chainVersion=SXR'
};

/**
 * Creates an order object with the required parameters
 * @param {Object} params Order parameters
 * @param {string} params.marketHash The market hash
 * @param {string} params.maker The maker's address
 * @param {string} params.baseToken The base token address
 * @param {string} params.executor The executor address
 * @param {string} params.stakeSize Stake size in USDC
 * @param {string} params.percentageOdds Odds in percentage format
 * @param {boolean} params.isMakerBettingOutcomeOne Whether maker is betting on outcome one
 * @returns {Object} The order object
 */
function createOrder({
  marketHash,
  maker,
  baseToken,
  executor,
  stakeSize,
  percentageOdds,
  isMakerBettingOutcomeOne
}) {
  // Current timestamp plus 1 hour for apiExpiry (in seconds)
  const apiExpiryTime = Math.floor(Date.now() / 1000) + 3600;
  
  // Generate a random salt
  const salt = ethers.hexlify(ethers.randomBytes(32));
  
  return {
    marketHash,
    maker,
    totalBetSize: ethers.parseUnits(stakeSize, 6).toString(), // USDC has 6 decimals
    percentageOdds,
    baseToken,
    apiExpiry: apiExpiryTime,
    expiry: 2209006800, // Deprecated but required
    executor,
    isMakerBettingOutcomeOne,
    salt: ethers.toBigInt(salt).toString(),
  };
}

/**
 * Creates a hash of the order for signing
 * @param {Object} order Order object
 * @returns {Uint8Array} Order hash
 */
function createOrderHash(order) {
  return ethers.getBytes(
    ethers.solidityPackedKeccak256(
      [
        "bytes32",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
        "address",
        "address",
        "bool",
      ],
      [
        order.marketHash,
        order.baseToken,
        order.totalBetSize,
        order.percentageOdds,
        order.expiry,
        order.salt,
        order.maker,
        order.executor,
        order.isMakerBettingOutcomeOne,
      ]
    )
  );
}

/**
 * Posts an order to the SX Bet API
 * @param {Object} order The order object to post
 * @param {ethers.Wallet} wallet The wallet to sign the order with
 * @returns {Promise<Object>} The API response
 */
async function postOrder(order, wallet) {
  try {
    const orderHash = createOrderHash(order);
    const signature = await wallet.signMessage(orderHash);
    
    const signedOrder = { ...order, signature };
    
    // Submit to API - note we wrap the order in an array as per the API requirements
    const response = await fetch(CONSTANTS.postOrderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orders: [signedOrder] }),
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status !== 'success') {
      throw new Error(`API Error: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error posting order:', error);
    throw error;
  }
}

/**
 * Creates the EIP-712 typed data structure for cancelling orders
 * @param {string[]} orderHashes Array of order hashes to cancel
 * @param {string} salt Random salt in hex format
 * @param {number} timestamp Current timestamp in seconds
 * @returns {Object} EIP-712 typed data structure
 */
function getCancelOrderEIP712Payload(orderHashes, salt, timestamp) {
  return {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "salt", type: "bytes32" },
      ],
      Details: [
        { name: "orderHashes", type: "string[]" },
        { name: "timestamp", type: "uint256" },
      ],
    },
    primaryType: "Details",
    domain: {
      name: "CancelOrderV2SportX",
      version: "1.0",
      chainId: CONSTANTS.chainId,
      salt,
    },
    message: { 
      orderHashes, 
      timestamp 
    },
  };
}

/**
 * Cancels one or more orders
 * @param {string[]} orderHashes Array of order hashes to cancel
 * @param {ethers.Wallet} wallet The wallet to sign the cancellation with
 * @returns {Promise<Object>} The API response
 */
async function cancelOrders(orderHashes, wallet) {
  try {
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const timestamp = Math.floor(Date.now() / 1000);
    
    const payload = getCancelOrderEIP712Payload(orderHashes, salt, timestamp);
    
    // Sign the typed data (EIP-712)
    const signature = await wallet.signTypedData(
      payload.domain,
      { Details: payload.types.Details },
      payload.message
    );
    
    // Create the API payload
    const apiPayload = {
      orderHashes,
      signature,
      salt,
      maker: wallet.address,
      timestamp
    };
    
    // Submit to API
    const response = await fetch(CONSTANTS.cancelOrderUrl, {
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
    console.error('Error cancelling orders:', error);
    throw error;
  }
}

export {
  createOrder,
  postOrder,
  cancelOrders,
  CONSTANTS
}; 