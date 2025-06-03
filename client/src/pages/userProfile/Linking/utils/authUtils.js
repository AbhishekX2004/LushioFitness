// authUtils.js - Common authentication utilities

import { auth, db } from "../../../../firebaseConfig"; // Adjust path as needed
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { toast } from 'react-toastify';

/**
 * Get authentication methods info for the current user
 * @returns {Object} { canUnlink: boolean, methods: string[] }
 */
export const getAuthMethodsInfo = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return { canUnlink: false, methods: [] };
  
  const methods = currentUser.providerData.map(provider => {
    switch(provider.providerId) {
      case 'google.com':
        return 'Google';
      case 'password':
        return 'Email/Password';
      case 'phone':
        return 'Phone';
      case 'facebook.com':
        return 'Facebook';
      default:
        return provider.providerId;
    }
  });
  
  const canUnlink = currentUser.providerData.length > 1;
  return { canUnlink, methods };
};

/**
 * Check if a specific provider is linked to the current user
 * @param {string} providerId - The provider ID to check (e.g., 'google.com', 'phone', 'facebook.com')
 * @returns {boolean}
 */
export const isProviderLinked = (providerId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  return currentUser.providerData.some(
    provider => provider.providerId === providerId
  );
};

/**
 * Check if user's primary email is from Google
 * @returns {boolean}
 */
export const isEmailFromGoogle = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  const googleProvider = currentUser.providerData.find(
    provider => provider.providerId === 'google.com'
  );
  
  // If Google is linked and the current email matches Google email
  return googleProvider && currentUser.email === googleProvider.email;
};

/**
 * Check if user's primary email is from Facebook
 * @returns {boolean}
 */
export const isEmailFromFacebook = () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  const facebookProvider = currentUser.providerData.find(
    provider => provider.providerId === 'facebook.com'
  );
  
  // If Facebook is linked and the current email matches Facebook email
  return facebookProvider && currentUser.email === facebookProvider.email;
};

/**
 * Update Firestore document for a user
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateUserFirestore = async (userId, updateData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    
    // If updating linkedAccounts, we need to merge with existing data
    if (updateData.linkedAccounts) {
      // Get current document to preserve existing linkedAccounts
      const currentDoc = await getDoc(userDocRef);
      const currentData = currentDoc.exists() ? currentDoc.data() : {};
      const currentLinkedAccounts = currentData.linkedAccounts || {};
      
      // Merge the new linkedAccounts with existing ones
      updateData.linkedAccounts = {
        ...currentLinkedAccounts,
        ...updateData.linkedAccounts
      };
    }
    
    await updateDoc(userDocRef, updateData);
  } catch (error) {
    console.log("Firestore update error (non-critical):", error);
  }
};

/**
 * Validate if unlinking is allowed for a provider
 * @param {string} providerId - The provider ID to validate
 * @returns {Object} { allowed: boolean, reason: string }
 */
export const validateUnlinking = (providerId) => {
  const authInfo = getAuthMethodsInfo();
  
  // Check if user has multiple auth methods
  if (!authInfo.canUnlink) {
    return {
      allowed: false,
      reason: `Cannot unlink: ${getProviderDisplayName(providerId)} is your only sign-in method. Add another authentication method to unlink ${getProviderDisplayName(providerId)}.`
    };
  }
  
  // Special case for Google - check if it provides primary email
  if (providerId === 'google.com' && isEmailFromGoogle()) {
    return {
      allowed: false,
      reason: "Cannot unlink: Google provides your primary email address. Unlinking would prevent account access."
    };
  }
  
  // Special case for Facebook - check if it provides primary email
  if (providerId === 'facebook.com' && isEmailFromFacebook()) {
    return {
      allowed: false,
      reason: "Cannot unlink: Facebook provides your primary email address. Unlinking would prevent account access."
    };
  }
  
  return { allowed: true, reason: "" };
};

/**
 * Get display name for a provider ID
 * @param {string} providerId - The provider ID
 * @returns {string}
 */
export const getProviderDisplayName = (providerId) => {
  switch(providerId) {
    case 'google.com':
      return 'Google';
    case 'phone':
      return 'Phone';
    case 'password':
      return 'Email/Password';
    case 'facebook.com':
      return 'Facebook';
    default:
      return providerId;
  }
};

/**
 * Handle common authentication errors
 * @param {Error} error - The error object
 * @param {string} operation - The operation being performed (e.g., 'linking', 'unlinking')
 * @param {string} providerName - The provider name for display
 */
export const handleAuthError = (error, operation, providerName) => {
  console.error(`Error ${operation} ${providerName}:`, error);
  
  const errorMessages = {
    'auth/credential-already-in-use': `This ${providerName} account is already linked to another user account`,
    'auth/provider-already-linked': `${providerName} account is already linked to your account`,
    'auth/email-already-in-use': 'This email is already associated with another account',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials',
    'auth/no-such-provider': `${providerName} was not linked to this user`,
    'auth/phone-number-already-exists': 'This phone number is already linked to another account',
    'auth/invalid-phone-number': 'Invalid phone number format',
    'auth/too-many-requests': 'Too many requests. Please try again later',
    'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
    'auth/code-expired': 'Verification code expired. Please request a new one.',
    'auth/popup-closed-by-user': 'Authentication popup was closed before completion',
    'auth/popup-blocked': 'Authentication popup was blocked by the browser',
    'auth/cancelled-popup-request': 'Authentication popup request was cancelled'
  };
  
  const message = errorMessages[error.code] || `Failed to ${operation} ${providerName}: ${error.message}`;
  
  if (error.code === 'auth/provider-already-linked') {
    toast.info(message, { className: "custom-toast-info" });
  } else if (error.code === 'auth/no-such-provider') {
    toast.info(message, { className: "custom-toast-info" });
  } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
    toast.info("Authentication was cancelled", { className: "custom-toast-info" });
  } else {
    toast.error(message, { className: "custom-toast-error" });
  }
};

/**
 * Reload current user and check provider status
 * @param {string} providerId - The provider ID to check
 * @returns {Promise<boolean>}
 */
export const reloadAndCheckProvider = async (providerId) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  
  try {
    await currentUser.reload();
    return isProviderLinked(providerId);
  } catch (error) {
    console.error("Error reloading user:", error);
    return isProviderLinked(providerId);
  }
};