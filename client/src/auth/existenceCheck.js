import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Check if email exists in database
export const checkEmailExists = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email existence:", error);
    throw new Error("Failed to check email availability");
  }
};

// Check if phone number exists in database
export const checkPhoneExists = async (phoneNumber) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking phone existence:", error);
    throw new Error("Failed to check phone availability");
  }
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (basic validation - should be numeric and reasonable length)
export const validatePhone = (phone) => {
  // Remove any non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  // Should be at least 10 digits (most countries) and max 15 (international standard)
  return cleanPhone.length >= 10 && cleanPhone.length <= 15;
};

// Validate password requirements
export const validatePassword = (password) => {
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumeric = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const hasMinLength = password.length >= 6;

  return {
    isValid: hasLowerCase && hasUpperCase && hasNumeric && hasSpecialChar && hasMinLength,
    errors: {
      lowercase: !hasLowerCase,
      uppercase: !hasUpperCase,
      numeric: !hasNumeric,
      special: !hasSpecialChar,
      length: !hasMinLength
    }
  };
};

// Get password validation message
export const getPasswordValidationMessage = (password) => {
  const validation = validatePassword(password);
  if (validation.isValid) return "";

  const messages = [];
  if (validation.errors.length) messages.push("at least 6 characters");
  if (validation.errors.lowercase) messages.push("one lowercase letter");
  if (validation.errors.uppercase) messages.push("one uppercase letter");  
  if (validation.errors.numeric) messages.push("one number");
  if (validation.errors.special) messages.push("one special character");

  return `Password must contain: ${messages.join(", ")}`;
};