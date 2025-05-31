import { auth, db } from "../firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Recaptcha setup function
export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    console.log("Initializing RecaptchaVerifier...");
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      "size": "invisible",
      "callback": (response) => {
        console.log("Recaptcha solved:", response);
      },
    });
  }
};

// Function to send OTP
const sendOtp = async (formattedPhoneNumber) => {
  setupRecaptcha();
  console.log("RecaptchaVerifier instance:", window.recaptchaVerifier);

  const appVerifier = window.recaptchaVerifier;

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);
    console.log("OTP sent successfully:", confirmationResult);
    return confirmationResult;
  } catch (error) {
    console.error("Error during OTP sending", error);
    // Reset recaptcha on error
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    throw error;
  }
};

// Function to verify OTP for signup
const verifyOtp = async (confirmationResult, otp, formattedPhoneNumber, referralCode) => {
  try {
    const result = await confirmationResult.confirm(otp);
    console.log("OTP verified successfully:", result);

    const user = result.user;
    const userDoc = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDoc);

    if (userSnapshot.exists()) {
      // Update lastSignInTime if the user already exists
      await updateDoc(userDoc, {
        lastSignInTime: new Date(),
      });
    } else {
      // Save new user data in Firestore
      await setDoc(userDoc, {
        phoneNumber: formattedPhoneNumber,
        referredBy: referralCode || "",
        createdAt: new Date(),
        lastSignInTime: new Date(),
      });
    }

    console.log(user);
    return user;
  } catch (error) {
    console.error("Error during OTP verification", error);
    throw error;
  }
};

// Function to verify OTP for login
const verifyOtpForLogin = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);

    const user = result.user;
    const userDoc = doc(db, "users", user.uid);

    // Update lastSignInTime when the user logs in
    await updateDoc(userDoc, {
      lastSignInTime: new Date(),
    });

    console.log(user);
    return user;
  } catch (error) {
    console.error("Error verifying OTP for login", error);
    throw error;
  }
};

export { sendOtp, verifyOtp, verifyOtpForLogin };