// src/utils/formatters.js
function calculateTakerOdds(percentageOdds) {
    const impliedOdds = 1 - percentageOdds / 1e20;
    return impliedOdds > 0 ? (1 / impliedOdds).toFixed(2) : "N/A";
  }
  
  function convertToNominalUnits(ethereumAmount, decimals = 6) {
    return (ethereumAmount / Math.pow(10, decimals)).toFixed(2);
  }
  
  function calculateRemainingTakerSpace(order) {
    const totalBetSize = BigInt(order.totalBetSize);
    const fillAmount = BigInt(order.fillAmount);
    const percentageOdds = BigInt(order.percentageOdds);
  
    const remaining = (totalBetSize - fillAmount) * BigInt(1e20) / percentageOdds - (totalBetSize - fillAmount);
    return convertToNominalUnits(Number(remaining));
  }
  
  module.exports = {
    calculateTakerOdds,
    convertToNominalUnits,
    calculateRemainingTakerSpace
  };