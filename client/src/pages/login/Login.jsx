import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import signInWithGoogle from "../../auth/googleAuth";
import { toast } from "react-toastify";
import signInWithFacebook from "../../auth/facebookAuth";
import { handleEmailLogin, sendEmailSignInLink } from "../../auth/emailAuth";
import { sendOtp, verifyOtpForLogin } from "../../auth/phoneAuth";
import { checkEmailExists, checkPhoneExists, validateEmail, validatePhone } from "../../auth/existenceCheck";
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
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [emailLinkTimer, setEmailLinkTimer] = useState(0);

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
  }, [identifier, phone]);

  // OTP Timer for phone
  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (otpTimer === 0 && otpSent) {
      setIsButtonDisabled(false);
    }
    return () => clearInterval(timer);
  }, [otpSent, otpTimer]);

  // Email link timer
  useEffect(() => {
    let timer;
    if (emailLinkSent && emailLinkTimer > 0) {
      timer = setInterval(() => {
        setEmailLinkTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (emailLinkTimer === 0 && emailLinkSent) {
      setIsButtonDisabled(false);
    }
    return () => clearInterval(timer);
  }, [emailLinkSent, emailLinkTimer]);

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
      toast.error("Google sign-in failed. Please try again.", { className: "custom-toast-error" });
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
      toast.error("Facebook sign-in failed. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true);

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
          // Check if phone number exists
          const phoneExists = await checkPhoneExists(formattedPhone);
          if (!phoneExists) {
            toast.error("No account found with this phone number. Please sign up first.", { className: "custom-toast-error" });
            setTimeout(() => navigate("/register"), 2000);
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
          console.error("Error with phone login :: ", error);
          toast.error("Failed to send OTP. Please try again.", { className: "custom-toast-error" });
          setIsButtonDisabled(false);
        }
      }
      // Note: When OTP is sent, form submit should be disabled
    } else {
      // Validate email
      if (!validateEmail(identifier)) {
        toast.error("Please enter a valid email address", { className: "custom-toast-error" });
        setIsButtonDisabled(false);
        return;
      }

      try {
        // Check if email exists
        const emailExists = await checkEmailExists(identifier);
        if (!emailExists) {
          toast.error("No account found with this email. Please sign up first.", { className: "custom-toast-error" });
          setTimeout(() => navigate("/register"), 2000);
          setIsButtonDisabled(false);
          return;
        }

        if (loginMethod === "otp") {
          await sendEmailSignInLink(identifier);
          setEmailLinkSent(true);
          setEmailLinkTimer(60);
          toast.success("Login link sent to your email!", { className: "custom-toast-success" });
          setIsButtonDisabled(false);
        } else {
          await handleEmailLogin(identifier, password);
          toast.success("Login successful!", { className: "custom-toast-success" });
          navigate("/user");
        }
      } catch (error) {
        console.error("Error logging in with email ::", error);
        if (error.message.includes("email")) {
          toast.error("Please verify your email first.", { className: "custom-toast-error" });
        } else {
          toast.error("Invalid email/password", { className: "custom-toast-error" });
        }
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
    } catch (error) {
      console.error("Error resending OTP", error);
      toast.error("Failed to resend OTP. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  const handleResendEmailLink = async () => {
    setIsButtonDisabled(true);
    try {
      await sendEmailSignInLink(identifier);
      setEmailLinkTimer(60);
      toast.success("Login link resent to your email!", { className: "custom-toast-success" });
    } catch (error) {
      console.error("Error resending email link", error);
      toast.error("Failed to resend login link. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  const handleOtpSubmit = async () => {
    setIsButtonDisabled(true);
    try {
      await verifyOtpForLogin(confirmationResult, otp);
      toast.success("Login successful!", { className: "custom-toast-success" });
      navigate("/user");
    } catch (error) {
      console.error("Error verifying OTP", error);
      toast.error("Invalid OTP. Please try again.", { className: "custom-toast-error" });
      setIsButtonDisabled(false);
    }
  };

  const handleEmailInput = (e) => {
    setIdentifier(e.target.value);
    if (validateEmail(e.target.value)) {
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
            disabled={emailLinkSent}
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
        
        {showRadioButtons && !isPhone && !emailLinkSent && (
          <div className="login-method">
            <label>
              <input
                type="radio"
                value="password"
                checked={loginMethod === "password"}
                onChange={() => setLoginMethod("password")}
              />
              Password
            </label>
            <label>
              <input
                type="radio"
                value="otp"
                checked={loginMethod === "otp"}
                onChange={() => setLoginMethod("otp")}
              />
              Email Link
            </label>
          </div>
        )}
        
        {loginMethod === "password" && showRadioButtons && !emailLinkSent && (
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
            <button 
              type="button" 
              onClick={handleOtpSubmit}  
              id="submit-otp"  
              disabled={otp.length !== 6 || isButtonDisabled}  
              className={otp.length !== 6 || isButtonDisabled ? "disabled" : "enabled"}
            >
              Submit OTP
            </button>
          </div>
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

        {emailLinkSent && !isPhone && loginMethod === "otp" && emailLinkTimer === 0 && (
          <button 
            type="button" 
            onClick={handleResendEmailLink}  
            disabled={isButtonDisabled} 
            className={isButtonDisabled ? "disabled" : "enabled"}
          >
            Resend Login Link
          </button>
        )}
        
        {emailLinkSent && !isPhone && loginMethod === "otp" && emailLinkTimer !== 0 && (
          <p>Resend login link in {emailLinkTimer} seconds.</p>
        )}
        
        {/* Main submit button - disabled when OTP sent for phone or email link sent */}
        <button 
          type="submit" 
          disabled={isButtonDisabled || (otpSent && isPhone) || (emailLinkSent && loginMethod === "otp")} 
          className={isButtonDisabled || (otpSent && isPhone) || (emailLinkSent && loginMethod === "otp") ? "disabled" : "enabled"}
        >
          {emailLinkSent && loginMethod === "otp" ? "Login Link Sent" : "Login"}
        </button>
        
        <p>Create a new account? <Link to="/register">Sign Up here</Link></p>
        
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          disabled={isButtonDisabled} 
          className={isButtonDisabled ? "disabled" : "enabled"}
        >
          Continue With Google
        </button>
        
        <button 
          type="button" 
          onClick={handleFacebookSignIn} 
          disabled={isButtonDisabled} 
          className={isButtonDisabled ? "disabled" : "enabled"}
        >
          Continue With Facebook
        </button>
      </form>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;