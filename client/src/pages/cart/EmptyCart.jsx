import React from "react";

import { useNavigate } from "react-router-dom";
function EmptyCart() {
  const navigate = useNavigate();

  return (
    <div className="empty-cart">
      <img src="/Images/emptyCart.png" alt="" />
      <p>Nothing in the bag</p>
      <button onClick={() => navigate("/")}>Shop Now</button>
    </div>
  );
}

export default EmptyCart;
