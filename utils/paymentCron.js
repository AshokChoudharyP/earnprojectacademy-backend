const cron = require("node-cron");
const Enrollment = require("../models/Enrollment");

const startPaymentCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Running installment check...");

    const today = new Date();

    const overdueEnrollments = await Enrollment.find({
      paymentPlan: "INSTALLMENT",
      paymentStatus: { $ne: "PAID" },
      nextDueDate: { $lt: today },
      isBlocked: false,
    });

    for (let enrollment of overdueEnrollments) {
      enrollment.isBlocked = true;
      await enrollment.save();
      console.log("⚠️ User blocked for overdue:", enrollment._id);
    }
  });
};

module.exports = startPaymentCron;