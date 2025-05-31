import { auth, db } from "../firebaseConfig";
import { GoogleAuthProvider, signInWithPopup, signOut, deleteUser } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async (referralCode, isRegistration = false) => {
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

      // Save new user data to Firestore (registration flow)
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