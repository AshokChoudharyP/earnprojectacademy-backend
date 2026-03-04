const cron = require("node-cron");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const Course = require("../models/Course");
const { sendPaymentReminderEmail } = require("./resendMailer");

const startPaymentCron = () => {

  // Runs every day at midnight
  cron.schedule("0 0 * * *", async () => {

    console.log("🔄 Running installment payment cron...");

    try {

      const today = new Date();

      // ===============================
      // 1️⃣ BLOCK OVERDUE USERS
      // ===============================
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

      // ===============================
      // 2️⃣ SEND REMINDER EMAILS
      // ===============================

      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 2);

      const upcomingPayments = await Enrollment.find({
        paymentPlan: "INSTALLMENT",
        paymentStatus: { $ne: "PAID" },
        nextDueDate: { $lte: reminderDate },
        isBlocked: false
      });

      for (let enrollment of upcomingPayments) {

        const user = await User.findById(enrollment.user);
        const course = await Course.findById(enrollment.course);

        try {

          await sendPaymentReminderEmail({
            to: user.email,
            userName: user.name,
            courseTitle: course.title,
            dueDate: enrollment.nextDueDate,
            amount: enrollment.remainingAmount
          });

          console.log("📧 Reminder email sent to:", user.email);

        } catch (emailError) {

          console.error("❌ Email failed:", emailError.message);

        }

      }

    } catch (error) {

      console.error("❌ Cron job error:", error);

    }

  });

};

module.exports = startPaymentCron;