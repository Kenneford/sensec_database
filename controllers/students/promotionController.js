// Works ✅
module.exports.promotedStudent = async (req, res) => {
  const promotedStudent = req.promotedStudent;
  try {
    res.status(200).json({
      successMessage: "Student promoted successfully!",
      promotedStudent,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
};
module.exports.promotedMultiStudents = async (req, res) => {
  const promotedStudents = req.promotedStudents;
  try {
    res.status(200).json({
      successMessage: "Selected students promoted successfully!",
      promotedStudents,
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        message: [error?.message],
      },
    });
  }
};
