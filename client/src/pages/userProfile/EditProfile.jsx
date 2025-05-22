import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import moment from "moment";
import { UserContext } from "../../components/context/UserContext.jsx";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

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
  const [initialData, setInitialData] = useState({}); // Store initial data for comparison
  const [isLoading, setIsLoading] = useState(false);
  
  // Format date to YYYY-MM-DD for HTML date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const parsedDate = moment(dateString, ["YYYY-MM-DD", "DD-MM-YYYY"], true);
    return parsedDate.isValid() ? parsedDate.format("YYYY-MM-DD") : '';
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/details/${user.uid}`);
          const data = response.data;
          
          // Format dates for input fields
          const formattedData = {
            ...data,
            dob: formatDateForInput(data.dob),
            doa: formatDateForInput(data.doa)
          };
          
          setUserData(formattedData);
          setInitialData(formattedData); // Store initial data
          console.log("Fetched user data:", response.data);
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
    Object.keys(userData).forEach(key => {
      // Compare with initial data and only include if changed
      if (userData[key] !== initialData[key]) {
        changedFields[key] = userData[key];
      }
    });
    return changedFields;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const changedFields = getChangedFields();
  
    // Only proceed if there are actually changes
    if (Object.keys(changedFields).length === 0) {
      alert("No changes detected!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/user/details/${user.uid}`,
        changedFields
      );
      
      // Update initialData to reflect the new state
      setInitialData(userData);
      alert("Profile updated successfully!");
    } catch (error) {
      alert(`Error updating profile\n${error.response?.data?.message || error.response?.data || error.message}`);
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to ${value}`);
    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="edit-profile-container">
      {isLoading && <div className="spinner-overlay"><div></div></div>}
      <p className="user-question">Edit Your Profile</p>
      <form onSubmit={handleSubmit} className="edit-profile">
        <label>Name</label>
        <input
          type="text"
          name="displayName"
          placeholder="Enter your Name"
          value={userData.displayName}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={userData.email}
          onChange={handleChange}
          required
        />

        <label>Phone no.</label>
      
        <input
          type="tel"
          name="phoneNumber"
          placeholder="Enter your phone no."
          value={userData.phoneNumber}
          onChange={handleChange}
          required
           pattern="\d{10}"
  maxlength="10"
        />
{/* <label>Phone no.</label>
<PhoneInput
  country={'in'}                      // Default country is India
  value={userData.phoneNumber}       // Bound to your state
  onChange={(phone) =>
    setUserData((prevData) => ({
      ...prevData,
      phoneNumber: phone,
    }))
  }
  inputProps={{
    name: 'phoneNumber',
    required: true,
  }}
  enableSearch={true}               
  disableCountryGuess={true}         
  disableSearchIcon={false}       
/> */}

        <label>Birthday Date (modifiable up to two times only)</label>
        <input
          type="date"
          name="dob"
          value={userData.dob || ''}
          onChange={handleChange}
        />

        <label>Anniversary Date (modifiable up to two times only)</label>
        <input
          type="date"
          name="doa"
          value={userData.doa || ''}
          onChange={handleChange}
        />

        <div className="radio-input">
          <label>Gender</label>
          <div>
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={userData.gender === "Male"}
                onChange={handleChange}
                required
              /> Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={userData.gender === "Female"}
                onChange={handleChange}
                required
              /> Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Other"
                checked={userData.gender === "Other"}
                onChange={handleChange}
                required
              /> Other
            </label>
          </div>
        </div>

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default EditProfile;
