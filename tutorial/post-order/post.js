// sx-bet-order.js
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import readline from 'readline';
import BigNumber from 'bignumber.js';

// Load environment variables
dotenv.config();

// Constants provided by user
const CONSTANTS = {
  marketHash: '0x01f08881f4e3c8ab1503147cfd9967cb05b0cb63897dc395bbbb926165541f56',
  maker: '0xADb93842A9cEa59A11Fed9E3D9870D37eb2eC9Dd',
  baseToken: '0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B',
  executor: '0x52adf738AAD93c31f798a30b2C74D658e1E9a562',
  isMakerBettingOutcomeOne: true,
  chainId: 4162,
  oddLadderStepSize: 25 // 0.25% steps
};

// API endpoint
const API_URL = 'https://api.sx.bet/orders/new';

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
 * Validates and rounds odds to the nearest step on the odds ladder
 * @param {number} percentageOdds Odds in percentage format (e.g., 50.25)
 * @returns {string} Rounded odds in the required format
 */
function processOdds(percentageOdds) {
  // Convert percentage to the format expected by the API (multiply by 10^18)
  const rawOdds = ethers.parseUnits(
    percentageOdds.toString(), 
    18
  );
  
  // Check if odds are already on the ladder
  if (checkOddsLadderValid(rawOdds)) {
    console.log(`Odds ${percentageOdds}% are valid on the ladder.`);
    return rawOdds.toString();
  }
  
  // Round to nearest step
  const roundedOdds = roundDownOddsToNearestStep(rawOdds);
  const humanReadableRounded = ethers.formatUnits(roundedOdds, 18);
  console.log(`Odds ${percentageOdds}% rounded to ${humanReadableRounded}% to match the odds ladder.`);
  
  return roundedOdds.toString();
}

/**
 * Check if the odds are valid, i.e., in one of the allowed steps
 * @param {ethers.BigNumberish} odds Odds to check
 * @returns {boolean}
 */
function checkOddsLadderValid(odds) {
  const step = ethers.parseUnits(
    (CONSTANTS.oddLadderStepSize / 100).toString(), 
    16
  );
  return ethers.toBigInt(odds) % ethers.toBigInt(step) === 0n;
}

/**
 * Rounds odds to the nearest step
 * @param {ethers.BigNumberish} odds Odds to round
 * @returns {ethers.BigInt}
 */
function roundDownOddsToNearestStep(odds) {
  const step = ethers.parseUnits(
    (CONSTANTS.oddLadderStepSize / 100).toString(), 
    16
  );
  const bnStep = new BigNumber(step.toString());
  const bnOdds = new BigNumber(odds.toString());
  const firstPassDivision = bnOdds.dividedBy(bnStep).toFixed(0, 3); // Round down
  return ethers.toBigInt(firstPassDivision) * ethers.toBigInt(step);
}

/**
 * Creates an order object with the required parameters
 * @param {string} stakeSize Stake size in USDC
 * @param {string} percentageOdds Odds in percentage format
 * @returns {Object} Order object
 */
function createOrder(stakeSize, percentageOdds) {
  // Current timestamp plus 1 hour for apiExpiry (in seconds)
  const apiExpiryTime = Math.floor(Date.now() / 1000) + 3600;
  
  // Generate a random salt
  const salt = ethers.hexlify(ethers.randomBytes(32));
  
  return {
    marketHash: CONSTANTS.marketHash,
    maker: CONSTANTS.maker,
    totalBetSize: ethers.parseUnits(stakeSize, 6).toString(), // USDC has 6 decimals
    percentageOdds: percentageOdds,
    baseToken: CONSTANTS.baseToken,
    apiExpiry: apiExpiryTime,
    expiry: 2209006800, // Deprecated but required
    executor: CONSTANTS.executor,
    isMakerBettingOutcomeOne: CONSTANTS.isMakerBettingOutcomeOne,
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
 * Signs an order with the private key
 * @param {Object} order Order object
 * @returns {Promise<Object>} Signed order
 */
async function signOrder(order) {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in .env file');
    }
    
    const wallet = new ethers.Wallet(privateKey);
    const orderHash = createOrderHash(order);
    const signature = await wallet.signMessage(orderHash);
    
    return { ...order, signature };
  } catch (error) {
    console.error('Error signing order:', error);
    throw error;
  }
}

/**
 * Submits a signed order to the API
 * @param {Object} signedOrder Signed order object
 * @returns {Promise<Object>} API response
 */
async function submitOrder(signedOrder) {
  try {
    console.log('Submitting order to API...');
    
    const response = await fetch(API_URL, {
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
    console.error('Error submitting order:', error);
    throw error;
  }
}

/**
 * Main function to place an order
 */
async function placeOrder() {
  const rl = createInterface();
  
  try {
    // Get user input
    const stakeSize = await promptUser(rl, 'Enter stake size in USDC: ');
    const percentageOdds = await promptUser(rl, 'Enter odds in percentage (e.g., 50.25): ');
    
    // Process odds to ensure they're on the ladder
    const processedOdds = processOdds(parseFloat(percentageOdds));
    
    // Create order
    const order = createOrder(stakeSize, processedOdds);
    console.log('Order created:', JSON.stringify(order, null, 2));
    
    // Sign order
    const signedOrder = await signOrder(order);
    console.log('Order signed successfully');
    
    // Submit order
    const result = await submitOrder(signedOrder);
    console.log('Order placed successfully!');
    console.log('Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Failed to place order:', error);
  } finally {
    rl.close();
  }
}

// Export functions for modular usage
export {
  placeOrder,
  createOrder,
  signOrder,
  submitOrder,
  processOdds,
  checkOddsLadderValid,
  roundDownOddsToNearestStep
};

// Run if executed directly
if (process.argv[1] === import.meta.url) {
  placeOrder().catch(console.error);
}