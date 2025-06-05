/* eslint-disable require-jsdoc */
/* eslint-disable new-cap */
/* eslint-disable max-len */
const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();

//  Create reusable transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Common responsive styles for all emails
const getResponsiveStyles = () => `
  <style>
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        padding: 5px !important;
      }
      .responsive-table {
        font-size: 10px !important;
      }
      .responsive-table th,
      .responsive-table td {
        padding: 4px !important;
        word-wrap: break-word !important;
      }
      .hide-mobile {
        display: none !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      .mobile-center {
        text-align: center !important;
      }
    }
  </style>
`;

//  Route to send email
function generateTableForRE(items) {
  const rows = items.map((item) => {
    const type = item.exchange ? "Exchange" : "Return";
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; word-wrap: break-word;">${item.productName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${type}</td>
        <td style="padding: 8px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.color}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.size}</td>
        <td style="padding: 8px; border: 1px solid #ddd; word-wrap: break-word;">${item.reason}</td>
      </tr>
    `;
  }).join("");

  return `
    <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
      <table class="responsive-table" style="border-collapse: collapse; width: 100%; min-width: 500px; margin-top: 10px; font-family: Arial, sans-serif;">
        <thead style="background-color: #f0f0f0;">
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Type</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Color</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Size</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Reason</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
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
          <td style="padding: 8px; border: 1px solid #ddd; word-wrap: break-word;">${productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${heightType}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${color}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${size}</td>
        </tr>
      `,
    ).join("");

    return `
      <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
        <table class="responsive-table" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; min-width: 400px; margin-top: 10px; font-family: Arial, sans-serif; font-size: 14px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Product</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Height</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Color</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Size</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  const emailWrapper = (content) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Lushio</title>
      ${getResponsiveStyles()}
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; box-sizing: border-box;">
        ${content}
      </div>
    </body>
    </html>
  `;

  switch (type) {
    case "order":
      subject = "Order Confirmation";
      htmlContent = emailWrapper(`
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Order Confirmation</h2>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Your order with OrderId <b>${orderId}</b> has been placed successfully.</p>
          ${generateTable(items)}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 14px; color: #666; margin: 0;">Thank you for choosing Lushio!</p>
          </div>
        </div>
      `);
      break;

    case "cancel":
      subject = "Item Cancelled";
      htmlContent = emailWrapper(`
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Order Cancellation</h2>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Dear ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">We would like to inform you that your order with orderId <strong>${orderId}</strong> has been successfully cancelled.</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Below are the item(s) that were part of this order:</p>
          ${generateTable(items)}
          <div style="margin-top: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">If you have any questions or require further assistance, please feel free to contact our support team.</p>
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Thank you for choosing Lushio.</p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0;"><strong>Best regards,</strong><br />The Lushio Team</p>
          </div>
        </div>
      `);
      break;

    case "return-request":
      subject = "Return/Exchange Request Received";
      htmlContent = emailWrapper(`
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Return/Exchange Request</h2>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Hi ${name},</p>
          <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">We have received your request for return/exchange for Order ID <b>${orderId}</b>. Please find the details below:</p>
          ${generateTableForRE(items)}
          <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e8; border-radius: 5px; border-left: 4px solid #4CAF50;">
            <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px; color: #2e7d32;">Our team will review your request and get back to you shortly with the next steps.</p>
            <p style="font-size: 16px; line-height: 1.5; margin: 0; color: #2e7d32;">Thank you for shopping with us!</p>
          </div>
        </div>
      `);
      break;

   case "address":
  subject = "Address Updated";

  const landmarkText = address.landmark
    ? `<p><strong>Landmark:</strong> ${address.landmark}</p>`
    : "";

  const fullAddress = `
    <span>${address.flatDetails}, ${address.areaDetails}, ${address.townCity}, ${address.state}</span><br/>
    ${landmarkText}
    <span>Pin Code: ${address.pinCode}</span>
  `;

  htmlContent = emailWrapper(`
    <div style="font-family: Arial, sans-serif;">
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Address Updated</h2>
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 15px;">Hi ${name},</p>
      <p style="font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
        Your delivery address for order with orderId <b>${orderId}</b> has been updated to:
      </p>
      <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; border-left: 4px solid #2196F3; margin-bottom: 20px;">
        ${fullAddress}
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #666; margin: 0;">Thank you for choosing Lushio!</p>
      </div>
    </div>
  `);
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
    console.error("Email error:", err);
    res.status(500).json({message: "Failed to send email", error: err});
  }
});

module.exports = router;
