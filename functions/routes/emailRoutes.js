/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

// 1. Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail", // use your email provider here (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER, // your email address (use environment variable for safety)
    pass: process.env.EMAIL_PASSWORD, // your email password or app-specific password
  },
});

// 2. Route to send email
router.post("/", async (req, res) => {
  const {email, type, orderId, name, item, address} = req.body;

  // Check for required fields
  if (!email || !type || !name) {
    return res.status(400).json({message: "Required fields missing"});
  }

  // 3. Decide subject and message based on the type of action
  let subject = "";
  let htmlContent = "";

  switch (type) {
    case "order":
      subject = "Order Confirmation";
      htmlContent = `<p>Hi ${name},</p><p>Your order <b>#${orderId}</b> has been placed successfully.</p>`;
      break;

    case "cancel":
      subject = "Item Cancelled";
      htmlContent = `<p>Hi ${name},</p><p>The item <b>${item}</b> has been cancelled from your order <b>#${orderId}</b>.</p>`;
      break;

    case "address":
      subject = "Address Updated";
      htmlContent = `<p>Hi ${name},</p><p>Your delivery address has been updated to:</p><p><b>${address}</b></p>`;
      break;

    default:
      return res.status(400).json({message: "Invalid email type"});
  }

  // 4. Define the mail options
  const mailOptions = {
    from: `"Lushio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  };

  // 5. Send the email
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({message: "Email sent successfully"});
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({message: "Failed to send email", error: err});
  }
});

module.exports = router;
