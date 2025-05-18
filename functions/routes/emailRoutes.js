/* eslint-disable require-jsdoc */
/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

//  Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,    
    pass: process.env.EMAIL_PASSWORD,  
  },
});

//  Route to send email
function generateTableForRE(items) {
  const rows = items.map((item) => {
    const type = item.exchange ? "Exchange" : "Return";
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.productName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${type}</td>
        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.color}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.size}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.reason}</td>
      </tr>
    `;
  }).join("");

  return `
    <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: Arial, sans-serif;">
      <thead style="background-color: #f0f0f0;">
        <tr>
          <th style="padding: 8px; border: 1px solid #ddd;">Product Name</th>
           <th style="padding: 8px; border: 1px solid #ddd;"> Request Type</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
         <th style="padding: 8px; border: 1px solid #ddd;">Color</th>
           <th style="padding: 8px; border: 1px solid #ddd;">Size</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Reason</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

router.post("/", async (req, res) => {
  // eslint-disable-next-line no-unused-vars
  const {email, type, orderId, name, item, items, address} = req.body;

  if (!email || !type || !name) {
    return res.status(400).json({message: "Required fields missing"});
  }

  let subject = "";
  let htmlContent = "";

  const generateTable = (itemsArray) => {
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) return "";

    const rows = itemsArray.map(
        ({productName, quantity, size, color, heightType}) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${productName}</td>
           <td style="padding: 8px; border: 1px solid #ddd;">${heightType}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${color}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${size}</td>
        </tr>
      `,
    ).join("");

    return `
      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 100%; margin-top: 10px; font-family: Arial, sans-serif; font-size: 14px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Height</th>
             <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Color</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Size</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  };

  switch (type) {
    case "order":
      subject = "Order Confirmation";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <p>Hi ${name},</p>
          <p>Your order with OrderId <b>${orderId}</b> has been placed successfully.</p>
          ${generateTable(items)}
        </div>
      `;
      break;

    case "cancel":
      subject = "Item Cancelled";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
  <p>Dear ${name},</p>
  <p>We would like to inform you that your order with orderId <strong>${orderId}</strong> has been successfully cancelled.</p>
  <p>Below are the item(s) that were part of this order:</p>
  ${generateTable(items)}
  <p>If you have any questions or require further assistance, please feel free to contact our support team.</p>
  <p>Thank you for choosing Lushio.</p>
  <p>Best regards,<br />The Lushio Team</p>
</div>

      `;
      break;

    case "return-request":
      subject = "Return/Exchange Request Received";
      htmlContent = `
          <div style="font-family: Arial, sans-serif; padding: 10px;">
            <p>Hi ${name},</p>
            <p>We have received your request for return/exchange for Order ID <b>${orderId}</b>. Please find the details below:</p>
            ${generateTableForRE(items)}
            <p>Our team will review your request and get back to you shortly with the next steps.</p>
            <p>Thank you for shopping with us!</p>
          </div>
        `;
      break;

    case "address":
      subject = "Address Updated";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <p>Hi ${name},</p>
          <p>Your delivery address has been updated to:</p>
          <p><b>${address}</b></p>
        </div>
      `;
      break;

    default:
      return res.status(400).json({message: "Invalid email type"});
  }

  const mailOptions = {
    from: `"Lushio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({message: "Email sent successfully"});
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email', error: err });
  }
});

module.exports = router;
