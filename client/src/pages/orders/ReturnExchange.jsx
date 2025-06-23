import React, { useState } from "react";
import "./Accordion.css";
import "./ReturnExchange.css";
import { toast } from "react-toastify";

const ReturnExchange = ({
  title,
  canReturn,
  identifier,
  orderId,
  product,
  updateItems,
  setPayloadForMail,
}) => {
  const [state, setState] = useState({
    isOpen: false,
    selectedOption: "exchange",
    selectedReason: "Wrong size selected", // Combined reason state
    selectedSize: "",
    selectedQuantity: 1,
    otherReason: "",
  });

  const toggleAccordion = () => {
      if (!canReturn) {
      toast.error("This product is not eligible for Return/exchange.", {
        className: "custom-toast-error",
      });
      return;
    }
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const handleOptionChange = (option) => {
    setState((prev) => ({
      ...prev,
      selectedOption: option,
      selectedReason: option === "exchange" ? "Wrong size selected" : "size issue",
      selectedSize: "",
      otherReason: "",
    }));
  };

  const handleReasonChange = (reason) => {
    setState((prev) => ({
      ...prev,
      selectedReason: reason,
      otherReason: reason === "other" || reason === "Other" ? prev.otherReason : "",
    }));
  };

  const handleOtherReasonChange = (value) => {
    setState((prev) => ({ ...prev, otherReason: value }));
  };

  const handleQuantityChange = (e) => {
    setState((prev) => ({ ...prev, selectedQuantity: Number(e.target.value) }));
  };

  const handleAddItem = () => {
    if (!canReturn) {
      toast.error("This product is not eligible for Return/exchange.", {
        className: "custom-toast-error",
      });
      return;
    }

    if (
      !state.selectedReason ||
      ((state.selectedReason === "other" || state.selectedReason === "Other") && !state.otherReason.trim())
    ) {
      toast.error(`Please provide a reason for ${title}.`, {
        className: "custom-toast-error",
      });
      return;
    }

    const finalReason =
      state.selectedReason === "other" || state.selectedReason === "Other"
        ? state.otherReason
        : state.selectedReason;

    const itemData = {
      [identifier]: {
        exchange: state.selectedOption === "exchange",
        units: state.selectedQuantity,
        reason: finalReason,
       // exchangeReason: state.selectedOption === "exchange" ? finalReason : "",
      },
    };

    // Update the new payloadForMail state
    const payloadItem = {
      identifier: identifier,
      exchange: state.selectedOption === "exchange",
      productName: product.productName,
      quantity: state.selectedQuantity,
      color: product.color,
      size: product.size,
      reason: finalReason,
    };

    setPayloadForMail((prev) => [...prev, payloadItem]);
    updateItems(itemData);
    toast.success(`Added ${title} to return/exchange list!`);
  };

  return (
    <div className="return-exchange-container">
      <div className="accordion">
        <div className="accordion-header" onClick={toggleAccordion}>
          <h3>{title}</h3>
          <span className={`accordion-icon ${state.isOpen ? "open" : ""}`}>
            {state.isOpen ? "-" : "+"}
          </span>
        </div>

        {state.isOpen && (
          <div
            className={`accordion-content ${state.isOpen ? "expanded" : ""}`}
            style={{ maxHeight: state.isOpen ? "1000px" : "0" }}
          >
            <div className="return-exchange-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name={`returnExchange-${identifier}`}
                  value="exchange"
                  checked={state.selectedOption === "exchange"}
                  onChange={() => handleOptionChange("exchange")}
                />
                Exchange
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name={`returnExchange-${identifier}`}
                  value="return"
                  checked={state.selectedOption === "return"}
                  onChange={() => handleOptionChange("return")}
                />
                Return
              </label>
            </div>

            <h3>Select Quantity:</h3>

            <select
              value={state.selectedQuantity}
              onChange={handleQuantityChange}
              className="quantity-select"
            >
              {Array.from({ length: product.quantity }, (_, i) => i + 1).map(
                (num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                )
              )}
            </select>

            {state.selectedOption === "return" && (
              <div className="return-section">
                <h3>Select Reason for Return:</h3>
                <div className="return-reasons">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`returnReason-${identifier}`}
                      value="size issue"
                      checked={state.selectedReason === "size issue"}
                      onChange={() => handleReasonChange("size issue")}
                    />
                    Size Issue
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`returnReason-${identifier}`}
                      value="damaged"
                      checked={state.selectedReason === "damaged"}
                      onChange={() => handleReasonChange("damaged")}
                    />
                    Damaged
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`returnReason-${identifier}`}
                      value="other"
                      checked={state.selectedReason === "other"}
                      onChange={() => handleReasonChange("other")}
                    />
                    Other
                  </label>
                </div>
                {state.selectedReason === "other" && (
                  <textarea
                    placeholder="Specify reason"
                    value={state.otherReason}
                    onChange={(e) => handleOtherReasonChange(e.target.value)}
                  />
                )}
              </div>
            )}

            {state.selectedOption === "exchange" && (
              <div className="exchange-section">
                <h3>Select Reason for Exchange:</h3>
                <div className="exchange-reasons">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`exchangeReason-${identifier}`}
                      value="Wrong product received"
                      checked={state.selectedReason === "Wrong product received"}
                      onChange={() => handleReasonChange("Wrong product received")}
                    />
                    Wrong product received
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`exchangeReason-${identifier}`}
                      value="Product defective"
                      checked={state.selectedReason === "Product defective"}
                      onChange={() => handleReasonChange("Product defective")}
                    />
                    Product defective
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`exchangeReason-${identifier}`}
                      value="Other"
                      checked={state.selectedReason === "Other"}
                      onChange={() => handleReasonChange("Other")}
                    />
                    Other
                  </label>
                </div>

                {state.selectedReason === "Other" && (
                  <textarea
                    placeholder="Specify exchange reason"
                    value={state.otherReason}
                    onChange={(e) => handleOtherReasonChange(e.target.value)}
                  />
                )}
              </div>
            )}

            <button
              className="submit-button add-request-button"
              onClick={handleAddItem}
            >
              Add to Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnExchange;