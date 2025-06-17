// phoneAuthUtils.js - Phone authentication specific utilities

import { auth } from "../../../../firebaseConfig"; // Adjust path as needed
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { isValidPhoneNumber } from "libphonenumber-js";
import { toast } from 'react-toastify';

/**
 * Initialize recaptcha verifier for phone authentication
 * @param {string} containerId - The container ID for recaptcha
 * @param {Object} existingVerifier - Existing verifier to reuse
 * @returns {RecaptchaVerifier}
 */
export const initializeRecaptcha = (containerId = 'recaptcha-container-phone', existingVerifier = null) => {
  if (!existingVerifier) {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        console.log("Recaptcha resolved");
      }
    });
    return verifier;
  }
  return existingVerifier;
};

/**
 * Send verification code to phone number
 * @param {string} phoneNumber - Phone number with country code
 * @param {RecaptchaVerifier} verifier - Recaptcha verifier instance
 * @returns {Promise<Object>} Confirmation result
 */
export const sendVerificationCode = async (phoneNumber, verifier) => {
  const phone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  
  if (!isValidPhoneNumber(phone)) {
    throw new Error("Invalid phone number format");
  }
  
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
    toast.success("Verification code sent to your phone!");
    return confirmationResult;
  } catch (error) {
    // Re-throw with more context
    throw error;
  }
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean}
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  const phone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
  return isValidPhoneNumber(phone);
};

/**
 * Format phone number with country code
 * @param {string} phoneNumber - Phone number to format
 * @returns {string}
 */
export const formatPhoneNumber = (phoneNumber) => {
  return phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
};

/**
 * Cleanup recaptcha verifier
 * @param {RecaptchaVerifier} verifier - Verifier to cleanup
 */
export const cleanupRecaptcha = (verifier) => {
  if (verifier) {
    verifier.clear();
  }
};