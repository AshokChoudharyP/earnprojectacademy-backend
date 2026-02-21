const paymentSuccessTemplate = ({ name, course }) => {
  return `
    <div style="font-family: Arial; padding:20px;">
      <h2>🎉 Payment Successful!</h2>

      <p>Hi <b>${name}</b>,</p>

      <p>Your payment for <b>${course}</b> has been successfully received.</p>

      <p>✅ Your dashboard is now unlocked<br/>
      ✅ You can start learning immediately</p>

      <a href="http://localhost:3000/dashboard"
         style="display:inline-block;margin-top:20px;
         padding:12px 20px;background:#4f46e5;
         color:white;text-decoration:none;border-radius:6px;">
         Go to Dashboard
      </a>

      <p style="margin-top:30px;">
        Happy Learning 🚀<br/>
        <b>EarnProjectAcademy Team</b>
      </p>
    </div>
  `;
};

module.exports = paymentSuccessTemplate;