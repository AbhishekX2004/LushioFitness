import React from 'react';
//import { assets } from '../assets/assets';
import './Contact.css';

const Contact = () => {
  return (
    <div className="contact-container">

      <div className="contact-heading">
        <p>CONTACT <span className="highlight-text">US</span></p>
      </div>

      <div className="contact-content">
        <img className="contact-image"  src="/Images/contact_us.jpg" alt="" />

        <div className="contact-details">
          <p className="section-title">OUR OFFICE</p>
          <p className="section-info">
           325 Sector-B, Scheme No. 136, Behind Brilliant Aura, <br /> Indore (M.P.) 452010
          </p>
          <p className="section-info">
            Mob : +91 8319713763 <br /> Email: officialushio@gmail.com
          </p>
          <p className="section-title">CUSTOMER SUPPORT</p>
          <p className="section-info">
            Have any questions, feedback, or concerns? We're here to help! Our support team is available Monday to Saturday from 9:00 AM to 6:00 PM.
            Feel free to reach out and we'll get back to you as soon as possible.
          </p>

          <p className="section-title">FOLLOW US</p>
          <p className="section-info">
            Stay connected with us through our social channels for updates, promotions, and health tips.
          </p>
          {/* <p className="section-title">Careers at Lushio</p>
          <p className="section-info">Learn more about our teams and job openings.</p>
          <button className="explore-btn">Explore Jobs</button> */}
        </div>
      </div>

    </div>
  );
};

export default Contact;
