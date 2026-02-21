const Enrollment = require("../models/Enrollment");

const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      user: req.user._id,
       paymentStatus: { $in: ["paid", "free"] }
    }).populate("course");

  const courses = enrollments.map((enrollment) => enrollment.course);

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getMyEnrollments
};