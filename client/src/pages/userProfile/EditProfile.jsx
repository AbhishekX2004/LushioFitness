import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import moment from "moment";
import { UserContext } from "../../components/context/UserContext.jsx";
import PhoneInput from "react-phone-input-2";
import { isValidPhoneNumber } from "libphonenumber-js";
import "react-phone-input-2/lib/style.css";
import {toast} from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
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
            phoneNumber: data?.phoneNumber?.startsWith("+")
              ? data?.phoneNumber
              : `+${data?.phoneNumber}`,
          };

          setUserData(formattedData);
          setInitialData(formattedData);
          console.log("Initial data set:", formattedData);
          console.log("User data after setting:", userData);
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
       toast.error("Please enter a valid phone number.",{className:"custom-toast-error"})
      return;
    }

    if (Object.keys(changedFields).length === 0) {
     toast.error("No changes Detected!",{className:"custom-toast-error"})
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
        <div className="spinner-overlay">
          <div></div>
        </div>
      )}
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

        <label>Birthday Date (modifiable up to two times only)</label>
        <input
          type="date"
          name="dob"
          value={userData.dob || ""}
          onChange={handleChange}
        />

        <label>Anniversary Date (modifiable up to two times only)</label>
        <input
          type="date"
          name="doa"
          value={userData.doa || ""}
          onChange={handleChange}
        />

        <div className="radio-input">
          <label>Gender</label>
          <div>
            {["Male", "Female", "Other"].map((gender) => (
              <label key={gender}>
                <input
                  type="radio"
                  name="gender"
                  value={gender}
                  checked={userData.gender === gender}
                  onChange={handleChange}
                  required
                />{" "}
                {gender}
              </label>
            ))}
          </div>
        </div>

        <button type="submit">Save</button>
      </form>
    </div>
  );
}

export default EditProfile;
