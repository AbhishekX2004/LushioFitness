import { auth, db } from "../firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async (referralCode) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Ensure referralCode is either a string value or an empty string
    const finalReferralCode = referralCode ? referralCode.toString().trim() : ""; 
    
    console.log(user);

    // Check if the user already exists in Firestore
    const userDoc = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDoc);

    if (!userSnapshot.exists()) {
      // Save new user data to Firestore
      await setDoc(userDoc, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        referredBy: finalReferralCode,
        lastSignInTime: new Date()
      });
    } else {
      // Update lastSignInTime if the user already exists
      await updateDoc(userDoc, {
        lastSignInTime: new Date()
      });
    }

    return user;
  } catch (error) {
    console.error("Error during sign-in with Google", error);
    throw error;
  }
};

export default signInWithGoogle;