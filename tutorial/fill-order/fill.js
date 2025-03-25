// sx-bet-order-filler.js
import { ethers } from 'ethers';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { randomBytes } from 'crypto';

// Load environment variables
dotenv.config();

// Constants
const CONSTANTS = {
  EIP712_FILL_HASHER: '0x845a2Da2D70fEDe8474b1C8518200798c60aC364',
  TOKEN_TRANSFER_PROXY: '0x38aef22152BC8965bf0af7Cf53586e4b0C4E9936',
  USDC_ADDRESS: '0x6629Ce1Cf35Cc1329ebB4F63202F3f197b3F050B',
  TAKER_ADDRESS: '0xADb93842A9cEa59A11Fed9E3D9870D37eb2eC9Dd',
  DOMAIN_NAME: 'SX Bet',
  DOMAIN_VERSION: '6.0',
  CHAIN_ID: 4162,
  RPC_URL: 'https://rpc.sx-rollup.gelato.digital',
  API_BASE_URL: 'https://api.sx.bet'
};

// Initialize ethers provider and wallet
const setupWallet = () => {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('Private key not found in .env file');
    }
    
    const provider = new ethers.JsonRpcProvider(CONSTANTS.RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    return { provider, wallet };
  } catch (error) {
    console.error('Error setting up wallet:', error.message);
    process.exit(1);
  }
};

// Fetch active orders from SX Bet API
const fetchActiveOrders = async (maker, chainVersion = 'SXR') => {
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
};

// Convert percentage odds to display format
const formatOdds = (percentageOdds) => {
  const impliedOdds = BigInt(percentageOdds) * BigInt(100) / BigInt(10**20);
  return `${impliedOdds.toString()}%`;
};

// Calculate potential payout based on bet amount and odds
const calculatePotentialPayout = (betAmount, percentageOdds) => {
  // Convert to BigInt for precision
  const amount = BigInt(betAmount);
  const odds = BigInt(percentageOdds);
  const base = BigInt(10**20);
  
  // Formula: betAmount / (1 - percentageOdds/10^20)
  const denominator = base - odds;
  const payout = amount * base / denominator;
  
  return payout.toString();
};

// Display order information
const displayOrders = (orders) => {
  if (orders.length === 0) {
    console.log('No active orders found.');
    process.exit(0);
  }
  
  console.log('\n========== AVAILABLE ORDERS ==========');
  orders.forEach((order, index) => {
    const odds = formatOdds(order.percentageOdds);
    const exampleBet = '1000000'; // 1 USDC (in 6 decimals)
    const potentialPayout = calculatePotentialPayout(exampleBet, order.percentageOdds);
    
    console.log(`[${index + 1}] Market: ${order.marketHash.substring(0, 10)}...`);
    console.log(`    Order Hash: ${order.orderHash}`);
    console.log(`    Total Size: ${ethers.formatUnits(order.totalBetSize, 6)} USDC`);
    console.log(`    Maker Odds: ${odds}`);
    console.log(`    Side: ${order.isMakerBettingOutcomeOne ? 'Outcome One' : 'Outcome Two'}`);
    console.log(`    Example: Bet 1 USDC → Potential payout: ${ethers.formatUnits(potentialPayout, 6)} USDC`);
    console.log(`    Expires: ${new Date(order.apiExpiry * 1000).toLocaleString()}`);
    console.log('-------------------------------------');
  });
  
  return orders;
};

// Generate random fillSalt
const generateFillSalt = () => {
  const bytes = randomBytes(32);
  return ethers.toBigInt('0x' + bytes.toString('hex')).toString();
};

// Convert taker bet amount to fill amount for the API
// From the docs: 
// fillAmount = takerBetAmount * percentageOdds / (10^20 - percentageOdds)
const calculateFillAmount = (takerBetAmount, percentageOdds) => {
  // Convert to BigInt for precision
  const betAmount = BigInt(takerBetAmount);
  const odds = BigInt(percentageOdds);
  const base = BigInt(10**20);
  
  // Calculate fill amount using the formula
  const denominator = base - odds;
  const fillAmount = betAmount * odds / denominator;
  
  return fillAmount.toString();
};

// Create signing payload for EIP-712 signature
const createSigningPayload = (order, takerBetAmount) => {
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
};

// Fill an order
const fillOrder = async (order, wallet, betAmount) => {
  try {
    console.log(`\nPreparing to fill order ${order.orderHash}...`);
    
    // Create signing payload with amount conversion
    const signingPayload = createSigningPayload(order, betAmount);
    const fillAmount = signingPayload.fillAmount;
    const fillSalt = signingPayload.fillSalt;
    
    console.log(`Taker bet amount: ${ethers.formatUnits(betAmount, 6)} USDC`);
    console.log(`Calculated fill amount: ${ethers.formatUnits(fillAmount, 6)} USDC`);
    
    // Sign the payload with EIP-712
    const signature = await wallet.signTypedData(
      signingPayload.domain,
      { Details: signingPayload.types.Details, FillObject: signingPayload.types.FillObject, Order: signingPayload.types.Order },
      signingPayload.message
    );
    
    console.log(`Generated signature: ${signature}`);
    
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
    
    console.log('Sending request to SX Bet API...');
    
    // Send request to API
    const response = await fetch(`${CONSTANTS.API_BASE_URL}/orders/fill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });
    
    const responseData = await response.json();
    
    if (responseData.status === 'success') {
      console.log('\n✅ Order filled successfully!');
      console.log(`Fill Hash: ${responseData.data.fillHash}`);
    } else {
      console.error('\n❌ Failed to fill order:');
      console.error(JSON.stringify(responseData, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error filling order:', error.message);
    if (error.code === 'INVALID_ARGUMENT') {
      console.error('This could be due to an issue with the payload format or signature.');
    }
  }
};

// Main function
const main = async () => {
  console.log('🏆 SX Bet Order Filler 🏆');
  
  // Setup wallet
  const { wallet } = setupWallet();
  console.log(`Connected with address: ${wallet.address}`);
  
  // Fetch active orders
  console.log('\nFetching active orders...');
  const maker = '0x3C2eA50B33F9E7F62B842E0031cDFb5e507D7aA1';
  const orders = await fetchActiveOrders(maker, 'SXR');
  
  // Display orders
  const displayedOrders = displayOrders(orders);
  
  if (displayedOrders.length === 0) {
    return;
  }
  
  // Let user select an order
  const { orderIndex, betAmount } = await inquirer.prompt([
    {
      type: 'number',
      name: 'orderIndex',
      message: 'Enter the number of the order you want to fill:',
      validate: (input) => {
        const num = parseInt(input);
        return num > 0 && num <= displayedOrders.length 
          ? true 
          : `Please enter a number between 1 and ${displayedOrders.length}`;
      }
    },
    {
      type: 'input',
      name: 'betAmount',
      message: 'Enter the amount of USDC to bet (e.g., 1.0 for 1 USDC):',
      default: '1.0',
      validate: (input) => {
        const amount = parseFloat(input);
        return !isNaN(amount) && amount > 0 
          ? true 
          : 'Please enter a valid positive number';
      },
      filter: (input) => {
        // Convert to USDC with 6 decimals
        const amount = parseFloat(input);
        const amountInSmallestUnit = Math.floor(amount * 1000000).toString();
        return amountInSmallestUnit;
      }
    }
  ]);
  
  const selectedOrder = displayedOrders[orderIndex - 1];
  console.log(`\nSelected order: ${selectedOrder.orderHash}`);
  
  // Fill the selected order
  await fillOrder(selectedOrder, wallet, betAmount);
};

// Run the application
main().catch(console.error);