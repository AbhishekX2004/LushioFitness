// authUtils.js - Common authentication utilities

import { auth, db } from "../../../../firebaseConfig"; // Adjust path as needed
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { 
  updateEmail, 
  sendEmailVerification, 
  verifyBeforeUpdateEmail,
  applyActionCode,
  checkActionCode,
  EmailAuthProvider, 
  linkWithCredential,
  updatePassword,
  reauthenticateWithCredential
} from "firebase/auth";
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
 * Check if user has email/password authentication method
 * @returns {boolean}
 */
export const hasEmailPasswordAuth = () => {
  return isProviderLinked('password');
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
 * Check if user's email can be changed (not from OAuth providers)
 * @returns {boolean}
 */
export const canChangeEmail = () => {
  return !isEmailFromGoogle() && !isEmailFromFacebook();
};

// Updated function to initiate email change process
export const initiateEmailChange = async (newEmail, currentPassword) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found");
  }

  try {
    // If user has email/password auth, reauthenticate first
    if (hasEmailPasswordAuth() && currentPassword) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    // Use verifyBeforeUpdateEmail instead of updateEmail
    await verifyBeforeUpdateEmail(currentUser, newEmail);
    
    return {
      success: true,
      requiresVerification: true,
      message: "Verification email sent to your new email address. Please check your inbox and click the verification link to complete the email change."
    };
    
  } catch (error) {
    console.error("Error initiating email change:", error);
    throw error;
  }
};

// Function to check if email verification is complete and sync with database
export const checkAndSyncEmailChange = async (updateUserData, updateInitialData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { changed: false, email: null };
  }

  try {
    // Force reload to get the latest user info
    await currentUser.reload();
    const refreshedUser = auth.currentUser;
    
    // Check if this is a different email than what we had before
    const hasEmailChanged = refreshedUser.email !== currentUser.email;
    
    if (hasEmailChanged || (refreshedUser.emailVerified && refreshedUser.email)) {
      // Update Firestore with the new email
      await updateUserFirestore(refreshedUser.uid, {
        email: refreshedUser.email,
        linkedAccounts: {
          email: {
            email: refreshedUser.email,
            linked: true,
            linkedAt: new Date().toISOString(),
            verified: refreshedUser.emailVerified
          }
        }
      });

      // Update local state if callbacks are provided
      if (updateUserData) {
        updateUserData(prev => ({ ...prev, email: refreshedUser.email }));
      }
      if (updateInitialData) {
        updateInitialData(prev => ({ ...prev, email: refreshedUser.email }));
      }

      return {
        changed: true,
        email: refreshedUser.email,
        verified: refreshedUser.emailVerified
      };
    }

    return {
      changed: false,
      email: refreshedUser.email,
      verified: refreshedUser.emailVerified
    };
    
  } catch (error) {
    console.error("Error checking and syncing email change:", error);
    throw error;
  }
};

// Enhanced function to handle email verification completion with database sync
export const handleEmailVerificationComplete = async (userId, updateUserData, updateInitialData) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found");
  }

  try {
    // Force reload the user to get updated email info
    await currentUser.reload();
    const refreshedUser = auth.currentUser;
    
    // Always update the database with the current email from Firebase Auth
    // This ensures the database stays in sync with Firebase Auth
    await updateUserFirestore(refreshedUser.uid, {
      email: refreshedUser.email,
      linkedAccounts: {
        email: {
          email: refreshedUser.email,
          linked: true,
          linkedAt: new Date().toISOString(),
          verified: refreshedUser.emailVerified
        }
      }
    });

    // Update local state if callbacks are provided
    if (updateUserData) {
      updateUserData(prev => ({ ...prev, email: refreshedUser.email }));
    }
    if (updateInitialData) {
      updateInitialData(prev => ({ ...prev, email: refreshedUser.email }));
    }
    
    return {
      success: true,
      email: refreshedUser.email,
      verified: refreshedUser.emailVerified,
      message: refreshedUser.emailVerified ? 
        "Email verification completed successfully! You can now login with your new email." : 
        "Email updated but verification is still pending."
    };
    
  } catch (error) {
    console.error("Error handling email verification:", error);
    throw error;
  }
};

// Keep the original function for backward compatibility but mark as deprecated
export const updateUserEmail = async (newEmail, currentPassword) => {
  console.warn("updateUserEmail is deprecated. Use initiateEmailChange instead.");
  return await initiateEmailChange(newEmail, currentPassword);
};

/**
 * Link email/password authentication to user account
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} { success: boolean, requiresVerification: boolean, message: string }
 */
export const linkEmailPassword = async (email, password) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found");
  }

  try {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(currentUser, credential);
    
    // Send verification email
    await sendEmailVerification(currentUser);
    
    return {
      success: true,
      requiresVerification: true,
      message: "Email/password authentication linked successfully. Please check your email for verification."
    };
    
  } catch (error) {
    console.error("Error linking email/password:", error);
    throw error;
  }
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @param {string} currentPassword - Current password (for reauthentication)
 * @returns {Promise<void>}
 */
export const updateUserPassword = async (newPassword, currentPassword) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found");
  }

  try {
    // Reauthenticate first
    if (currentPassword) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    await updatePassword(currentUser, newPassword);
    
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};

/**
 * Send email verification to current user
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No authenticated user found");
  }

  try {
    await sendEmailVerification(currentUser);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
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
    'auth/cancelled-popup-request': 'Authentication popup request was cancelled',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please sign out and sign in again.'
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