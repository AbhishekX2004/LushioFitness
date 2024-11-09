import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../components/context/UserContext";
import "./wallet.css";

export default function Wallet() {
  const navigate = useNavigate();
  const {user} = useContext(UserContext);

 const [userCoins, setUserCoins]= useState(null);


 
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
     
         const response = await axios.get(`${process.env.REACT_APP_API_URL}/wallet/${user.uid}`);
      const data = response.data;
      setUserCoins(
        data
      );
         
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };
      fetchUserData();
    }
  }, [user]);
  return (
<>
   {
    userCoins?.totalCredits===0 ? 
    <div className="empty-wallet">
        <p>Oh no! Looks like your wallet is empty :(</p>
        <h5>Start earning credits now!</h5>
      <img src="/Images/wallet.gif" alt=""/>
      <p>Invite your friends to shop on Lushio and
      </p>
      <h4>win credits worth Rs. 100 on every referral</h4>
      <button onClick={()=>navigate("/user-referAndEarn")}>Send Invite</button>
    </div>: <div className="wallet-container">
    <div className="wallet-title">
      <h2>My Wallet</h2> 
      <hr/>
      </div>
      <div className="my-wallet">
        <div className="totalblock">
        
          <p>Total wallet points</p>
          <p>{userCoins?.totalCredits}</p>
        </div>
        <div className="credit-block">
      <div className="heading-row">
        <div className="heading-block">
          <img
            className="heading-icon"
            src="https://images.bewakoof.com/web/credits-1604474036.png"
            alt="Credit Icon"
          />
          <div className="heading-text">Lushio Credit</div>
        </div>
        <div className="balance-block">
          <div className="balance-text">Balance : {userCoins?.lushioCoins}</div>
          <i className="balance-icon icon-next-arrow"></i>
        </div>
      </div>
      <p className="description-block">
        Earned from referral, offers and cash-back. Limited validity. Can be redeemed on orders above ₹297
      </p>
    </div>
    <div className="cash-block">
      <div className="heading-row">
        <div className="heading-block">
          <img
            className="heading-icon"
            src="https://images.bewakoof.com/web/cash-1604473988.png"
            alt="Cash Icon"
          />
          <div className="heading-text">Lushio Cash</div>
        </div>
        <div className="balance-block">
      <div className="balance-text">Balance : {userCoins?.lushioCash}</div>
          <i className="balance-icon icon-next-arrow"></i>
        </div>
      </div>
      <p className="description-block">
        Received from refund for orders that you have returned, cancelled and gift card.
      </p>
    </div>
      </div>

    </div>
   }
   
    </>
    )
}


