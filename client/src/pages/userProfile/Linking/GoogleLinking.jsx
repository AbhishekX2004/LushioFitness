import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { auth } from "../../../firebaseConfig";
import {
    GoogleAuthProvider,
    linkWithPopup,
    unlink,
    onAuthStateChanged
} from "firebase/auth";
import "./GoogleLinking.css";
import axios from "axios";
import {
    updateUserFirestore,
    validateUnlinking,
    handleAuthError,
    reloadAndCheckProvider
} from './utils/authUtils';
import AuthStatusDisplay from './utils/AuthStatusDisplay';

function GoogleLinking({ user, userData, setUserData, initialData, setInitialData }) {
    const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
    const [googleLinked, setGoogleLinked] = useState(false);

    const googleProvider = new GoogleAuthProvider();

    // Check if Google is linked
    const checkGoogleLinkStatus = async () => {
        const isLinked = await reloadAndCheckProvider('google.com');
        setGoogleLinked(isLinked);
        console.log("Google link status:", isLinked);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                checkGoogleLinkStatus();
            }
        });

        return unsubscribe;
    }, []);

    const handleLinkGoogle = async () => {
        setIsLinkingGoogle(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("User not authenticated", { className: "custom-toast-error" });
                return;
            }

            // Store original email before linking
            const emailBeforeLinking = currentUser.email;
            const hadEmailBefore = !!emailBeforeLinking;

            await currentUser.reload();

            const freshGoogleProvider = new GoogleAuthProvider();
            freshGoogleProvider.addScope('email');
            freshGoogleProvider.addScope('profile');

            const result = await linkWithPopup(currentUser, freshGoogleProvider);

            // If user didn't have an email before, update the profile email field
            if (!hadEmailBefore && result.user.email) {
                try {
                    // Update the local state
                    setUserData(prevData => ({
                        ...prevData,
                        email: result.user.email
                    }));

                    // Update backend
                    await axios.patch(
                        `${process.env.REACT_APP_API_URL}/user/details/${user.uid}`,
                        { email: result.user.email }
                    );

                    // Update initial data to reflect the new email
                    setInitialData(prevData => ({
                        ...prevData,
                        email: result.user.email
                    }));

                    console.log("Email updated to Google email:", result.user.email);
                } catch (emailUpdateError) {
                    console.error("Error updating email in profile:", emailUpdateError);
                }
            }
            await updateUserFirestore(currentUser.uid, {
                googleLinked: true,
                [`linkedAccounts.google`]: {
                    email: result.user.email,
                    linkedAt: new Date().toISOString(),
                    becamePrimaryEmail: !hadEmailBefore
                }                
            });

            setGoogleLinked(true);

            setTimeout(() => {
                checkGoogleLinkStatus();
            }, 1000);

            if (!hadEmailBefore) {
                toast.success("Google account linked successfully! Your Google email has been set as your profile email.");
            } else {
                toast.success("Google account linked successfully!");
            }

        } catch (error) {
            //   console.error("Error linking Google account:", error);

            //   if (error.code === 'auth/credential-already-in-use') {
            //     toast.error("This Google account is already linked to another user account", 
            //       { className: "custom-toast-error" });
            //   } else if (error.code === 'auth/provider-already-linked') {
            //     toast.info("Google account is already linked to your account", 
            //       { className: "custom-toast-info" });
            //     setTimeout(() => {
            //       checkGoogleLinkStatus();
            //     }, 500);
            //   } else if (error.code === 'auth/email-already-in-use') {
            //     toast.error("This email is already associated with another account", 
            //       { className: "custom-toast-error" });
            //   } else if (error.code === 'auth/account-exists-with-different-credential') {
            //     toast.error("An account already exists with the same email but different sign-in credentials", 
            //       { className: "custom-toast-error" });
            //   } else {
            //     toast.error(`Failed to link Google account: ${error.message}`, 
            //       { className: "custom-toast-error" });
            //   }
            handleAuthError(error, 'link', 'Google account');
            // Keep the special handling for provider-already-linked
            if (error.code === 'auth/provider-already-linked') {
                setTimeout(() => {
                    checkGoogleLinkStatus();
                }, 500);
            }
        } finally {
            setIsLinkingGoogle(false);
        }
    };

    const handleUnlinkGoogle = async () => {
        setIsLinkingGoogle(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("User not authenticated", { className: "custom-toast-error" });
                setIsLinkingGoogle(false);
                return;
            }

            console.log("Current providers:", currentUser.providerData);
            console.log("Provider count:", currentUser.providerData.length);

            // Check if user has other sign-in methods
            if (currentUser.providerData.length <= 1) {
                toast.error("Cannot unlink Google account. You need at least one authentication method to access your account. Please add another sign-in method first.",
                    { className: "custom-toast-error" });
                setIsLinkingGoogle(false);
                return;
            }

            // Check if Google email is the primary email
            const googleProvider = currentUser.providerData.find(
                provider => provider.providerId === 'google.com'
            );

            const isGooglePrimaryEmail = googleProvider && currentUser.email === googleProvider.email;

            // If Google email is primary email, prevent unlinking
            if (isGooglePrimaryEmail) {
                // Check if user has other email authentication methods
                const hasPasswordProvider = currentUser.providerData.some(
                    provider => provider.providerId === 'password'
                );

                if (!hasPasswordProvider) {
                    toast.error("Cannot unlink Google account because it provides your primary email address and you don't have email/password authentication set up. Please add email/password authentication first.",
                        { className: "custom-toast-error" });
                    setIsLinkingGoogle(false);
                    return;
                } else {
                    // Even with password auth, we shouldn't unlink if Google provides primary email
                    toast.error("Cannot unlink Google account because it provides your primary email address. This would prevent you from accessing your account.",
                        { className: "custom-toast-error" });
                    setIsLinkingGoogle(false);
                    return;
                }
            }

            // Proceed with unlinking
            await unlink(currentUser, GoogleAuthProvider.PROVIDER_ID);

            await currentUser.reload();

            await updateUserFirestore(currentUser.uid, {
                googleLinked: false,
                [`linkedAccounts.google`]: {
                    unlinkedAt: new Date().toISOString(),
                }
            });

            setGoogleLinked(false);

            setTimeout(() => {
                checkGoogleLinkStatus();
            }, 1000);

            toast.success("Google account unlinked successfully!");

        } catch (error) {
            console.error("Error unlinking Google account:", error);

            if (error.code === 'auth/no-such-provider') {
                toast.info("Google account was not linked to this user",
                    { className: "custom-toast-info" });
                setGoogleLinked(false);
            } else {
                toast.error("Failed to unlink Google account. Please try again.",
                    { className: "custom-toast-error" });
            }
        } finally {
            setIsLinkingGoogle(false);
        }
    };

    const getUnlinkValidation = () => {
        return validateUnlinking('google.com');
    };

    return (
        <div className="google-linking-edit-profile-field">
            <label className="google-linking-edit-profile-label">Google Account</label>
            <div className="google-linking-google-link-container">
                <AuthStatusDisplay
                    isLinked={googleLinked}
                    providerName="Google account"
                    warningMessage={getUnlinkValidation().reason}
                    showWarning={googleLinked && !getUnlinkValidation().allowed}
                />
                <button
                    type="button"
                    onClick={googleLinked ? handleUnlinkGoogle : handleLinkGoogle}
                    disabled={isLinkingGoogle || (googleLinked && !getUnlinkValidation().allowed)}
                    className={`google-linking-google-link-btn ${googleLinked ? 'google-linking-unlink' : 'google-linking-link'} ${googleLinked && getUnlinkValidation() ? 'google-linking-disabled' : ''
                        }`}
                >
                    {isLinkingGoogle
                        ? (googleLinked ? 'Unlinking...' : 'Linking...')
                        : (googleLinked ? 'Unlink Google' : 'Link Google')
                    }
                </button>
            </div>
        </div>
    );
}

export default GoogleLinking;