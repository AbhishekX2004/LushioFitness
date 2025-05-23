import React, {useRef,useContext,useEffect,useState} from "react";
import "./refer-earn.css";
import axios from 'axios';
import ShareComponent from "./ShareComp";
import { UserContext } from "../../components/context/UserContext";
import {toast} from 'react-toastify';
function ReferAndEarn() {
  const textRef = useRef(null);
  const { user } = useContext(UserContext);
const [referralCode,setReferralCode] = useState(null);
  useEffect(() => {
    if (user) {
     
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/details/${user.uid}`);
         
          setReferralCode(response.data.referralCode);
        
          
        
        } catch (error) {
          console.error("Error fetching user data:", error);
        } 
      };
      fetchUserData();
    }
  }, [user]);
  console.log(user);
  const copyText = () => {
    const textToCopy = textRef.current.innerText;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        toast.success("Text copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };
  return (
    <>
      <div className="refer-and-earn-container">
        <div className="refer-statements">
          <h3>Refer and Earn ₹100</h3>
          <p>When they place an order using the referral code,</p>
          <h4>they get credits worth ₹100</h4>
          <h6>1 Lushio® Credit = 1 Rupee</h6>
        </div>
        <img src="/Images/referEarn.jpg" alt="img" />
      </div>
      <div className="referralBlock">
        <p>Tap To Copy Code</p>
      {user &&  <div ref={textRef} onClick={copyText}>{referralCode}</div>}
        <ShareComponent referralCode={referralCode}/>
      </div>
      <p className="refer-question">How Does Referrel Work?</p>
      <div className="instruction-container">
        <div className="instruction-refer">
          <span>1</span>
          <p>Invite your friend to Lushio® with the given referral code</p>
        </div>
        <div className="instruction-refer">
          <span>2</span>
          <p>
            They place their first order with your referral code & get a flat
            ₹100 discount
          </p>
        </div>
        <div className="instruction-refer">
          <span>3</span>
          <p>
            Their order gets completed (delivered & crossed the return window)
          </p>
        </div>
        <div className="instruction-refer">
          <span>4</span>
          <p>You get Lushio® credits worth ₹100</p>
        </div>
      </div>
    
    </>
  );
}

export default ReferAndEarn;
