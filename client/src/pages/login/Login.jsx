import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import signInWithGoogle from "../../auth/googleAuth";
import {toast} from "react-toastify"
import signInWithFacebook from "../../auth/facebookAuth";
import { handleEmailLogin, sendEmailSignInLink } from "../../auth/emailAuth";
import { sendOtp, verifyOtpForLogin } from "../../auth/phoneAuth";
import "./auth.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isPhone, setIsPhone] = useState(false);
  const [loginMethod, setLoginMethod] = useState("password");
  const [showRadioButtons, setShowRadioButtons] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  const navigate = useNavigate();
  const phoneInputRef = useRef(null);

  useEffect(() => {
    if (/^\d/.test(identifier)) {
      setIsPhone(true);
      setPhone(identifier);
      setTimeout(() => {
        if (phoneInputRef.current) {
          phoneInputRef.current.focus();
        }
      }, 0);
    } else {
      setIsPhone(false);
    }
  }, [identifier,phone]);

  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent) {
      setIsButtonDisabled(false); // Enable the Resend OTP button after 1 minute
    }

    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (!/^\d/.test(e.target.value)) {
      handleEmailInput(e);
    }
  };

  const handlePhoneChange = (value) => {
    setPhone(value);
    setIdentifier(value);
  };

  const handleGoogleSignIn = async () => {
    setIsButtonDisabled(true);
    try {
      await signInWithGoogle();
      navigate("/user");
    } catch (error) {
      console.error("Error during Google sign-in", error);
      setIsButtonDisabled(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsButtonDisabled(true);
    try {
      await signInWithFacebook();
      navigate("/user");
    } catch (error) {
      console.error("Error during Facebook sign-in", error);
      setIsButtonDisabled(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);

    if (isPhone) {
      try {
        if (!otpSent) {
          const result = await sendOtp(`+${phone}`);
          setConfirmationResult(result);
          setOtpSent(true);
          setOtpTimer(60); // Set timer for 1 minute
        } else {
          await verifyOtpForLogin(confirmationResult, otp);
          navigate("/user");
        }
      } catch (error) {
        console.error("Error with phone login :: ", error);
        setIsButtonDisabled(false);
        console.log("Invalid OTP");
      }
    } else {
      if (loginMethod === "otp") {
        try {
          await sendEmailSignInLink(identifier);
        } catch (error) {
          console.error("Error sending email sign-in link", error);
        }
      } else {
        try {
          await handleEmailLogin(identifier, password);
          navigate("/user");
        } catch (error) {
          console.error("Error logging in with email ::", error);
          setIsButtonDisabled(false);
                 toast.error("Invalid email/password",{className:"custom-toast-error"})

        }
      }
    }
  };

  const handleResendOtp = async () => {
    setIsButtonDisabled(true);
    try {
      const result = await sendOtp(`+${phone}`);
      setConfirmationResult(result);
      setOtpTimer(60); // Reset timer for another 1 minute
    } catch (error) {
      console.error("Error resending OTP", error);
      setIsButtonDisabled(false);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      await verifyOtpForLogin(confirmationResult, otp);
      navigate("/user");
    } catch (error) {
      console.error("Error verifying OTP", error);
    }
  };

  const handleEmailInput = (e) => {
    setIdentifier(e.target.value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(e.target.value)) {
      setShowRadioButtons(true);
    } else {
      setShowRadioButtons(false);
    }
  };

  return (
    <div className="auth-container">
       
      <form className="auth-form" onSubmit={handleFormSubmit}>
        <h2>Login</h2>
        {!isPhone ? (
          <input
            type="text"
            placeholder="Enter your email or phone number"
            value={identifier}
            onChange={handleIdentifierChange}
            required
            disabled={isButtonDisabled && !otpSent}
          />
        ) : (
          <PhoneInput
            country={"in"}
            value={phone}
            onChange={handlePhoneChange}
            disabled={isButtonDisabled && !otpSent}
            inputProps={{
              ref: phoneInputRef,
            }}
          />
        )}
        {showRadioButtons && !isPhone && (
          <div className="login-method">
            <label>
              <input
                type="radio"
                value="password"
                checked={loginMethod === "password"}
                onChange={() => setLoginMethod("password")}
                disabled={isButtonDisabled && !otpSent}
              />
              Password
            </label>
            <label>
              <input
                type="radio"
                value="otp"
                checked={loginMethod === "otp"}
                onChange={() => setLoginMethod("otp")}
                disabled={isButtonDisabled && !otpSent}
              />
              OTP
            </label>
          </div>
        )}
        {loginMethod === "password" && showRadioButtons && (
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isButtonDisabled && !otpSent}
          />
        )}
        {otpSent && isPhone && (
          <div>
            <input
              type="text"
              placeholder="Enter the OTP"
              style={{ width: "130px" }}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="button" onClick={handleOtpSubmit}  id="submit-otp"  disabled={otp.length !== 6}  className={otp.length !== 6?"disabled":"enabled"}>Submit OTP</button>
          </div>
        )}
        {otpSent && isPhone && otpTimer === 0 && (
          <button type="button" onClick={handleResendOtp}  disabled={isButtonDisabled} className={isButtonDisabled?"disabled":"enabled"}>Resend OTP</button>
        )}
        {otpSent && isPhone && otpTimer !== 0 && (
          <p>Resend OTP in {otpTimer} seconds.</p>
        )}
        <button type="submit" disabled={isButtonDisabled} className={isButtonDisabled?"disabled":"enabled"}>
          Login
        </button>
        <p>Create a new account? <Link to="/register">Sign Up here</Link></p>
        <button type="button" onClick={handleGoogleSignIn} disabled={isButtonDisabled} className={isButtonDisabled?"disabled":"enabled"}>Continue With Google</button>
        <button type="button" onClick={handleFacebookSignIn} disabled={isButtonDisabled} className={isButtonDisabled?"disabled":"enabled"}>Continue With Facebook</button>
      </form>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;
