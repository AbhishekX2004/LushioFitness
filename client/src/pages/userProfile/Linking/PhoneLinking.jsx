import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
// import { isValidPhoneNumber } from "libphonenumber-js";
import "react-phone-input-2/lib/style.css";
import { toast } from 'react-toastify';
import { auth, db } from "../../../firebaseConfig"; // Adjust path as needed
import {
    PhoneAuthProvider,
    linkWithCredential,
    // RecaptchaVerifier,
    // signInWithPhoneNumber,
    updatePhoneNumber,
    unlink,
    onAuthStateChanged
} from "firebase/auth";
// import { doc, updateDoc } from "firebase/firestore";

import {
    getAuthMethodsInfo,
    updateUserFirestore,
    validateUnlinking,
    handleAuthError,
    reloadAndCheckProvider
} from './utils/authUtils';
import {
    initializeRecaptcha,
    sendVerificationCode,
    validatePhoneNumber,
    formatPhoneNumber,
    cleanupRecaptcha
} from './utils/phoneAuthUtils';
import AuthStatusDisplay from './utils/AuthStatusDisplay';

function PhoneLinking() {
    // Phone linking states
    const [phoneLinked, setPhoneLinked] = useState(false);
    const [isLinkingPhone, setIsLinkingPhone] = useState(false);
    const [showPhoneVerification, setShowPhoneVerification] = useState(false);
    const [phoneForLinking, setPhoneForLinking] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
    const [showPhoneChangeForm, setShowPhoneChangeForm] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState("");

    // Get authentication methods info for display
    //   const getAuthMethodsInfo = () => {
    //     const currentUser = auth.currentUser;
    //     if (!currentUser) return { canUnlink: false, methods: [] };

    //     const methods = currentUser.providerData.map(provider => {
    //       switch(provider.providerId) {
    //         case 'google.com':
    //           return 'Google';
    //         case 'password':
    //           return 'Email/Password';
    //         case 'phone':
    //           return 'Phone';
    //         case 'facebook.com':
    //           return 'Facebook';
    //         default:
    //           return provider.providerId;
    //       }
    //     });

    //     const canUnlink = currentUser.providerData.length > 1;
    //     return { canUnlink, methods };
    //   };

    // Check if Phone is linked
    const checkPhoneLinkStatus = async () => {
        // const currentUser = auth.currentUser;
        // if (currentUser) {
        //   try {
        //     await currentUser.reload();
        //     const phoneProvider = currentUser.providerData.find(
        //       provider => provider.providerId === 'phone'
        //     );
        //     setPhoneLinked(!!phoneProvider);
        //     console.log("Phone link status:", !!phoneProvider);
        //   } catch (error) {
        //     console.error("Error checking phone link status:", error);
        //     const phoneProvider = currentUser.providerData.find(
        //       provider => provider.providerId === 'phone'
        //     );
        //     setPhoneLinked(!!phoneProvider);
        //   }
        // }
        const isLinked = await reloadAndCheckProvider('phone');
        setPhoneLinked(isLinked);
        console.log("Phone link status:", isLinked);
    };

    // Initialize recaptcha verifier
    // const initializeRecaptcha = () => {
    //     if (!recaptchaVerifier) {
    //         const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-phone', {
    //             size: 'invisible',
    //             callback: (response) => {
    //                 console.log("Recaptcha resolved");
    //             }
    //         });
    //         setRecaptchaVerifier(verifier);
    //         return verifier;
    //     }
    //     return recaptchaVerifier;
    // };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                checkPhoneLinkStatus();
            }
        });

        return () => {
            unsubscribe();
            cleanupRecaptcha(recaptchaVerifier);
        };
    }, [recaptchaVerifier]);

    // Handle phone number linking
    const handleLinkPhone = async () => {
        // let phone = `+${phoneForLinking}`
        if (!validatePhoneNumber(phoneForLinking)) {
            toast.error("Please enter a valid phone number", { className: "custom-toast-error" });
            return;
        }

        setIsLinkingPhone(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("User not authenticated", { className: "custom-toast-error" });
                return;
            }

            const verifier = initializeRecaptcha('recaptcha-container-phone', recaptchaVerifier);
            setRecaptchaVerifier(verifier);
            try {
                const phone = formatPhoneNumber(phoneForLinking);
                const confirmationResult = await sendVerificationCode(phone, verifier);
                setConfirmationResult(confirmationResult);
                setShowPhoneVerification(true);
            } catch (error) {
                handleAuthError(error, 'send verification to', 'phone number');
            }

        } catch (error) {
            console.error("Error sending verification code:", error);

            if (error.code === 'auth/phone-number-already-exists') {
                toast.error("This phone number is already linked to another account",
                    { className: "custom-toast-error" });
            } else if (error.code === 'auth/invalid-phone-number') {
                toast.error("Invalid phone number format", { className: "custom-toast-error" });
            } else if (error.code === 'auth/too-many-requests') {
                toast.error("Too many requests. Please try again later", { className: "custom-toast-error" });
            } else {
                toast.error(`Failed to send verification code: ${error.message}`,
                    { className: "custom-toast-error" });
            }
        } finally {
            setIsLinkingPhone(false);
        }
    };

    // Verify phone number and link
    const handleVerifyAndLinkPhone = async () => {
        if (!verificationCode) {
            toast.error("Please enter the verification code", { className: "custom-toast-error" });
            return;
        }

        setIsLinkingPhone(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !confirmationResult) {
                toast.error("Verification session expired. Please try again.", { className: "custom-toast-error" });
                setShowPhoneVerification(false);
                return;
            }

            // Create phone credential
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, verificationCode);

            // Link the credential to the current user
            await linkWithCredential(currentUser, credential);

            // Update Firestore
            // try {
            //     const userDocRef = doc(db, "users", currentUser.uid);
            //     await updateDoc(userDocRef, {
            //         phoneLinked: true,
            //         linkedAccounts: {
            //             phone: {
            //                 phoneNumber: `+${phoneForLinking}`,
            //                 linkedAt: new Date().toISOString()
            //             }
            //         }
            //     });
            // } catch (firestoreError) {
            //     console.log("Firestore update error (non-critical):", firestoreError);
            // }
            await updateUserFirestore(currentUser.uid, {
                phoneLinked: true,
                phoneNumber: formatPhoneNumber(phoneForLinking),
                ['linkedAccounts.phone']: {
                    phoneNumber: formatPhoneNumber(phoneForLinking),
                    linkedAt: new Date().toISOString()
                },
            });

            setPhoneLinked(true);
            setShowPhoneVerification(false);
            setPhoneForLinking("");
            setVerificationCode("");
            setConfirmationResult(null);

            setTimeout(() => {
                checkPhoneLinkStatus();
            }, 1000);

            toast.success("Phone number linked successfully!");

        } catch (error) {
            // console.error("Error verifying phone number:", error);

            // if (error.code === 'auth/invalid-verification-code') {
            //     toast.error("Invalid verification code. Please try again.", { className: "custom-toast-error" });
            // } else if (error.code === 'auth/code-expired') {
            //     toast.error("Verification code expired. Please request a new one.", { className: "custom-toast-error" });
            //     setShowPhoneVerification(false);
            // } else if (error.code === 'auth/credential-already-in-use') {
            //     toast.error("This phone number is already linked to another account",
            //         { className: "custom-toast-error" });
            // } else {
            //     toast.error(`Failed to verify phone number: ${error.message}`,
            //         { className: "custom-toast-error" });
            // }
            handleAuthError(error, 'verify', 'phone number');
            if (error.code === 'auth/code-expired') {
                setShowPhoneVerification(false);
            }
        } finally {
            setIsLinkingPhone(false);
        }
    };

    // Handle phone number unlinking
    const handleUnlinkPhone = async () => {
        setIsLinkingPhone(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("User not authenticated", { className: "custom-toast-error" });
                setIsLinkingPhone(false);
                return;
            }

            // Check if user has other sign-in methods
            if (currentUser.providerData.length <= 1) {
                toast.error("Cannot unlink phone number. You need at least one authentication method to access your account.",
                    { className: "custom-toast-error" });
                setIsLinkingPhone(false);
                return;
            }

            await unlink(currentUser, PhoneAuthProvider.PROVIDER_ID);
            await currentUser.reload();

            // Update Firestore
            // try {
            //     const userDocRef = doc(db, "users", currentUser.uid);
            //     await updateDoc(userDocRef, {
            //         phoneLinked: false,
            //         linkedAccounts: {
            //             phone: null
            //         },
            //         phoneUnlinkedAt: new Date().toISOString()
            //     });
            // } catch (firestoreError) {
            //     console.log("Firestore update error (non-critical):", firestoreError);
            // }

            await updateUserFirestore(currentUser.uid, {
                phoneLinked: false,
                phoneNumber: "",
                ['linkedAccounts.phone']: {
                    unlinkedAt: new Date().toISOString(),
                }
            });

            setPhoneLinked(false);

            setTimeout(() => {
                checkPhoneLinkStatus();
            }, 1000);

            toast.success("Phone number unlinked successfully!");

        } catch (error) {
            console.error("Error unlinking phone number:", error);

            if (error.code === 'auth/no-such-provider') {
                toast.info("Phone number was not linked to this user", { className: "custom-toast-info" });
                setPhoneLinked(false);
            } else {
                toast.error("Failed to unlink phone number. Please try again.",
                    { className: "custom-toast-error" });
            }
        } finally {
            setIsLinkingPhone(false);
        }
    };

    // Handle changing linked phone number
    const handleChangePhone = async () => {
        // let phone = `+${newPhoneNumber}`;
        // if (!newPhoneNumber || !isValidPhoneNumber(phone)) {
        //     toast.error("Please enter a valid phone number", { className: "custom-toast-error" });
        //     return;
        // }
        if (!validatePhoneNumber(phoneForLinking)) {
            toast.error("Please enter a valid phone number", { className: "custom-toast-error" });
            return;
        }   

        setIsLinkingPhone(true);
        try {
            const verifier = initializeRecaptcha('recaptcha-container-phone', recaptchaVerifier);
            setRecaptchaVerifier(verifier);

            try {
                const phone = formatPhoneNumber(newPhoneNumber);
                const confirmationResult = await sendVerificationCode(phone, verifier);
                setConfirmationResult(confirmationResult);
                setShowPhoneVerification(true);
            } catch (error) {
                handleAuthError(error, 'send verification to', 'phone number');
            }

        } catch (error) {
            console.error("Error sending verification code for phone change:", error);
            toast.error(`Failed to send verification code: ${error.message}`,
                { className: "custom-toast-error" });
        } finally {
            setIsLinkingPhone(false);
        }
    };

    // Verify and update phone number
    const handleVerifyAndChangePhone = async () => {
        if (!verificationCode) {
            toast.error("Please enter the verification code", { className: "custom-toast-error" });
            return;
        }

        setIsLinkingPhone(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !confirmationResult) {
                toast.error("Verification session expired. Please try again.", { className: "custom-toast-error" });
                setShowPhoneVerification(false);
                return;
            }

            // Create phone credential
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, verificationCode);

            // Update phone number
            await updatePhoneNumber(currentUser, credential);

            // Update Firestore
            // try {
            //     const userDocRef = doc(db, "users", currentUser.uid);
            //     await updateDoc(userDocRef, {
            //         linkedAccounts: {
            //             phone: {
            //                 phoneNumber: `+${newPhoneNumber}`,
            //                 updatedAt: new Date().toISOString()
            //             }
            //         }
            //     });
            // } catch (firestoreError) {
            //     console.log("Firestore update error (non-critical):", firestoreError);
            // }
            await updateUserFirestore(currentUser.uid, {
                phoneLinked: true,
                phoneNumber: formatPhoneNumber(phoneForLinking),
                ['linkedAccounts.phone']: {
                    phoneNumber: formatPhoneNumber(phoneForLinking),
                    linkedAt: new Date().toISOString()
                },
            });

            setShowPhoneVerification(false);
            setShowPhoneChangeForm(false);
            setNewPhoneNumber("");
            setVerificationCode("");
            setConfirmationResult(null);

            setTimeout(() => {
                checkPhoneLinkStatus();
            }, 1000);

            toast.success("Phone number updated successfully!");

        } catch (error) {
            // console.error("Error updating phone number:", error);

            // if (error.code === 'auth/invalid-verification-code') {
            //     toast.error("Invalid verification code. Please try again.", { className: "custom-toast-error" });
            // } else if (error.code === 'auth/code-expired') {
            //     toast.error("Verification code expired. Please request a new one.", { className: "custom-toast-error" });
            //     setShowPhoneVerification(false);
            // } else {
            //     toast.error(`Failed to update phone number: ${error.message}`,
            //         { className: "custom-toast-error" });
            // }
            handleAuthError(error, 'verify', 'phone number');
            if (error.code === 'auth/code-expired') {
                setShowPhoneVerification(false);
            }
        } finally {
            setIsLinkingPhone(false);
        }
    };

    return (
        <div className="edit-profile-field">
            {/* Recaptcha container for phone verification */}
            <div id="recaptcha-container-phone"></div>

            <label className="edit-profile-label">Phone Authentication</label>
            <div className="phone-auth-container">
                {/* <div className="phone-auth-status">
                    <span className={`phone-status ${phoneLinked ? 'linked' : 'not-linked'}`}>
                        {phoneLinked ? '✓ Phone authentication enabled' : '✗ Phone authentication not enabled'}
                    </span>
                    {phoneLinked && (
                        <div className="phone-auth-actions" style={{ marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setShowPhoneChangeForm(!showPhoneChangeForm)}
                                disabled={isLinkingPhone}
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    marginRight: '8px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Change Phone Number
                            </button>
                        </div>
                    )}
                    {!phoneLinked && getAuthMethodsInfo().canUnlink && (
                        <small style={{ color: '#28a745', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                            Add phone authentication for additional security
                        </small>
                    )}
                    {phoneLinked && !getAuthMethodsInfo().canUnlink && (
                        <small style={{ color: '#ff9800', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                            Cannot disable: Phone is your only authentication method
                        </small>
                    )}
                </div> */}

                <AuthStatusDisplay
                    isLinked={phoneLinked}
                    providerName="Phone authentication"
                    warningMessage={!getAuthMethodsInfo().canUnlink ? "Cannot disable: Phone is your only authentication method" : ""}
                    successMessage={getAuthMethodsInfo().canUnlink ? "Add phone authentication for additional security" : ""}
                    showWarning={phoneLinked && !getAuthMethodsInfo().canUnlink}
                />

                {!phoneLinked && !showPhoneVerification && (
                    <div className="phone-link-form" style={{ marginTop: '12px' }}>
                        <div style={{ marginBottom: '8px' }}>
                            <PhoneInput
                                country={"in"}
                                value={phoneForLinking}
                                onChange={setPhoneForLinking}
                                placeholder="Enter phone number to link"
                                inputStyle={{ width: '100%', height: '40px' }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleLinkPhone}
                            disabled={isLinkingPhone}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {isLinkingPhone ? 'Sending Code...' : 'Link Phone Number'}
                        </button>
                    </div>
                )}

                {showPhoneChangeForm && (
                    <div className="phone-change-form" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Change Phone Number</h4>
                        <div style={{ marginBottom: '8px' }}>
                            <PhoneInput
                                country={"in"}
                                value={newPhoneNumber}
                                onChange={setNewPhoneNumber}
                                placeholder="Enter new phone number"
                                inputStyle={{ width: '100%', height: '40px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={handleChangePhone}
                                disabled={isLinkingPhone}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {isLinkingPhone ? 'Sending...' : 'Send Code'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPhoneChangeForm(false);
                                    setNewPhoneNumber('');
                                }}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showPhoneVerification && (
                    <div className="phone-verification-form" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Enter Verification Code</h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666' }}>
                            We've sent a verification code to {showPhoneChangeForm ? newPhoneNumber : phoneForLinking}
                        </p>
                        <div style={{ marginBottom: '12px' }}>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={showPhoneChangeForm ? handleVerifyAndChangePhone : handleVerifyAndLinkPhone}
                                disabled={isLinkingPhone}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                {isLinkingPhone ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPhoneVerification(false);
                                    setShowPhoneChangeForm(false);
                                    setVerificationCode('');
                                    setPhoneForLinking('');
                                    setNewPhoneNumber('');
                                    setConfirmationResult(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {phoneLinked && (
                    <button
                        type="button"
                        onClick={handleUnlinkPhone}
                        disabled={isLinkingPhone || !getAuthMethodsInfo().canUnlink}
                        style={{
                            marginTop: '12px',
                            padding: '8px 16px',
                            backgroundColor: getAuthMethodsInfo().canUnlink ? '#dc3545' : '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: getAuthMethodsInfo().canUnlink ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {isLinkingPhone ? 'Unlinking...' : 'Disable Phone Authentication'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default PhoneLinking;