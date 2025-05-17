import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import './AdminControls.css';

const AdminControls = () => {
  // const [engine, setEngine] = useState(false);
  const [dobCoins, setDobCoins] = useState(0);
  const [dobMessage, setDobMessage] = useState('');
  const [dobExpiry, setDobExpiry] = useState(30);
  const [doaCoins, setDoaCoins] = useState(0);
  const [doaMessage, setDoaMessage] = useState('');
  const [doaExpiry, setDoaExpiry] = useState(30);
  const [reviewApprovedCoins, setReviewApprovedCoins] = useState(0);
  const [reviewApprovedMessage, setReviewApprovedMessage] = useState('');
  const [reviewApprovedExpiry, setreviewApprovedExpiry] = useState(30);
  const [ageCoins, setAgeCoins] = useState({
    oneMonth: { coins: 0, message: '', expiry: 30 },
    oneYear: { coins: 0, message: '', expiry: 30 },
    twoYears: { coins: 0, message: '', expiry: 30 },
    fiveYears: { coins: 0, message: '', expiry: 30 },
  });

  // Define the milestone order to ensure consistent display
  const milestoneOrder = ['oneMonth', 'oneYear', 'twoYears', 'fiveYears'];

  // Pretty names for milestones
  const milestonePrettyNames = {
    oneMonth: 'One Month',
    oneYear: 'One Year',
    twoYears: 'Two Years',
    fiveYears: 'Five Years'
  };

  const [referredCoins, setReferredCoins] = useState(0);
  const [referredMessage, setReferredMessage] = useState('');
  const [referredExpiry, setReferredExpiry] = useState(30);
  const [referrerCoins, setReferrerCoins] = useState(0);
  const [referrerMessage, setReferrerMessage] = useState('');
  const [referrerExpiry, setReferrerExpiry] = useState(30);

  const docRef = doc(db, "controls", "admin");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // setEngine(data.engine);
          setDobCoins(data.dobCoins);
          setDobMessage(data.dobMessage);
          setDobExpiry(data.dobExpiry);
          setDoaCoins(data.doaCoins);
          setDoaMessage(data.doaMessage);
          setDoaExpiry(data.doaExpiry);
          setAgeCoins(data.coinSettings || ageCoins);
          setReviewApprovedCoins(data.reviewApprovedCoins);
          setReviewApprovedMessage(data.reviewApprovedMessage);
          setreviewApprovedExpiry(data.reviewApprovedExpiry || reviewApprovedExpiry)
          setReferredCoins(data.referredCoins);
          setReferredMessage(data.referredMessage);
          setReferredExpiry(data.referredExpiry);
          setReferrerCoins(data.referrerCoins);
          setReferrerMessage(data.referrerMessage);
          setReferrerExpiry(data.referrerExpiry);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // const handleEngineChange = async (checked) => {
  //   setEngine(checked);
  //   try {
  //     await updateDoc(docRef, {
  //       engine: checked
  //     });
  //     // Optional: Show a quick feedback to user
  //     console.log("Engine status updated successfully");
  //   } catch (error) {
  //     console.error("Error updating engine status:", error);
  //     // Revert UI state if update fails
  //     setEngine(!checked);
  //     alert("Failed to update engine status. Please try again.");
  //   }
  // };

  const handleCoinSettingChange = (milestone, field, value) => {
    setAgeCoins(prevSettings => ({
      ...prevSettings,
      [milestone]: {
        ...prevSettings[milestone],
        [field]: field === 'coins' || field === 'expiry' ? Number(value) : value
      }
    }));
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(docRef, {
        // engine,
        dobCoins: Number(dobCoins),
        dobMessage,
        dobExpiry: Number(dobExpiry),
        doaCoins: Number(doaCoins),
        doaMessage,
        doaExpiry: Number(doaExpiry),
        coinSettings: ageCoins,
        reviewApprovedCoins: Number(reviewApprovedCoins),
        reviewApprovedMessage,
        reviewApprovedExpiry: Number(reviewApprovedExpiry),
        referredCoins: Number(referredCoins),
        referredMessage,
        referredExpiry: Number(referredExpiry),
        referrerCoins: Number(referrerCoins),
        referrerMessage,
        referrerExpiry: Number(referrerExpiry),
      });
      alert("Data successfully updated!");
    } catch (error) {
      console.error("Error updating document:", error);
      alert("Failed to update data.");
    }
  };

  return (
    <div className="admin-controls">
      <h2 className="admin-controls-title">Admin Controls</h2>
      
      {/* <div className="admin-controls-card">
        <div className="admin-controls-card-header">
          <h3 className="admin-controls-card-header-title">System Settings</h3>
        </div>
        <div className="admin-controls-item admin-controls-checkbox-container">
          <input
            type="checkbox"
            className="admin-controls-input-checkbox"
            checked={engine}
            onChange={(e) => handleEngineChange(e.target.checked)}
          />
          <label className="admin-controls-label">Keep Website Alive</label>
        </div>
      </div> */}
      
      <div className="admin-controls-grid">
        <div className="admin-controls-card">
          <div className="admin-controls-card-header">
            <h3 className="admin-controls-card-header-title">Date of Birth Rewards</h3>
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Coins for DOB</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={dobCoins}
              onChange={(e) => setDobCoins(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Message for DOB</label>
            <input
              type="text"
              className="admin-controls-input-text"
              value={dobMessage}
              onChange={(e) => setDobMessage(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Expiry for DOB (days)</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={dobExpiry}
              onChange={(e) => setDobExpiry(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-controls-card">
          <div className="admin-controls-card-header">
            <h3 className="admin-controls-card-header-title">Date of Anniversary Rewards</h3>
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Coins for DOA</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={doaCoins}
              onChange={(e) => setDoaCoins(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Message for DOA</label>
            <input
              type="text"
              className="admin-controls-input-text"
              value={doaMessage}
              onChange={(e) => setDoaMessage(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Expiry for DOA (days)</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={doaExpiry}
              onChange={(e) => setDoaExpiry(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-controls-grid">
        <div className="admin-controls-card">
          <div className="admin-controls-card-header">
            <h3 className="admin-controls-card-header-title">Referred User Rewards</h3>
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Coins for Referred User</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={referredCoins}
              onChange={(e) => setReferredCoins(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Message for Referred User</label>
            <input
              type="text"
              className="admin-controls-input-text"
              value={referredMessage}
              onChange={(e) => setReferredMessage(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Expiry for Referred Coins (days)</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={referredExpiry}
              onChange={(e) => setReferredExpiry(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-controls-card">
          <div className="admin-controls-card-header">
            <h3 className="admin-controls-card-header-title">Referrer Rewards</h3>
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Coins for Referrer</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={referrerCoins}
              onChange={(e) => setReferrerCoins(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Message to Referrer</label>
            <input
              type="text"
              className="admin-controls-input-text"
              value={referrerMessage}
              onChange={(e) => setReferrerMessage(e.target.value)}
            />
          </div>
          <div className="admin-controls-item">
            <label className="admin-controls-label">Expiry for Referrer Coins (days)</label>
            <input
              type="number"
              className="admin-controls-input-number"
              value={referrerExpiry}
              onChange={(e) => setReferrerExpiry(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-controls-card">
        <div className="admin-controls-card-header">
          <h3 className="admin-controls-card-header-title">Review Approval Rewards</h3>
        </div>
        <div className="admin-controls-item">
          <label className="admin-controls-label">Coins for Review Approval</label>
          <input
            type="number"
            className="admin-controls-input-number"
            value={reviewApprovedCoins}
            onChange={(e) => setReviewApprovedCoins(e.target.value)}
          />
        </div>
        <div className="admin-controls-item">
          <label className="admin-controls-label">Message for Review Approval</label>
          <input
            type="text"
            className="admin-controls-input-text"
            value={reviewApprovedMessage}
            onChange={(e) => setReviewApprovedMessage(e.target.value)}
          />
        </div>
        <div className="admin-controls-item">
          <label className="admin-controls-label">Expiry for Review Coins (days)</label>
          <input
            type="number"
            className="admin-controls-input-number"
            value={reviewApprovedExpiry}
            onChange={(e) => setreviewApprovedExpiry(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-controls-card">
        <div className="admin-controls-card-header">
          <h3 className="admin-controls-card-header-title">Age Milestone Rewards</h3>
        </div>
        {milestoneOrder.map(milestone => (
          <div key={milestone} className="admin-controls-milestone">
            <h3 className="admin-controls-milestone-title">
              {milestonePrettyNames[milestone]}
            </h3>
            <div className="admin-controls-item">
              <label className="admin-controls-label">Coins</label>
              <input
                type="number"
                className="admin-controls-input-number"
                value={ageCoins[milestone].coins}
                onChange={(e) => handleCoinSettingChange(milestone, 'coins', e.target.value)}
              />
            </div>
            <div className="admin-controls-item">
              <label className="admin-controls-label">Message</label>
              <input
                type="text"
                className="admin-controls-input-text"
                value={ageCoins[milestone].message}
                onChange={(e) => handleCoinSettingChange(milestone, 'message', e.target.value)}
              />
            </div>
            <div className="admin-controls-item">
              <label className="admin-controls-label">Expiry (days)</label>
              <input
                type="number"
                className="admin-controls-input-number"
                value={ageCoins[milestone].expiry}
                onChange={(e) => handleCoinSettingChange(milestone, 'expiry', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="admin-controls-update-btn" onClick={handleUpdate}>
        Update Settings
      </button>
    </div>
  );
};

export default AdminControls;