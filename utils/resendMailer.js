const { Resend } = require("resend");
const fs = require("fs");

const resend = new Resend(process.env.RESEND_API_KEY);


// ==============================
// ✅ PAYMENT SUCCESS EMAIL
// ==============================
const sendPaymentEmail = async ({
  to,
  userName,
  courseTitle,
  invoicePath = null
}) => {
  try {

    let attachments = [];

    // Attach invoice if available
    if (invoicePath && fs.existsSync(invoicePath)) {
      attachments.push({
        filename: "invoice.pdf",
        content: fs.readFileSync(invoicePath).toString("base64"),
      });
    }

    await resend.emails.send({
      from: "EarnProjectAcademy <no-reply@earnprojectacademy.com>",
      to,
      subject: "Payment Successful – Welcome to EarnProjectAcademy 🎉",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>🎉 Payment Successful</h2>

          <p>Hi <strong>${userName}</strong>,</p>

          <p>Your payment has been successfully received.</p>

          <p>
            <strong>Course:</strong> ${courseTitle}
          </p>

          <p>
            ✅ Your dashboard is now unlocked <br/>
            ✅ You can start learning immediately
          </p>

          <a href="${process.env.FRONTEND_URL}/dashboard"
             style="
               display:inline-block;
               margin-top:16px;
               padding:12px 18px;
               background:#4f46e5;
               color:#fff;
               text-decoration:none;
               border-radius:6px;
             ">
            Go to Dashboard
          </a>

          <p style="margin-top:24px;">
            – EarnProjectAcademy Team
          </p>
        </div>
      `,
      attachments,
    });

    console.log("✅ Payment email sent successfully");

  } catch (error) {
    console.error("❌ Payment email error:", error);
  }
};


// ==============================
// 📧 PAYMENT REMINDER EMAIL
// ==============================
const sendPaymentReminderEmail = async ({
  to,
  userName,
  courseTitle,
  dueDate,
  amount
}) => {
  try {

    const html = `
      <h2>Payment Reminder</h2>

      <p>Hello ${userName},</p>

      <p>Your next installment payment is due soon.</p>

      <b>Course:</b> ${courseTitle} <br/>
      <b>Amount Due:</b> ₹${amount} <br/>
      <b>Due Date:</b> ${new Date(dueDate).toDateString()}

      <p>Please complete payment to avoid course access suspension.</p>

      <br/>

      <b>EarnProjectAcademy</b>
    `;

    await resend.emails.send({
      from: "EarnProjectAcademy <no-reply@earnprojectacademy.com>",
      to,
      subject: "Payment Reminder - EarnProjectAcademy",
      html,
    });

    console.log("📧 Reminder email sent");

  } catch (error) {
    console.error("❌ Reminder email error:", error);
  }
};


module.exports = {
  sendPaymentEmail,
  sendPaymentReminderEmail
};