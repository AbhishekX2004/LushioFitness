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
    selectedReason: "size issue",
    selectedSize: "",
    selectedQuantity: 1,
    otherReason: "",
    exchangeReason: "Wrong size selected",
  });

  const toggleAccordion = () => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const handleOptionChange = (option) => {
    setState((prev) => ({
      ...prev,
      selectedOption: option,
      selectedReason: option === "exchange" ? "Wrong size selected" : "",
      selectedSize: "",
      otherReason: "",
      exchangeReason: option === "exchange" ? "Wrong size selected" : "",
    }));
  };

  const handleReasonChange = (reason) => {
    setState((prev) => ({
      ...prev,
      selectedReason: reason,
      otherReason: reason === "other" ? prev.otherReason : "",
    }));
  };

  const handleOtherReasonChange = (value) => {
    setState((prev) => ({ ...prev, otherReason: value }));
  };

  const handleExchangeReasonChange = (reason) => {
    setState((prev) => ({
      ...prev,
      exchangeReason: reason,
      otherReason: reason === "Other" ? "" : prev.otherReason,
    }));
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
      (state.selectedReason === "other" && !state.otherReason.trim())
    ) {
      toast.error(`Please provide a reason for ${title}.`, {
        className: "custom-toast-error",
      });
      return;
    }

    const itemData = {
      [identifier]: {
        exchange: state.selectedOption === "exchange",
        units: state.selectedQuantity,
        reason:
          state.selectedReason === "other"
            ? state.otherReason
            : state.selectedReason,
        exchangeReason:
          state.selectedOption === "exchange"
            ? state.exchangeReason === "Other"
              ? state.otherReason
              : state.exchangeReason
            : "",
      },
    };
    const finalReason =
      state.selectedOption === "exchange"
        ? state.exchangeReason === "Other"
          ? state.otherReason
          : state.exchangeReason
        : state.selectedReason === "other"
        ? state.otherReason
        : state.selectedReason;

    // 👇 Update the new payloadForMail state
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
                      checked={
                        state.exchangeReason === "Wrong product received"
                      }
                      onChange={() =>
                        handleExchangeReasonChange("Wrong product received")
                      }
                    />
                    Wrong product received
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`exchangeReason-${identifier}`}
                      value="Product defective"
                      checked={state.exchangeReason === "Product defective"}
                      onChange={() =>
                        handleExchangeReasonChange("Product defective")
                      }
                    />
                    Product defective
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name={`exchangeReason-${identifier}`}
                      value="Other"
                      checked={state.exchangeReason === "Other"}
                      onChange={() => handleExchangeReasonChange("Other")}
                    />
                    Other
                  </label>
                </div>

                {state.exchangeReason === "Other" && (
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
