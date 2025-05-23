import React from "react";
import PhoneInput from "react-phone-input-2"; // Ensure this library is installed
import "react-phone-input-2/lib/style.css"; // Import PhoneInput styles

const AddressForm = ({
  isAddingNew,
  editingIndex,
  newAddress,
  handleInputChange,
  handlePhoneInputChange,
  pinCode,
  setPinCode,
  error,
  locationInfo,
  handleSave,
  setIsAddingNew,
  setEditingIndex,
}) => {
  return (
    (isAddingNew || editingIndex !== null) && (
      <div className="edit-address">
        <h3>{editingIndex !== null ? "Edit Address" : "Add New Address"}</h3>

        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          placeholder="Name"
          id="name"
          value={newAddress.name}
         // onChange={handleInputChange}
         onChange={(e) => {
          const filteredValue = e.target.value.replace(/[0-9]/g, ""); // Remove numeric characters
          handleInputChange({ target: { name: "name", value: filteredValue } }); // Pass filtered value
        }}
         // autoFocus
        />

        <label htmlFor="contactNo">Contact Number</label>
        <PhoneInput
          country={"in"}
          value={newAddress.contactNo}
          onChange={handlePhoneInputChange}
          countryCodeEditable={false}
          disableDropdown={true}
          inputProps={{
            name: "contactNo",
            required: true,
            autoFocus: false,
          }}
        />

        <label htmlFor="flatDetails">Flat, House no., Building, Company, Apartment</label>
        <input
          type="text"
          name="flatDetails"
          placeholder="Flat, House no., Building, Company, Apartment"
          id="flatDetails"
          value={newAddress.flatDetails}
          onChange={handleInputChange}
        />

        <label htmlFor="areaDetails">Area, Street, Sector, Village</label>
        <input
          type="text"
          name="areaDetails"
          placeholder="Area, Street, Sector, Village"
          id="areaDetails"
          value={newAddress.areaDetails}
          onChange={handleInputChange}
        />

        <label htmlFor="landmark">Landmark</label>
        <input
          type="text"
          name="landmark"
          placeholder="Landmark"
          id="landmark"
          value={newAddress.landmark}
          onChange={handleInputChange}
        />

        <label>Enter 6-digit Postal PIN Code:</label>
        <input
          type="text"
          name="pinCode"
          placeholder="Pin Code"
          value={pinCode}
          onChange={(e) => {
            setPinCode(e.target.value);
            handleInputChange(e);
          }}
          maxLength={6}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {pinCode.length === 6 && !error && (
          <div>
            <label>District:</label>
            <input
              name="townCity"
              type="text"
              readOnly
              value={locationInfo.district}
              onChange={handleInputChange}
            />
            <label>State:</label>
            <input
              type="text"
              name="state"
              value={locationInfo.state}
              readOnly
              onChange={handleInputChange}
            />
          </div>
        )}

        <label htmlFor="country">Country</label>
        <input type="text" name="country" value="India" readOnly />

        <div className="address-action">
          <button onClick={handleSave}>Save</button>
          <button
            onClick={() => {
              setIsAddingNew(false);
              setEditingIndex(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  );
};

export default AddressForm;
