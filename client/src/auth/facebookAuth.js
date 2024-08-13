import { auth, db } from "../firebaseConfig";
import { FacebookAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const facebookProvider = new FacebookAuthProvider();

const signInWithFacebook = async (referralCode) => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    
    console.log(user);

    // Ensure referralCode is either a string value or an empty string
    const finalReferralCode = referralCode ? referralCode : "";

    // Reference to the user document in Firestore
    const userDoc = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDoc);

    if (!userSnapshot.exists()) {
      // Save new user data to Firestore if the user doesn't exist
      await setDoc(userDoc, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        referralCode: finalReferralCode, // Pass referralCode or empty string
        createdAt: new Date(),
        lastSignInTime: new Date()  // Set lastSignInTime for new user
      });
    } else {
      // Update lastSignInTime if the user already exists
      await updateDoc(userDoc, {
        lastSignInTime: new Date()
      });
    }

  } catch (error) {
    console.error("Error during sign-in with Facebook", error);
  }
};

export default signInWithFacebook;
