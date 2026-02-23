const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendPaymentEmail = async ({ to, userName, courseTitle }) => {
  try {
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
    });

    console.log("✅ Payment email sent successfully");
  } catch (error) {
    console.error("❌ Payment email error:", error);
  }
};

module.exports = { sendPaymentEmail };