import { auth, db } from "../firebaseConfig";
import { FacebookAuthProvider, signInWithPopup, signOut, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const facebookProvider = new FacebookAuthProvider();

const signInWithFacebook = async (referralCode, isRegistration = false) => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const user = result.user;
    
    console.log(user);

    // Ensure referralCode is either a string value or an empty string
    const finalReferralCode = referralCode ? referralCode.toString().trim() : "";

    // Reference to the user document in Firestore
    const userDoc = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userDoc);

    if (!userSnapshot.exists()) {
      // If this is a login attempt (not registration), delete the user and throw error
      if (!isRegistration) {
        try {
          // Delete the Firebase Auth user
          await deleteUser(user);
          // Sign out to clear any session
          await signOut(auth);
        } catch (deleteError) {
          console.error("Error deleting user:", deleteError);
          // Even if deletion fails, sign out
          await signOut(auth);
        }
        throw new Error("ACCOUNT_NOT_EXISTS");
      }

      // Save new user data to Firestore if the user doesn't exist (registration flow)
      await setDoc(userDoc, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        referredBy: finalReferralCode,
        createdAt: new Date(),
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
    console.error("Error during sign-in with Facebook", error);
    throw error;
  }
};

export default signInWithFacebook;