// index.js
import { placeOrder } from './post.js';
import { cancelOrdersFromInput } from './cancel.js';
import readline from 'readline';

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
 * Main function to run the SX Bet application
 */
async function main() {
  const rl = createInterface();
  
  try {
    console.log('SX Bet Order Management');
    console.log('-----------------------');
    console.log('1. Place a new order');
    console.log('2. Cancel existing order(s)');
    console.log('-----------------------');
    
    const choice = await promptUser(rl, 'Enter your choice (1 or 2): ');
    
    switch (choice.trim()) {
      case '1':
        rl.close(); // Close the current interface before starting the order process
        await placeOrder();
        break;
      case '2':
        rl.close(); // Close the current interface before starting the cancel process
        await cancelOrdersFromInput();
        break;
      default:
        console.log('Invalid choice. Please enter 1 or 2.');
        rl.close();
    }
  } catch (error) {
    console.error('Error in SX Bet application:', error);
  }
}

// Run the application
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});