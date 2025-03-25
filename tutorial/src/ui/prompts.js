// src/ui/prompts.js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer)));
}

function closePrompt() {
  rl.close();
}

module.exports = {
  promptUser,
  closePrompt
};