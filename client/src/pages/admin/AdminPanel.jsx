import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getUser } from "../../firebaseUtils";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./AdminPanel.css";
import AdminComponent from "./AdminComponent";
import SubAdminComponent from "./SubAdminComponent";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [OTP, setOTP] = useState("");
    const [isOTPRequested, setIsOTPRequested] = useState(false);
    const [timer, setTimer] = useState(60);
    const [isResendDisabled, setIsResendDisabled] = useState(true);
    const [selectedType, setSelectedType] = useState("admin");
    const [userType, setUserType] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getUser();
                if (user) {
                    const q = query(collection(db, "employees"), where("phone", "==", user.phoneNumber));
                    const querySnapshot = await getDocs(q);
                    let userRole = "";

                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        if (data.type === "admin" || data.type === "sub-admin") {
                            userRole = data.type;
                        }
                    });

                    if (userRole) {
                        setUserType(userRole);
                        setIsLoggedIn(true);
                    }
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        let interval;
        if (isOTPRequested && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsResendDisabled(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isOTPRequested, timer]);

    const handleOTPInput = (e) => {
        setOTP(e.target.value);
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "AdminPanel-recaptcha-container",
                {
                    size: "invisible",
                    callback: () => {
                        requestOTP();
                    },
                }
            );
        }
    };

    const requestOTP = async () => {
        setLoading(true);
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;

        try {
            const confirmationResult = await signInWithPhoneNumber(auth, `+${phoneNumber}`, appVerifier);
            window.confirmationResult = confirmationResult;
            setIsOTPRequested(true);
            setTimer(60);
            setIsResendDisabled(true);
        } catch (error) {
            console.error("Error sending OTP:", error);
            alert("Error sending OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        setLoading(true);
        try {
            const result = await window.confirmationResult.confirm(OTP);
            const user = result.user;
            
            console.log("User authenticated:", user);
            const q = query(
                collection(db, "employees"),
                where("phone", "==", `+${phoneNumber}`),
                where("type", "==", selectedType)
            );
    
            const querySnapshot = await getDocs(q);
            
            let isAdmin = false;
    
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Document data:', data);
                if (data.type === selectedType) {
                    isAdmin = true;
                }
            });
    
            if (isAdmin) {
                localStorage.setItem("adminLoggedIn", "true");
                setUserType(selectedType);
                setIsLoggedIn(true);
            } else {
                alert("You are not authorized to access the admin panel.");
                auth.signOut();
                navigate("/");
            }
        } catch (error) {
            console.error("Error verifying OTP:", error);
            alert("Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="AdminPanel-container">
            {isLoggedIn ? (
                <div className="AdminPanel-dashboard">
                    {userType === "admin" ? (
                        <AdminComponent />
                    ) : (
                        <SubAdminComponent />
                    )}
                </div>
            ) : (
                <div className="AdminPanel-auth-wrapper">
                    <div className="AdminPanel-auth-card">
                        <div className="AdminPanel-header">
                            <h1 className="AdminPanel-title">Admin Login</h1>
                            <p className="AdminPanel-subtitle">Enter your credentials to continue</p>
                        </div>

                        <div className="AdminPanel-form">
                            <div className="AdminPanel-form-group">
                                <label className="AdminPanel-label">Phone Number</label>
                                <div className="AdminPanel-phone-input">
                                    <PhoneInput
                                        country={"in"}
                                        value={phoneNumber}
                                        onChange={setPhoneNumber}
                                        placeholder="Enter phone number"
                                        inputClass="AdminPanel-phone-field"
                                        buttonClass="AdminPanel-phone-flag"
                                        dropdownClass="AdminPanel-phone-dropdown"
                                    />
                                </div>
                            </div>

                            <div className="AdminPanel-form-group">
                                <label className="AdminPanel-label">Access Level</label>
                                <div className="AdminPanel-radio-group">
                                    <label className={`AdminPanel-radio-option ${selectedType === 'admin' ? 'AdminPanel-radio-selected' : ''}`}>
                                        <input
                                            type="radio"
                                            value="admin"
                                            checked={selectedType === "admin"}
                                            onChange={handleTypeChange}
                                            className="AdminPanel-radio-input"
                                        />
                                        <span className="AdminPanel-radio-custom"></span>
                                        Admin
                                    </label>
                                    <label className={`AdminPanel-radio-option ${selectedType === 'sub-admin' ? 'AdminPanel-radio-selected' : ''}`}>
                                        <input
                                            type="radio"
                                            value="sub-admin"
                                            checked={selectedType === "sub-admin"}
                                            onChange={handleTypeChange}
                                            className="AdminPanel-radio-input"
                                        />
                                        <span className="AdminPanel-radio-custom"></span>
                                        Sub-admin
                                    </label>
                                </div>
                            </div>

                            {isOTPRequested && (
                                <div className="AdminPanel-form-group AdminPanel-otp-group">
                                    <label className="AdminPanel-label">Verification Code</label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={OTP}
                                        onChange={handleOTPInput}
                                        className="AdminPanel-otp-input"
                                        maxLength="6"
                                    />
                                </div>
                            )}

                            <div className="AdminPanel-button-group">
                                {!isOTPRequested ? (
                                    <button 
                                        onClick={requestOTP} 
                                        className="AdminPanel-btn AdminPanel-btn-primary"
                                        disabled={loading || !phoneNumber}
                                    >
                                        {loading ? (
                                            <span className="AdminPanel-loading">Sending...</span>
                                        ) : (
                                            "Request OTP"
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={verifyOTP} 
                                            className="AdminPanel-btn AdminPanel-btn-primary"
                                            disabled={loading || !OTP}
                                        >
                                            {loading ? (
                                                <span className="AdminPanel-loading">Verifying...</span>
                                            ) : (
                                                "Verify OTP"
                                            )}
                                        </button>
                                        <button
                                            onClick={requestOTP}
                                            disabled={isResendDisabled || loading}
                                            className={`AdminPanel-btn ${isResendDisabled ? 'AdminPanel-btn-disabled' : 'AdminPanel-btn-secondary'}`}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="23,4 23,10 17,10"/>
                                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                            </svg>
                                            {isResendDisabled ? `Resend (${timer}s)` : "Resend OTP"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div id="AdminPanel-recaptcha-container"></div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;