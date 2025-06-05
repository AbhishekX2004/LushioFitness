import React, { useState, useEffect } from "react";
import { auth } from "../../../firebaseConfig";
import { 
  hasEmailPasswordAuth, 
  canChangeEmail, 
  initiateEmailChange,
  linkEmailPassword, 
  updateUserPassword,
  sendVerificationEmail,
  handleAuthError,
  updateUserFirestore,
} from "./utils/authUtils";
import { toast } from 'react-toastify';
import "./EmailLinking.css";

function EmailLinking({ user, userData, setUserData, initialData, setInitialData }) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [hasEmailAuth, setHasEmailAuth] = useState(false);
  const [canModifyEmail, setCanModifyEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [mode, setMode] = useState("view"); // "view", "change", "link", "password"
  const [pendingEmailChange, setPendingEmailChange] = useState(false); // New state

  const currentUser = auth.currentUser;

  useEffect(() => {
    const updateEmailInfo = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Force reload to ensure we have the latest info
        await currentUser.reload();
        const refreshedUser = auth.currentUser;
        
        setCurrentEmail(refreshedUser.email || "");
        setIsEmailVerified(refreshedUser.emailVerified);
        setHasEmailAuth(hasEmailPasswordAuth());
        setCanModifyEmail(canChangeEmail());
        
        // Critical: Ensure database is in sync with Firebase Auth
        if (refreshedUser.email && (refreshedUser.email !== userData?.email)) {
          console.log("Syncing email between Firebase Auth and database...");
          
          try {
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

            // Update local state
            setUserData(prev => ({ ...prev, email: refreshedUser.email }));
            setInitialData(prev => ({ ...prev, email: refreshedUser.email }));
          } catch (error) {
            console.error("Error syncing email with database:", error);
          }
        }
        
        // Check if there's a pending email change
        if (refreshedUser.email && !refreshedUser.emailVerified) {
          // This might indicate a pending email change
          setPendingEmailChange(true);
        }
      }
    };

    updateEmailInfo();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(updateEmailInfo);
    return () => unsubscribe();
  }, [userData?.email, setUserData, setInitialData]);

  // Add effect to periodically check email verification status
  useEffect(() => {
    let intervalId;
    
    if (pendingEmailChange) {
      intervalId = setInterval(async () => {
        try {
          // Force reload the current user to get latest info
          await currentUser.reload();
          const updatedUser = auth.currentUser;
          
          // Check if email has changed (indicating verification completed)
          if (updatedUser.email !== currentEmail || (updatedUser.email && updatedUser.emailVerified && !isEmailVerified)) {
            setPendingEmailChange(false);
            setIsEmailVerified(updatedUser.emailVerified);
            setCurrentEmail(updatedUser.email);
            
            // Critical: Update Firestore with the new email
            await updateUserFirestore(updatedUser.uid, {
              email: updatedUser.email,
              linkedAccounts: {
                email: {
                  email: updatedUser.email,
                  linked: true,
                  linkedAt: new Date().toISOString(),
                  verified: updatedUser.emailVerified
                }
              }
            });

            // Update local state
            setUserData(prev => ({ ...prev, email: updatedUser.email }));
            setInitialData(prev => ({ ...prev, email: updatedUser.email }));
            
            toast.success("Email change completed successfully! You can now login with your new email.", { className: "custom-toast-success" });
            
            // Clear the interval since we're done
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error checking email verification:", error);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pendingEmailChange, currentEmail, isEmailVerified, currentUser, setUserData, setInitialData]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleLinkEmail = async () => {
    if (!newEmail || !password) {
      toast.error("Please fill in all required fields", { className: "custom-toast-error" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", { className: "custom-toast-error" });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError, { className: "custom-toast-error" });
      return;
    }

    setIsLoading(true);
    try {
      const result = await linkEmailPassword(newEmail, password);
      
      // Update Firestore
      await updateUserFirestore(currentUser.uid, {
        email: newEmail,
        linkedAccounts: {
          email: {
            email: newEmail,
            linked: true,
            linkedAt: new Date().toISOString(),
            verified: false
          }
        }
      });

      // Update local state
      setUserData(prev => ({ ...prev, email: newEmail }));
      setInitialData(prev => ({ ...prev, email: newEmail }));
      
      toast.success(result.message, { className: "custom-toast-success" });
      setMode("view");
      resetForm();
      
    } catch (error) {
      handleAuthError(error, "linking", "Email");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleChangeEmail = async () => {
  //   if (!newEmail) {
  //     toast.error("Please enter a new email address", { className: "custom-toast-error" });
  //     return;
  //   }

  //   if (newEmail === currentEmail) {
  //     toast.error("New email must be different from current email", { className: "custom-toast-error" });
  //     return;
  //   }

  //   if (hasEmailAuth && !currentPassword) {
  //     toast.error("Please enter your current password", { className: "custom-toast-error" });
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     // Use the new initiateEmailChange function
  //     const result = await initiateEmailChange(newEmail, currentPassword);
      
  //     setPendingEmailChange(true);
  //     toast.success(result.message, { className: "custom-toast-success" });
  //     setMode("view");
  //     resetForm();
      
  //   } catch (error) {
  //     handleAuthError(error, "updating", "Email");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleChangePassword = async () => {
    if (!password || !confirmPassword || !currentPassword) {
      toast.error("Please fill in all password fields", { className: "custom-toast-error" });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("New passwords do not match", { className: "custom-toast-error" });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError, { className: "custom-toast-error" });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserPassword(password, currentPassword);
      toast.success("Password updated successfully", { className: "custom-toast-success" });
      setMode("view");
      resetForm();
    } catch (error) {
      handleAuthError(error, "updating", "Password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      await sendVerificationEmail();
      toast.success("Verification email sent! Please check your inbox.", { className: "custom-toast-success" });
    } catch (error) {
      handleAuthError(error, "sending verification email for", "Email");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewEmail("");
    setPassword("");
    setConfirmPassword("");
    setCurrentPassword("");
    setShowPasswordFields(false);
  };

  const handleCancel = () => {
    setMode("view");
    resetForm();
  };

  const renderEmailDisplay = () => (
    <div className="email-linking-display">
      <div className="email-linking-info">
        <span className="email-linking-email">{currentEmail || "No email linked"}</span>
        {currentEmail && (
          <span className={`email-linking-status ${isEmailVerified ? 'verified' : 'unverified'}`}>
            {isEmailVerified ? "✓ Verified" : "⚠ Unverified"}
          </span>
        )}
      </div>
      
      {pendingEmailChange && (
        <div className="email-linking-pending">
          <p>📧 Email change pending verification. Check your new email inbox and click the verification link.</p>
          <p><small>The system will automatically detect when verification is complete.</small></p>
        </div>
      )}
      
      <div className="email-linking-actions">
        {!currentEmail ? (
          <button 
            onClick={() => setMode("link")}
            className="email-linking-btn primary"
            disabled={isLoading}
          >
            Link Email
          </button>
        ) : (
          <>
            {/* {canModifyEmail && !pendingEmailChange && (
              <button 
                onClick={() => setMode("change")}
                className="email-linking-btn secondary"
                disabled={isLoading}
              >
                Change Email
              </button>
            )} */}
            
            {hasEmailAuth && (
              <button 
                onClick={() => setMode("password")}
                className="email-linking-btn secondary"
                disabled={isLoading}
              >
                Change Password
              </button>
            )}
            
            {!isEmailVerified && !pendingEmailChange && (
              <button 
                onClick={handleResendVerification}
                className="email-linking-btn tertiary"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Verification"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );

  const renderLinkForm = () => (
    <div className="email-linking-form">
      <h4>Link Email & Password</h4>
      <div className="email-linking-field">
        <label>Email Address</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter your email"
          className="email-linking-input"
          required
        />
      </div>
      
      <div className="email-linking-field">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password (min 6 characters)"
          className="email-linking-input"
          required
        />
      </div>
      
      <div className="email-linking-field">
        <label>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          className="email-linking-input"
          required
        />
      </div>
      
      <div className="email-linking-actions">
        <button 
          onClick={handleLinkEmail}
          className="email-linking-btn primary"
          disabled={isLoading}
        >
          {isLoading ? "Linking..." : "Link Email"}
        </button>
        <button 
          onClick={handleCancel}
          className="email-linking-btn secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </div>
  );

//   const renderChangeForm = () => (
//     <div className="email-linking-form">
//       <h4>Change Email Address</h4>
//       <div className="email-linking-info-box">
//         <p>⚠️ <strong>Important:</strong> You'll need to verify your new email address before the change takes effect. Check your new email inbox after submitting.</p>
//       </div>
      
//       <div className="email-linking-field">
//         <label>Current Email</label>
//         <input
//           type="email"
//           value={currentEmail}
//           disabled
//           className="email-linking-input disabled"
//         />
//       </div>
      
//       <div className="email-linking-field">
//         <label>New Email Address</label>
//         <input
//           type="email"
//           value={newEmail}
//           onChange={(e) => setNewEmail(e.target.value)}
//           placeholder="Enter new email"
//           className="email-linking-input"
//           required
//         />
//       </div>
      
//       {hasEmailAuth && (
//         <div className="email-linking-field">
//           <label>Current Password</label>
//           <input
//             type="password"
//             value={currentPassword}
//             onChange={(e) => setCurrentPassword(e.target.value)}
//             placeholder="Enter current password"
//             className="email-linking-input"
//             required
//           />
//         </div>
//       )}
      
//       <div className="email-linking-actions">
//         <button 
//           onClick={handleChangeEmail}
//           className="email-linking-btn primary"
//           disabled={isLoading}
//         >
//           {isLoading ? "Sending Verification..." : "Send Verification Email"}
//         </button>
//         <button 
//           onClick={handleCancel}
//           className="email-linking-btn secondary"
//           disabled={isLoading}
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );

  const renderPasswordForm = () => (
    <div className="email-linking-form">
      <h4>Change Password</h4>
      <div className="email-linking-field">
        <label>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          className="email-linking-input"
          required
        />
      </div>
      
      <div className="email-linking-field">
        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter new password (min 6 characters)"
          className="email-linking-input"
          required
        />
      </div>
      
      <div className="email-linking-field">
        <label>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="email-linking-input"
          required
        />
      </div>
      
      <div className="email-linking-actions">
        <button 
          onClick={handleChangePassword}
          className="email-linking-btn primary"
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </button>
        <button 
          onClick={handleCancel}
          className="email-linking-btn secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="email-linking-container">
      <div className="email-linking-header">
        <h3>Email Authentication</h3>
        <p className="email-linking-description">
          {!currentEmail 
            ? "Link an email address to enable email/password sign-in" 
            : canModifyEmail 
              ? "Manage your email address and password" 
              : "Your email is managed by a connected social account"
          }
        </p>
      </div>
      
      {mode === "view" && renderEmailDisplay()}
      {mode === "link" && renderLinkForm()}
      {/* {mode === "change" && renderChangeForm()} */}
      {mode === "password" && renderPasswordForm()}
      
      {!isEmailVerified && currentEmail && mode === "view" && !pendingEmailChange && (
        <div className="email-linking-warning">
          <p>⚠ Your email address is not verified. Some features may be limited.</p>
        </div>
      )}
    </div>
  );
}

export default EmailLinking;