'use strict';
/**
 * IMEI Validation Utilities
 */

/**
 * Validate IMEI format: exactly 15 digits
 * @param {string} imei
 * @returns {boolean}
 */
const isValidImeiFormat = (imei) => /^[0-9]{15}$/.test(String(imei).trim());

/**
 * Validate IMEI using Luhn Algorithm (ISO/IEC 7812)
 * Most real IMEIs pass Luhn check, but some manufacturers skip it.
 * @param {string} imei
 * @returns {boolean}
 */
const isValidImeiLuhn = (imei) => {
  if (!isValidImeiFormat(imei)) return false;
  const digits = imei.split('').map(Number);
  const sum = digits.reduceRight((acc, digit, idx) => {
    if ((digits.length - 1 - idx) % 2 === 1) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  return sum % 10 === 0;
};

/**
 * Validate IMEI: format only (strict mode off) or Luhn (strict mode on)
 * @param {string} imei
 * @param {boolean} strict - use Luhn check
 * @returns {{ valid: boolean, errors: string[] }}
 */
const validateImei = (imei, strict = false) => {
  const errors = [];
  const cleaned = String(imei || '').trim();

  if (!cleaned) {
    errors.push('IMEI is required');
  } else if (!isValidImeiFormat(cleaned)) {
    errors.push('IMEI must be exactly 15 numeric digits');
  } else if (strict && !isValidImeiLuhn(cleaned)) {
    errors.push('IMEI failed Luhn checksum validation');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate a batch of IMEIs, returns per-IMEI results
 * @param {string[]} imeis
 * @param {boolean} strict
 * @returns {{ imei: string, valid: boolean, errors: string[] }[]}
 */
const validateImeiBatch = (imeis, strict = false) =>
  imeis.map((imei) => ({ imei, ...validateImei(imei, strict) }));

module.exports = { isValidImeiFormat, isValidImeiLuhn, validateImei, validateImeiBatch };
