// sx-bet-cancel.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Constants
const CONSTANTS = {
  chainId: 4162, // From your previous example
  apiUrl: 'https://api.sx.bet/orders/cancel/v2?chainVersion=SXR'
};

/**
 * Creates a CLI interface for user input
 * @returns {readline.Interface}
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompts the user for input
 * @param {readline.Interface} rl 
 * @param {string} question 
 * @returns {Promise<string>}
 */
function promptUser(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Creates the EIP-712 typed data structure for cancelling orders
 * @param {string[]} orderHashes Array of order hashes to cancel
 * @param {string} salt Random salt in hex format
 * @param {number} timestamp Current timestamp in seconds
 * @param {number} chainId Blockchain chain ID
 * @returns {Object} EIP-712 typed data structure
 */
function getCancelOrderEIP712Payload(orderHashes, salt, timestamp, chainId) {
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
      chainId,
      salt,
    },
    message: { 
      orderHashes, 
      timestamp 
    },
  };
}

/**
 * Signs the cancellation request with EIP-712
 * @param {string[]} orderHashes Array of order hashes to cancel
 * @returns {Promise<Object>} Payload ready for API submission
 */
async function createCancelOrderPayload(orderHashes) {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in .env file');
    }
    
    const wallet = new ethers.Wallet(privateKey);
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const timestamp = Math.floor(Date.now() / 1000);
    
    const payload = getCancelOrderEIP712Payload(
      orderHashes, 
      salt, 
      timestamp, 
      CONSTANTS.chainId
    );
    
    // Sign the typed data (EIP-712)
    const signature = await wallet.signTypedData(
      payload.domain,
      { Details: payload.types.Details },
      payload.message
    );
    
    // Create the API payload
    return {
      orderHashes,
      signature,
      salt,
      maker: wallet.address,
      timestamp
    };
    
  } catch (error) {
    console.error('Error creating cancel order payload:', error);
    throw error;
  }
}

/**
 * Submits a cancellation request to the API
 * @param {Object} payload Cancellation request payload
 * @returns {Promise<Object>} API response
 */
async function submitCancellation(payload) {
  try {
    console.log('Submitting cancellation request to API...');
    
    const response = await fetch(CONSTANTS.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status !== 'success') {
      throw new Error(`API Error: ${JSON.stringify(data)}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error submitting cancellation:', error);
    throw error;
  }
}

/**
 * Cancels one or more orders
 * @param {string[]} orderHashes Array of order hashes to cancel
 * @returns {Promise<Object>} API response
 */
async function cancelOrders(orderHashes) {
  try {
    // Create the cancellation payload
    const payload = await createCancelOrderPayload(orderHashes);
    console.log('Cancellation payload created');
    
    // Submit the cancellation
    const result = await submitCancellation(payload);
    console.log(`Successfully cancelled ${result.data.cancelledCount} orders!`);
    
    return result;
  } catch (error) {
    console.error('Failed to cancel orders:', error);
    throw error;
  }
}

/**
 * Main function to prompt user for order hashes and cancel them
 */
async function cancelOrdersFromInput() {
  const rl = createInterface();
  
  try {
    // Get user input
    const input = await promptUser(rl, 'Enter order hash(es) to cancel (separate multiple hashes with commas): ');
    
    // Parse input into array of order hashes
    const orderHashes = input.split(',').map(hash => hash.trim());
    
    if (orderHashes.length === 0 || orderHashes[0] === '') {
      throw new Error('No order hashes provided');
    }
    
    console.log(`Attempting to cancel ${orderHashes.length} order(s)...`);
    
    // Cancel the orders
    const result = await cancelOrders(orderHashes);
    console.log('Cancellation completed:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Cancellation process failed:', error);
  } finally {
    rl.close();
  }
}

// Export functions for modular usage
export {
  cancelOrders,
  cancelOrdersFromInput,
  createCancelOrderPayload,
  submitCancellation
};

// Run if executed directly
if (process.argv[1] === import.meta.url) {
  cancelOrdersFromInput().catch(console.error);
}