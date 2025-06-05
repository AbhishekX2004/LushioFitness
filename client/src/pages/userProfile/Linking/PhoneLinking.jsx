import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { toast } from 'react-toastify';
import { auth } from "../../../firebaseConfig";
import "./PhoneLinking.css";
import {
    PhoneAuthProvider,
    linkWithCredential,
    updatePhoneNumber,
    unlink,
    onAuthStateChanged
} from "firebase/auth";

import {
    getAuthMethodsInfo,
    updateUserFirestore,
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
    const [currentPhoneNumber, setCurrentPhoneNumber] = useState("");
    const [phoneLinked, setPhoneLinked] = useState(false);
    const [isLinkingPhone, setIsLinkingPhone] = useState(false);
    const [showPhoneVerification, setShowPhoneVerification] = useState(false);
    const [phoneForLinking, setPhoneForLinking] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
    const [showPhoneChangeForm, setShowPhoneChangeForm] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState("");

    // Check if Phone is linked
    const checkPhoneLinkStatus = async () => {
        const isLinked = await reloadAndCheckProvider('phone');
        setPhoneLinked(isLinked);

        if (isLinked && auth.currentUser) {
            setCurrentPhoneNumber(auth.currentUser.phoneNumber || "");
        } else {
            setCurrentPhoneNumber("");
        }

        console.log("Phone link status:", isLinked);
    };

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
            setTimeout(() => {
                checkPhoneLinkStatus();
            }, 1000);

        } catch (error) {
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
            setTimeout(() => {
                checkPhoneLinkStatus();
            }, 1000);

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
        if (!validatePhoneNumber(newPhoneNumber)) {
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
            await updateUserFirestore(currentUser.uid, {
                phoneLinked: true,
                phoneNumber: formatPhoneNumber(newPhoneNumber),
                ['linkedAccounts.phone']: {
                    phoneNumber: formatPhoneNumber(newPhoneNumber),
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
            handleAuthError(error, 'verify', 'phone number');
            if (error.code === 'auth/code-expired') {
                setShowPhoneVerification(false);
            }
        } finally {
            setIsLinkingPhone(false);
        }
    };

    return (
        <div className="phone-linking-edit-profile-field">
            {/* Recaptcha container for phone verification */}
            <div id="recaptcha-container-phone"></div>

            <label className="phone-linking-edit-profile-label">Phone Authentication</label>
            <div className="phone-linking-phone-auth-container">
                <AuthStatusDisplay
                    isLinked={phoneLinked}
                    providerName="Phone authentication"
                    warningMessage={!getAuthMethodsInfo().canUnlink ? "Cannot disable: Phone is your only authentication method" : ""}
                    successMessage={getAuthMethodsInfo().canUnlink ? "Add phone authentication for additional security" : ""}
                    showWarning={phoneLinked && !getAuthMethodsInfo().canUnlink}
                />

                {phoneLinked && currentPhoneNumber && (
                    <div className="phone-linking-current-phone-display">
                        <label>Current Phone Number:</label>
                        <PhoneInput
                            country={"in"}
                            value={currentPhoneNumber}
                            disabled={true}
                            inputStyle={{ 
                                width: '100%', 
                                height: '40px',
                                backgroundColor: '#e9ecef',
                                cursor: 'not-allowed'
                            }}
                            containerStyle={{
                                opacity: 0.8
                            }}
                        />
                    </div>
                )}

                {!phoneLinked && !showPhoneVerification && (
                    <div className="phone-linking-phone-link-form">
                        <div>
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
                            className="phone-linking-phone-link-button"
                        >
                            {isLinkingPhone ? 'Sending Code...' : 'Link Phone Number'}
                        </button>
                    </div>
                )}

                {showPhoneChangeForm && (
                    <div className="phone-linking-phone-change-form">
                        <h4>Change Phone Number</h4>
                        <div>
                            <PhoneInput
                                country={"in"}
                                value={newPhoneNumber}
                                onChange={setNewPhoneNumber}
                                placeholder="Enter new phone number"
                                inputStyle={{ width: '100%', height: '40px' }}
                            />
                        </div>
                        <div className="phone-linking-button-group">
                            <button
                                type="button"
                                onClick={handleChangePhone}
                                disabled={isLinkingPhone}
                                className="phone-linking-send-code-button"
                            >
                                {isLinkingPhone ? 'Sending...' : 'Send Code'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPhoneChangeForm(false);
                                    setNewPhoneNumber('');
                                }}
                                className="phone-linking-cancel-button"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {showPhoneVerification && (
                    <div className="phone-linking-phone-verification-form">
                        <h4>Enter Verification Code</h4>
                        <p>We've sent a verification code to {showPhoneChangeForm ? newPhoneNumber : phoneForLinking}</p>
                        <div>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter 6-digit code"
                                maxLength="6"
                                className="phone-linking-verification-input"
                            />
                        </div>
                        <div className="phone-linking-button-group">
                            <button
                                type="button"
                                onClick={showPhoneChangeForm ? handleVerifyAndChangePhone : handleVerifyAndLinkPhone}
                                disabled={isLinkingPhone}
                                className="phone-linking-verify-button"
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
                                className="phone-linking-cancel-verification-button"
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
                        className="phone-linking-unlink-button"
                    >
                        {isLinkingPhone ? 'Unlinking...' : 'Disable Phone Authentication'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default PhoneLinking;