import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { auth } from "../../../firebaseConfig";
import {
    FacebookAuthProvider,
    linkWithPopup,
    unlink,
    onAuthStateChanged
} from "firebase/auth";
import axios from "axios";
import {
    updateUserFirestore,
    validateUnlinking,
    handleAuthError,
    reloadAndCheckProvider
} from './utils/authUtils';
import AuthStatusDisplay from './utils/AuthStatusDisplay';
import "./FacebookLinking.css";

function FacebookLinking({ user, userData, setUserData, initialData, setInitialData }) {
    const [isLinkingFacebook, setIsLinkingFacebook] = useState(false);
    const [facebookLinked, setFacebookLinked] = useState(false);

    const facebookProvider = new FacebookAuthProvider();

    // Check if Facebook is linked
    const checkFacebookLinkStatus = async () => {
        const isLinked = await reloadAndCheckProvider('facebook.com');
        setFacebookLinked(isLinked);
        console.log("Facebook link status:", isLinked);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                checkFacebookLinkStatus();
            }
        });

        return unsubscribe;
    }, []);

    const handleLinkFacebook = async () => {
        setIsLinkingFacebook(true);
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

            const freshFacebookProvider = new FacebookAuthProvider();
            freshFacebookProvider.addScope('email');
            freshFacebookProvider.addScope('public_profile');

            const result = await linkWithPopup(currentUser, freshFacebookProvider);

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

                    console.log("Email updated to Facebook email:", result.user.email);
                } catch (emailUpdateError) {
                    console.error("Error updating email in profile:", emailUpdateError);
                }
            }

            // Update Firestore with linked account info
            await updateUserFirestore(currentUser.uid, {
                facebookLinked: true,
                [`linkedAccounts.facebook`]: {
                    linkedAt: new Date().toISOString(),
                    becamePrimaryEmail: !hadEmailBefore,
                }
            });

            setFacebookLinked(true);

            setTimeout(() => {
                checkFacebookLinkStatus();
            }, 1000);

            if (!hadEmailBefore) {
                toast.success("Facebook account linked successfully! Your Facebook email has been set as your profile email.");
            } else {
                toast.success("Facebook account linked successfully!");
            }

        } catch (error) {
            handleAuthError(error, 'link', 'Facebook account');
            if (error.code === 'auth/provider-already-linked') {
                setTimeout(() => {
                    checkFacebookLinkStatus();
                }, 500);
            }
        } finally {
            setIsLinkingFacebook(false);
        }
    };

    const handleUnlinkFacebook = async () => {
        setIsLinkingFacebook(true);
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                toast.error("User not authenticated", { className: "custom-toast-error" });
                setIsLinkingFacebook(false);
                return;
            }

            console.log("Current providers:", currentUser.providerData);
            console.log("Provider count:", currentUser.providerData.length);

            // Check if user has other sign-in methods
            if (currentUser.providerData.length <= 1) {
                toast.error("Cannot unlink Facebook account. You need at least one authentication method to access your account. Please add another sign-in method first.",
                    { className: "custom-toast-error" });
                setIsLinkingFacebook(false);
                return;
            }

            // Check if Facebook email is the primary email
            const facebookProvider = currentUser.providerData.find(
                provider => provider.providerId === 'facebook.com'
            );

            const isFacebookPrimaryEmail = facebookProvider && currentUser.email === facebookProvider.email;

            // If Facebook email is primary email, prevent unlinking
            if (isFacebookPrimaryEmail) {
                // Check if user has other email authentication methods
                const hasPasswordProvider = currentUser.providerData.some(
                    provider => provider.providerId === 'password'
                );

                if (!hasPasswordProvider) {
                    toast.error("Cannot unlink Facebook account because it provides your primary email address and you don't have email/password authentication set up. Please add email/password authentication first.",
                        { className: "custom-toast-error" });
                    setIsLinkingFacebook(false);
                    return;
                } else {
                    // Even with password auth, we shouldn't unlink if Facebook provides primary email
                    toast.error("Cannot unlink Facebook account because it provides your primary email address. This would prevent you from accessing your account.",
                        { className: "custom-toast-error" });
                    setIsLinkingFacebook(false);
                    return;
                }
            }

            // Proceed with unlinking
            await unlink(currentUser, FacebookAuthProvider.PROVIDER_ID);

            await currentUser.reload();

            // Update Firestore
            await updateUserFirestore(currentUser.uid, {
                facebookLinked: false,
                [`linkedAccounts.facebook`]: {
                    unlinkedAt: new Date().toISOString(),
                }
            });

            setFacebookLinked(false);

            setTimeout(() => {
                checkFacebookLinkStatus();
            }, 1000);

            toast.success("Facebook account unlinked successfully!");

        } catch (error) {
            console.error("Error unlinking Facebook account:", error);

            if (error.code === 'auth/no-such-provider') {
                toast.info("Facebook account was not linked to this user",
                    { className: "custom-toast-info" });
                setFacebookLinked(false);
            } else {
                toast.error("Failed to unlink Facebook account. Please try again.",
                    { className: "custom-toast-error" });
            }
        } finally {
            setIsLinkingFacebook(false);
        }
    };

    const getUnlinkValidation = () => {
        return validateUnlinking('facebook.com');
    };

    return (
        <div className="Facebook-Linking-edit-profile-field">
            <label className="Facebook-Linking-edit-profile-label">Facebook Account</label>
            <div className="Facebook-Linking-facebook-link-container">
                <AuthStatusDisplay
                    isLinked={facebookLinked}
                    providerName="Facebook account"
                    warningMessage={getUnlinkValidation().reason}
                    showWarning={facebookLinked && !getUnlinkValidation().allowed}
                />
                <button
                    type="button"
                    onClick={facebookLinked ? handleUnlinkFacebook : handleLinkFacebook}
                    disabled={isLinkingFacebook || (facebookLinked && !getUnlinkValidation().allowed)}
                    className={`Facebook-Linking-facebook-link-btn ${facebookLinked ? 'Facebook-Linking-unlink' : 'Facebook-Linking-link'} ${facebookLinked && !getUnlinkValidation().allowed ? 'Facebook-Linking-disabled' : ''
                        }`}
                >
                    {isLinkingFacebook
                        ? (facebookLinked ? 'Unlinking...' : 'Linking...')
                        : (facebookLinked ? 'Unlink Facebook' : 'Link Facebook')
                    }
                </button>
            </div>
        </div>
    );
}

export default FacebookLinking;