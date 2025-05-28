import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

const FinishEmailSignUp = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.emailForSignIn || window.localStorage?.getItem("emailForSignIn");
        if (!email) {
          email = window.prompt("Please provide your email for confirmation");
        }

        try {
          const result = await signInWithEmailLink(auth, email, window.location.href);
          const user = result.user;

          // Update last sign in time
          const userDoc = doc(db, "users", user.uid);
          await updateDoc(userDoc, {
            lastSignInTime: new Date()
          });

          // Clean up stored email
          if (window.emailForSignIn) {
            delete window.emailForSignIn;
          }
          if (window.localStorage) {
            window.localStorage.removeItem("emailForSignIn");
          }
          
          setMessage("Login successful!");
          navigate("/user");
        } catch (error) {
          console.error("Error signing in with email link", error);
          setMessage("Error signing in. Please try again.");
          setTimeout(() => navigate("/login"), 3000);
        }
      } else {
        navigate("/login");
      }
    };

    handleEmailLinkSignIn();
  }, [navigate]);

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{message}</h2>
      </div>
    </div>
  );
};

export default FinishEmailSignUp;