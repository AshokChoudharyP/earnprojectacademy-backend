router.post("/complete", protect, async (req, res) => {
  const { courseId, moduleId, lessonId } = req.body;

  const progress = await LessonProgress.findOneAndUpdate(
    {
      user: req.user._id,
      lessonId,
    },
    {
      user: req.user._id,
      course: courseId,
      module: moduleId,
      lessonId,
      completed: true,
    },
    { upsert: true, new: true }
  );

  res.json({ message: "Lesson marked completed", progress });
});

router.get("/:courseId", protect, async (req, res) => {
  const totalLessons = await Module.aggregate([
    { $match: { course: mongoose.Types.ObjectId(req.params.courseId) } },
    { $unwind: "$lessons" },
    { $count: "count" },
  ]);

  const completedLessons = await LessonProgress.countDocuments({
    user: req.user._id,
    course: req.params.courseId,
    completed: true,
  });

  const total = totalLessons[0]?.count || 0;
  const percent = total === 0 ? 0 : Math.round((completedLessons / total) * 100);

  res.json({ completedLessons, totalLessons: total, percent });
});

module.exports = router;