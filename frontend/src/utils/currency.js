// Currency formatting utilities for Vietnamese Dong (VND)

/**
 * Format a number as Vietnamese Dong currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the VND symbol
 * @returns {string} Formatted currency string
 */
export const formatVND = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '0 ₫' : '0';
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Format with Vietnamese locale
  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(numAmount));
  
  return showSymbol ? `${formatted} ₫` : formatted;
};

/**
 * Format currency for display in lists (shorter format)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatVNDShort = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0₫';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (numAmount >= 1000000) {
    // Format in millions (e.g., 1.2M₫)
    const millions = numAmount / 1000000;
    return `${millions.toFixed(1)}M₫`;
  } else if (numAmount >= 1000) {
    // Format in thousands (e.g., 500K₫)
    const thousands = numAmount / 1000;
    return `${thousands.toFixed(0)}K₫`;
  } else {
    // Format normally for amounts under 1000
    return `${Math.round(numAmount)}₫`;
  }
};

/**
 * Parse VND string back to number
 * @param {string} vndString - VND formatted string
 * @returns {number} Parsed number
 */
export const parseVND = (vndString) => {
  if (!vndString || typeof vndString !== 'string') {
    return 0;
  }
  
  // Remove VND symbol and spaces, then parse
  const cleanString = vndString.replace(/[₫,\s]/g, '');
  return parseFloat(cleanString) || 0;
};

/**
 * Convert USD to VND (approximate rate)
 * @param {number} usdAmount - Amount in USD
 * @param {number} exchangeRate - Exchange rate (default: 24500)
 * @returns {number} Amount in VND
 */
export const convertUSDToVND = (usdAmount, exchangeRate = 24500) => {
  return Math.round(usdAmount * exchangeRate);
};

/**
 * Format price with discount calculation
 * @param {number} price - Current price
 * @param {number} comparePrice - Original price
 * @returns {object} Object with formatted prices and discount info
 */
export const formatPriceWithDiscount = (price, comparePrice) => {
  const formattedPrice = formatVND(price);
  const formattedComparePrice = comparePrice ? formatVND(comparePrice) : null;
  
  let discount = 0;
  if (comparePrice && comparePrice > price) {
    discount = Math.round(((comparePrice - price) / comparePrice) * 100);
  }
  
  return {
    price: formattedPrice,
    comparePrice: formattedComparePrice,
    discount,
    hasDiscount: discount > 0
  };
};

export default {
  formatVND,
  formatVNDShort,
  parseVND,
  convertUSDToVND,
  formatPriceWithDiscount
};