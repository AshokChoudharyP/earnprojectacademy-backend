const cron = require("node-cron");
const Enrollment = require("../models/Enrollment");

cron.schedule("0 0 * * *", async () => {
  console.log("Running installment check...");

  const overdueStudents = await Enrollment.find({
    nextDueDate: { $lt: new Date() },
    remainingAmount: { $gt: 0 },
  });

  for (const student of overdueStudents) {
    student.isBlocked = true;
    await student.save();
  }
});