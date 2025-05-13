import React, { useState, useEffect } from 'react';
//import PhoneInput from "react-phone-input-2";
import './address.css';
import { useAddress } from '../../components/context/AddressContext';
import AddressForm from '../cartItems/AddressForm';
//import { UserContext } from "../../components/context/UserContext";
export default function Address() {
  const {
    addressData,
    isChangingDefault,
    isLoading,
    handleAddAddress,
    handleEditAddress,
   // fetchAddresses,
    handleRemoveAddress,
    handleSetDefault,
  } = useAddress();

  const [editingIndex, setEditingIndex] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    flatDetails: '',
    areaDetails: '',
    landmark: '',
    pinCode: '',
    contactNo: '',
    townCity: '',
    state: '',
    country: 'India',
    isDefault: false,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  //const { user } = useContext(UserContext);
 
  const handleEdit = (index) => {
    setEditingIndex(index);
    setIsAddingNew(false);
    setNewAddress(addressData[index]);
  };

  const handlePhoneInputChange = (value) => {
    setNewAddress((prevState) => ({
      ...prevState,
      contactNo: value,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prevAddress) => ({ ...prevAddress, [name]: value }));
  };

  const handleSave = () => {
    if (!newAddress.name || !newAddress.pinCode || !newAddress.contactNo || !newAddress.flatDetails || !newAddress.areaDetails) {
      alert("Please fill in all required fields!");
      return;
    }
// Extract numeric part (without country code)
const numericValue = newAddress.contactNo.replace(/\D/g, "");

// Check if the phone number has exactly 10 digits
if (numericValue.length !== 12) {
  alert("Phone number must be exactly 10 digits.");
  return;
}

    if (editingIndex !== null) {
      handleEditAddress(newAddress, editingIndex);
      setEditingIndex(null);
    } else {
      handleAddAddress(newAddress);
    }

    setNewAddress({
      name: '',
      flatDetails: '',
      areaDetails: '',
      landmark: '',
      pinCode: '',
      contactNo: '',
      townCity: '',
      state: '',
      country: 'India',
      isDefault: false,
    });
    setIsAddingNew(false);
  };

  const handleAddNewAddress = () => {
    setEditingIndex(null);
    setIsAddingNew(true);
    setNewAddress({
      name: '',
      flatDetails: '',
      areaDetails: '',
      landmark: '',
      pinCode: '',
      contactNo: '',
      townCity: '',
      state: '',
      country: 'India',
      isDefault: false,
    });
  };

  const [pinCode, setPinCode] = useState("");
  const [locationInfo, setLocationInfo] = useState({ district: "", state: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (pinCode.length === 6) {
      fetchDistrictAndState(pinCode);
    } else {
      setLocationInfo({ district: "", state: "" });
      setError("");
    }
  }, [pinCode]);

  const fetchDistrictAndState = async (code) => {
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${code}`);
     
      const data = await response.json();
      console.log(data);
      if (data && data[0] && data[0].Status === "Success") {
        setLocationInfo({
          district: data[0].PostOffice[0].District,
          state: data[0].PostOffice[0].State,
        });
        setNewAddress((prevAddress) => ({
          ...prevAddress,
          townCity: data[0].PostOffice[0].District,
          state: data[0].PostOffice[0].State,
        }));
        setError("");
      } else {
        setLocationInfo({ district: "", state: "" });
        setError("Invalid PIN code. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching district and state:", error.message);
      setError("Error fetching data. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="loader-container"><span className="loader"></span></div>;
  }

  return (
    <div className="address-wrapper">
      {isChangingDefault && <div className="spinner-overlay"><div></div></div>}
      <div className="address-title">
        <h2>My Addresses</h2>
        <hr />
      </div>
      <AddressForm
        isAddingNew={isAddingNew}
        editingIndex={editingIndex}
        newAddress={newAddress}
        handleInputChange={handleInputChange}
        handlePhoneInputChange={handlePhoneInputChange}
        pinCode={pinCode}
        setPinCode={setPinCode}
        error={error}
        locationInfo={locationInfo}
        handleSave={handleSave}
        setIsAddingNew={setIsAddingNew}
        setEditingIndex={setEditingIndex}
      />
  

      <div className="address-container">
      {!(isAddingNew || editingIndex !== null) && (
                <div className="Add-new-address" onClick={handleAddNewAddress}>
                  <span>+</span>
                  <p>Add new addresses</p>
                </div>
             )}
        {!(isAddingNew || editingIndex !== null) && (
          <>
            {addressData.map((info, i) => (
              <div className="myaddress" key={info.id}>
                <h4>{info.name}</h4>
                <span>{info.flatDetails}, {info.areaDetails}, {info.townCity}, {info.state}</span>
             {info.landmark &&  <p><strong>Landmark: </strong> {info.landmark}</p>}  
                <p>Pin Code: {info.pinCode}</p>
                <p>Contact Number: {info.contactNo.startsWith('91') ? info.contactNo.substring(2) : info.contactNo}</p>
                {info.isDefault && <h3 className="default-address">Default Address</h3>}
                <div className="address-action">
                  <button onClick={() => handleEdit(i)}>Edit</button>
                  <button onClick={() => handleRemoveAddress(info.id)}>Remove</button>
                  {!info.isDefault && <button onClick={() => handleSetDefault(info.id)}>Set as Default</button>}
                </div>

                
              </div>
            ))}
           
          </>
        )}
      </div>
    </div>
  );
}
