import React, { useState } from "react";
import AddCoupons from "./AddCoupons";
import EditCoupons from "./EditCoupons";
import "./Coupons.css";

function Coupons() {
    const [activeComponent, setActiveComponent] = useState(null);

    return (
        <div>
            <h1>Add or Edit Coupons</h1>
            <div className="admin-coupon-buttons">
                <button onClick={() => setActiveComponent("add")}>Add Coupon</button>
                <button onClick={() => setActiveComponent("edit")}>Edit Coupon</button>
            </div>
            <div>
                {activeComponent === "add" && <AddCoupons />}
                {activeComponent === "edit" && <EditCoupons />}
            </div>
        </div>
    );
}

export default Coupons;
