import axios from 'axios';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import signInWithGoogle from "../../auth/googleAuth";
import signInWithFacebook from "../../auth/facebookAuth";
import { handleEmailSignUp } from "../../auth/emailAuth";
import { sendOtp, verifyOtp } from "../../auth/phoneAuth";
import { checkEmailExists, checkPhoneExists, validateEmail, validatePhone, validatePassword, getPasswordValidationMessage } from "../../auth/existenceCheck";
import { toast } from "react-toastify";
import "./auth.css";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [showPwdField, setShowPwdField] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isPhone, setIsPhone] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [otpTimer, setOtpTimer] = useState(0);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [emailRegistrationSuccess, setEmailRegistrationSuccess] = useState(false);

  const navigate = useNavigate();
  const phoneInputRef = useRef(null);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  // Validate referral code

  const validateReferralCode = async (code) => {
    if (!code || code.trim() === "") return true; // Empty referral code is valid

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/search/refCode`, {
        referralCode: code.trim(),
      });

      // If 200 OK, referral exists, return true
      return true;
    } catch (error) {
      // If 404, code not found, return false
      if (error.response && error.response.status === 404) {
        return false;
      }
      // Log and assume invalid on any other error
      console.error("Error validating referral code:", error);
      return false;
    }
  };


  useEffect(() => {
    const referredBy = searchParams.get("referredBy");
    if (referredBy) {
      setReferralCode(referredBy);
    }
  }, [searchParams]);

  useEffect(() => {
    if (validateEmail(identifier)) {
      setIsPhone(false);
      setShowPwdField(true);
    } else if (/^\d/.test(identifier)) {
      setIsPhone(true);
      setPhone(identifier);
      setShowPwdField(false);
      setTimeout(() => {
        if (phoneInputRef.current) {
          phoneInputRef.current.focus();
        }
      }, 0);
    } else {
      setShowPwdField(false);
      setIsPhone(false);
    }

    // Update button disabled state
    if (isPhone) {
      setIsButtonDisabled(!isChecked);
    } else if (showPwdField) {
      const passwordValid = validatePassword(password).isValid;
      const passwordsMatch = password === confirmPassword && confirmPassword !== "";
      setIsButtonDisabled(!(isChecked && passwordValid && passwordsMatch));
    } else {
      setIsButtonDisabled(true);
    }
  }, [identifier, password, confirmPassword, isChecked, isPhone, showPwdField]);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      const errorMessage = getPasswordValidationMessage(password);
      setPasswordError(errorMessage);
    } else {
      setPasswordError("");
    }
  }, [password]);

  // Real-time password confirmation validation
  useEffect(() => {
    if (confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
      } else {
        setConfirmPasswordError("");
      }
    } else {
      setConfirmPasswordError("");
    }
  }, [password, confirmPassword]);

  const handleIdentifierInput = (e) => {
    setIdentifier(e.target.value);
  };

  const handlePhoneChange = (value) => {
    setPhone(value);
    setIdentifier(value);
  };

  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  const handleGoogleSignIn = async () => {
    setIsButtonDisabled(true);
    try {
      // Validate referral code before proceeding
      if (referralCode && !(await validateReferralCode(referralCode))) {
        toast.error("Invalid referral code. Please check and try again.", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      await signInWithGoogle(referralCode, true);
      navigate("/user");
    } catch (error) {
      console.error("Error during Google sign-up", error);
      toast.error("Google sign-up failed. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsButtonDisabled(true);
    try {
      // Validate referral code before proceeding
      if (referralCode && !(await validateReferralCode(referralCode))) {
        toast.error("Invalid referral code. Please check and try again.", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      await signInWithFacebook(referralCode, true);
      navigate("/user");
    } catch (error) {
      console.error("Error during Facebook sign-up", error);
      toast.error("Facebook sign-up failed. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  // Separate function for OTP verification
  const handleOtpSubmit = async () => {
    setIsButtonDisabled(true);
    try {
      // Validate referral code before OTP verification
      if (referralCode && !(await validateReferralCode(referralCode))) {
        toast.error("Invalid referral code. Please check and try again.", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      await verifyOtp(confirmationResult, otp, `+${phone}`, referralCode);
      toast.success("Account created successfully!", { className: "custom-toast-success" });
      navigate("/user");
    } catch (error) {
      console.error("Error verifying OTP", error);
      toast.error("Invalid OTP. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);

    // Validate referral code first (for both phone and email)
    if (referralCode && !(await validateReferralCode(referralCode))) {
      toast.error("Invalid referral code. Please check and try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
      return;
    }

    if (isPhone) {
      // Validate phone number
      if (!validatePhone(phone)) {
        toast.error("Please enter a valid phone number", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      const formattedPhone = `+${phone}`;

      if (!otpSent) {
        try {
          // Check if phone already exists
          const phoneExists = await checkPhoneExists(formattedPhone);
          if (phoneExists) {
            toast.error("An account with this phone number already exists. Please login instead.", { className: "custom-toast-error" });
            setTimeout(() => navigate("/login"), 2000);
            setIsButtonDisabled(false);
            return;
          }

          const result = await sendOtp(formattedPhone);
          setConfirmationResult(result);
          setOtpSent(true);
          setOtpTimer(60);
          toast.success("OTP sent successfully!", { className: "custom-toast-success" });
          setIsButtonDisabled(false);
        } catch (error) {
          console.error("Error sending OTP", error);
          toast.error("Failed to send OTP. Please try again.", { className: "custom-toast-error" });
          setIsButtonDisabled(false);
        }
      }
    } else {
      // Email registration
      if (!validateEmail(identifier)) {
        toast.error("Please enter a valid email address", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      if (!validatePassword(password).isValid) {
        toast.error("Please enter a valid password", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      try {
        // Check if email already exists
        const emailExists = await checkEmailExists(identifier);
        if (emailExists) {
          toast.error("An account with this email already exists. Please login instead.", { className: "custom-toast-error" });
          setTimeout(() => navigate("/login"), 2000);
          setIsButtonDisabled(false);
          return;
        }

        await handleEmailSignUp(identifier, password, referralCode);
        toast.success("Account created! Please check your email for verification.", { className: "custom-toast-success" });
        setEmailRegistrationSuccess(true);
        setIsButtonDisabled(false);
      } catch (error) {
        console.error("Error signing up with email", error);
        toast.error(error.message || "Failed to create account. Please try again.", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
      }
    }
  };

  const handleResendOtp = async () => {
    setIsButtonDisabled(true);
    try {
      const result = await sendOtp(`+${phone}`);
      setConfirmationResult(result);
      setOtpTimer(60);
      toast.success("OTP resent successfully!", { className: "custom-toast-success" });
      setIsButtonDisabled(false);
    } catch (error) {
      console.error("Error resending OTP", error);
      toast.error("Failed to resend OTP. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  // Show success message if email registration was successful
  if (emailRegistrationSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <h2>Registration Successful!</h2>
          <div className="auth-success-message">
            <p>We've sent a verification link to your email address.</p>
            <p>Please check your email and click the link to complete your registration.</p>
            <p>You can close this page once you've clicked the verification link.</p>
          </div>
          <p>Already verified? <Link to="/login">Login here</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleFormSubmit}>
        <h2>Sign Up</h2>
        {!isPhone ? (
          <input
            type="text"
            placeholder="Enter your email or phone number"
            value={identifier}
            onChange={handleIdentifierInput}
            required
            disabled={otpSent}
          />
        ) : (
          <PhoneInput
            country={"in"}
            value={phone}
            onChange={handlePhoneChange}
            disabled={otpSent}
            inputProps={{
              ref: phoneInputRef,
            }}
          />
        )}

        {otpSent && (
          <div>
            <input
              type="text"
              placeholder="Enter the OTP"
              value={otp}
              style={{ width: "100px" }}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button
              type="button"
              id="submit-otp"
              onClick={handleOtpSubmit}
              disabled={otp.length !== 6}
              className={otp.length !== 6 ? "disabled" : "enabled"}
            >
              Submit OTP
            </button>
          </div>
        )}

        {showPwdField && (
          <>
            <div className="auth-password-field">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!isPhone}
              />
              {passwordError && <div className="auth-error-message">{passwordError}</div>}
            </div>
            <div className="auth-password-field">
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isPhone}
              />
              {confirmPasswordError && <div className="auth-error-message">{confirmPasswordError}</div>}
            </div>
          </>
        )}

        {otpSent && isPhone && otpTimer === 0 && (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isButtonDisabled}
            className={isButtonDisabled ? "disabled" : "enabled"}
          >
            Resend OTP
          </button>
        )}

        {otpSent && isPhone && otpTimer !== 0 && (
          <p>Resend OTP in {otpTimer} seconds.</p>
        )}

        <input
          type="text"
          placeholder="Referral Code (optional)"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />

        <div className="login-signup-condition">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            required
          />
          <p>By continuing, I agree to the terms of use & privacy policy</p>
        </div>

        {/* Only show main submit button when not in OTP mode */}
        {!otpSent && (
          <button
            type="submit"
            disabled={isButtonDisabled}
            className={isButtonDisabled ? "disabled" : "enabled"}
          >
            Create Account
          </button>
        )}

        <p>Already have an account? <Link to="/login">Login here</Link></p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={!isChecked}
          className={!isChecked ? "disabled" : "enabled"}
        >
          Continue With Google
        </button>
        <button
          type="button"
          onClick={handleFacebookSignIn}
          disabled={!isChecked}
          className={!isChecked ? "disabled" : "enabled"}
        >
          Continue With Facebook
        </button>
      </form>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Register;