import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { UserContext } from "../../components/context/UserContext.jsx";
import PhoneInput from "react-phone-input-2";
import { isValidPhoneNumber } from "libphonenumber-js";
import "react-phone-input-2/lib/style.css";
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import "./EditProfile.css";

import GoogleLinking from "./Linking/GoogleLinking.jsx";
import PhoneLinking from "./Linking/PhoneLinking.jsx";
import FacebookLinking from "./Linking/FacebookLinking.jsx";

function EditProfile() {
  const { user } = useContext(UserContext);
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    doa: "",
    gender: "",
  });

  const [initialData, setInitialData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const phoneInputRef = useRef(null);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const parsedDate = moment(dateString, ["YYYY-MM-DD", "DD-MM-YYYY"], true);
    return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : "";
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const fetchUserData = async () => {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/user/details/${user.uid}`
          );
          const data = response.data;
          console.log("Fetched user data:", data);
          const formattedData = {
            ...data,
            dob: formatDateForInput(data.dob),
            doa: formatDateForInput(data.doa),
            phoneNumber: data.phoneNumber.startsWith("+")
              ? data.phoneNumber
              : `+${data.phoneNumber}`,
          };

          setUserData(formattedData);
          setInitialData(formattedData);
          console.log("Initial data set:", formattedData);
          
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserData();
    }
  }, [user]);

  const getChangedFields = () => {
    const changedFields = {};
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== initialData[key]) {
        changedFields[key] = userData[key];
      }
    });
    return changedFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const changedFields = getChangedFields();

    // Phone number validation
    if (userData.phoneNumber && !isValidPhoneNumber(userData.phoneNumber)) {
      toast.error("Please enter a valid phone number.", { className: "custom-toast-error" })
      return;
    }

    if (Object.keys(changedFields).length === 0) {
      toast.error("No changes Detected!", { className: "custom-toast-error" })
      return;
    }

    setIsLoading(true);
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/user/details/${user.uid}`,
        changedFields
      );

      setInitialData(userData);
      toast.success("Profile Updated successfully!");
    } catch (error) {
      alert(
        `Error updating profile\n${
          error.response?.data?.message || error.response?.data || error.message
        }`
      );
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="edit-profile-container">      
      {isLoading && (
        <div className="edit-profile-spinner-overlay">
          <div className="edit-profile-spinner"></div>
        </div>
      )}
      <h2 className="edit-profile-title">Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="edit-profile-field">
          <label className="edit-profile-label">Name</label>
          <input
            type="text"
            name="displayName"
            placeholder="Enter your Name"
            value={userData.displayName}
            onChange={handleChange}
            className="edit-profile-input"
            required
          />
        </div>

        <div className="edit-profile-field">
          <label className="edit-profile-label">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={userData.email}
            onChange={handleChange}
            className="edit-profile-input"
            required
          />
        </div>

        <div className="edit-profile-field">
          <label className="edit-profile-label">Phone no.</label>
          <div className="edit-profile-phone-container">
            <PhoneInput
              country={"in"}
              value={userData.phoneNumber}
              onChange={(phone) =>
                setUserData((prevData) => ({
                  ...prevData,
                  phoneNumber: phone.startsWith("+") ? phone : `+${phone}`,
                }))
              }
              inputProps={{
                name: "phoneNumber",
                required: true,
                ref: phoneInputRef,
              }}
              enableSearch
            />
          </div>
        </div>

        <div className="edit-profile-field">
          <label className="edit-profile-label">
            Birthday Date 
            <span className="edit-profile-note">(modifiable up to two times only)</span>
          </label>
          <input
            type="date"
            name="dob"
            value={userData.dob || ""}
            onChange={handleChange}
            className="edit-profile-input edit-profile-date-input"
          />
        </div>

        <div className="edit-profile-field">
          <label className="edit-profile-label">
            Anniversary Date 
            <span className="edit-profile-note">(modifiable up to two times only)</span>
          </label>
          <input
            type="date"
            name="doa"
            value={userData.doa || ""}
            onChange={handleChange}
            className="edit-profile-input edit-profile-date-input"
          />
        </div>

        <div className="edit-profile-radio-field">
          <label className="edit-profile-label">Gender</label>
          <div className="edit-profile-radio-group">
            {["Male", "Female", "Other"].map((gender) => (
              <label key={gender} className="edit-profile-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={userData.gender === gender}
                  onChange={handleChange}
                  className="edit-profile-radio-input"
                  required
                />
                <span className="edit-profile-radio-text">{gender}</span>
              </label>
            ))}
          </div>
        </div>
        
        <GoogleLinking 
          user={user}
          userData={userData}
          setUserData={setUserData}
          initialData={initialData}
          setInitialData={setInitialData}
        />
        
        <FacebookLinking 
          user={user}
          userData={userData}
          setUserData={setUserData}
          initialData={initialData}
          setInitialData={setInitialData}
        />
        
        <PhoneLinking />

        <button 
          type="submit" 
          className="edit-profile-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  );
}

export default EditProfile;