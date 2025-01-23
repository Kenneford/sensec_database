const AcademicTerm = require("../../models/academics/term/AcademicTermModel");
const AcademicYear = require("../../models/academics/year/AcademicYearModel");
const nodemailer = require("nodemailer"); // Example: For email notifications
const User = require("../../models/user/UserModel");

module.exports.createNextAcademicYear = async () => {
  try {
    const now = new Date();

    // Step 1: Find the current academic year
    const currentAcademicYear = await AcademicYear.findOne({ isCurrent: true });

    if (!currentAcademicYear) {
      console.log("No current academic year found. Please set one manually.");
      return;
    }

    // Step 2: Check if the next academic year already exists
    const nextAcademicYear = await AcademicYear.findOne({ isNext: true });

    if (nextAcademicYear) {
      console.log(
        `Academic year ${nextAcademicYear.yearRange} is already set as next.`
      );
      return; // Skip creating a new academic year if the next is already set
    }

    // Step 3: Calculate the next academic year's range
    const fromYear = parseInt(currentAcademicYear.toYear); // Next year starts when the current ends
    const toYear = fromYear + 1; // Academic years are typically one year apart

    // Step 4: Create the new academic year
    const newAcademicYear = new AcademicYear({
      fromYear: fromYear.toString(),
      toYear: toYear.toString(),
      isNext: true, // Mark as next
      isAutoCreated: true,
    });

    await newAcademicYear.save();

    console.log(
      `New academic year ${newAcademicYear.yearRange} created and set as next.`
    );

    // Step 5: Reset the `isNext` flag for all other academic years
    await AcademicYear.updateMany(
      { _id: { $ne: newAcademicYear._id } },
      { $set: { isNext: false } }
    );
  } catch (error) {
    console.error("Error updating academic year flags:", error);
  }
};

// Function to update the current semester
module.exports.updateCurrentSemester = async (res = null) => {
  const now = new Date();
  try {
    // Fetch all semesters
    const semesters = await AcademicTerm.find({});
    if (!semesters) {
      console.log("No semesters found in the database!");
      if (res)
        return res.status(404).json({
          errorMessage: { message: ["No semesters found in the database!"] },
        });
    }
    // Find the current semester
    const currentSemester = semesters?.find(
      (semester) =>
        new Date(semester.from) <= now && new Date(semester.to) >= now
    );
    if (!currentSemester) {
      console.log("No active semester found.");
      if (res)
        return res.status(404).json({
          errorMessage: { message: ["No active semester found!"] },
        });
    }
    // Update database: mark the active semester
    await AcademicTerm.updateMany({}, { $set: { isCurrent: false } }); // Reset all
    const updatedAcademicTerm = await AcademicTerm.findOneAndUpdate(
      currentSemester?._id,
      {
        $set: { isCurrent: true },
        $set: { isNext: false },
      },
      { new: true }
    );
    // Find the next semester and mark it as next
    const nextSemester = await AcademicTerm.findOne({
      from: { $gt: currentSemester?.to },
      isNext: true,
    }).sort({ from: 1 }); // Get the next semester by closest start date

    if (nextSemester) {
      console.log(`Semester ${nextSemester?.name} is already marked as next.`);
      return; // Skip updating if the next semester is already correctly set
    }
    // Step 3: Find the actual next semester based on dates
    const upcomingSemester = await AcademicTerm.findOne({
      from: { $gt: currentSemester?.to },
    }).sort({ from: 1 }); // Get the next semester by closest start date
    // Mark the upcoming semester as next
    upcomingSemester.isNext = true;
    await upcomingSemester.save();

    console.log(`Semester ${upcomingSemester?.name} is now marked as next.`);
    console.log(
      `Current semester updated to: ${currentSemester?.name} ${currentSemester?.year}`
    );
    if (res)
      res.status(201).json({
        successMessage: "Current semester updated successfully!",
        updatedAcademicTerm,
      });
  } catch (error) {
    console.error("Error updating current semester:", error);
    if (res)
      return res.status(403).json({
        errorMessage: {
          message: [`Error updating current semester: ${error?.message}`],
        },
      });
  }
};

module.exports.updateAcademicYear = async () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // January = 0, December = 11

  let academicYearStart, academicYearEnd;

  // Determine the academic year based on the current month
  if (month >= 8) {
    // From September to December (Fall)
    academicYearStart = currentYear; // Start of academic year
    academicYearEnd = currentYear + 1; // End of academic year (next year)
  } else {
    // From January to August (Spring/Summer)
    academicYearStart = currentYear - 1; // Previous year as the start of academic year
    academicYearEnd = currentYear; // Current year as the end of academic year
  }

  // Format academic year as "YYYY/YYYY"
  const yearRange = `${academicYearStart}/${academicYearEnd}`;
  //   const year = `${academicYearStart}-${academicYearEnd}`; // You could use "2024-2025" instead of "2024/2025"

  try {
    // Step 1: Check if the academic year already exists
    const existingYear = await AcademicYear.findOne({ yearRange });

    if (existingYear) {
      // Step 2: If the academic year exists, just update the 'isCurrent' field
      // Set all other academic years to 'isCurrent: false'
      await AcademicYear.updateMany({}, { $set: { isCurrent: false } });

      // Now set the current academic year as 'isCurrent: true'
      await AcademicYear.updateOne(
        { yearRange }, // We match by the `year` field
        { $set: { isCurrent: true } } // Mark this academic year as current
      );

      console.log(`Academic Year ${yearRange} is already set as current.`);
    } else {
      // Step 3: If the academic year does not exist, create it
      const newAcademicYear = new AcademicYear({
        fromYear: academicYearStart.toString(),
        toYear: academicYearEnd.toString(),
        isCurrent: true, // Mark this new year as the current year
        isAutoCreated: true,
      });

      await newAcademicYear.save(); // Save the new academic year to DB

      // Ensure no other academic year is marked as current
      await AcademicYear.updateMany(
        { yearRange: { $ne: yearRange } }, // Update all other years except the current one
        { $set: { isCurrent: false } }
      );

      console.log(`Created new Academic Year: ${yearRange}`);
    }
  } catch (error) {
    console.error("Error updating academic year:", error);
  }
};

module.exports.notifyNextSemester = async () => {
  try {
    // Step 1: Find the "next" semester
    const nextSemester = await AcademicTerm.findOne({ isNext: true });
    if (!nextSemester) {
      console.log("No next semester is set.");
      return;
    }

    // Step 2: Find students who haven't been notified
    const usersToNotify = await User.find({
      //   isVerifiedSensosa: false,
      hasBeenNotifiedForNextSemester: false,
    });

    if (!usersToNotify.length) {
      console.log("No users to notify.");
      return;
    }

    // Step 3: Notify students
    const notifications = usersToNotify.map(async (user) => {
      // Example: Sending email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.NODEMAILER_GMAIL,
          pass: process.env.NODEMAILER_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: user?.contactAddress?.email,
        subject: `Prepare for the Next Semester: ${nextSemester.name}`,
        text: `Hi ${user?.personalInfo?.fullName},\n\nThe next semester, ${
          nextSemester.name
        }, will start on ${nextSemester.from.toDateString()} and end on ${nextSemester.to.toDateString()}. Please make sure to complete your preparations.\n\nBest regards,\nYour School Administration`,
      };

      await transporter.sendMail(mailOptions);

      // Mark user as notified
      user.hasBeenNotifiedForNextSemester = true;
      await user.save();
    });

    // Wait for all notifications to be sent
    await Promise.all(notifications);

    console.log("Next semester notifications sent successfully.");
  } catch (error) {
    console.error("Error notifying users:", error);
  }
};
