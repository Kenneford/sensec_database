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
    if (!semesters || semesters.length === 0) {
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
    // Update all semesters to isCurrent: false
    await AcademicTerm.updateMany(
      {},
      { $set: { isCurrent: false, isNext: false } }
    );
    // Mark the current semester as active
    const updatedAcademicTerm = await AcademicTerm.findOneAndUpdate(
      { _id: currentSemester?._id },
      {
        $set: { isCurrent: true, isNext: false },
      },
      { new: true }
    );
    // Find the next semester and mark it as next
    const nextSemester = await AcademicTerm.findOne({
      from: { $gt: currentSemester?.to },
      isNext: true,
    }).sort({ from: 1 }); // Get the next semester by closest start date
    if (!nextSemester) {
      // Find the upcoming semester based on dates
      const upcomingSemester = await AcademicTerm.findOne({
        from: { $gt: currentSemester.to },
      }).sort({ from: 1 });

      if (upcomingSemester) {
        upcomingSemester.isNext = true;
        await upcomingSemester.save();
        console.log(`Semester ${upcomingSemester.name} is now marked as next.`);
      }
    }
    console.log(`Current semester updated to: ${currentSemester?.name}`);
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

  try {
    let academicYearStart, academicYearEnd;

    // Determine academic year range
    if (month >= 8) {
      academicYearStart = currentYear;
      academicYearEnd = currentYear + 1;
    } else {
      academicYearStart = currentYear - 1;
      academicYearEnd = currentYear;
    }

    const yearRange = `${academicYearStart}/${academicYearEnd}`;

    // Check if the current academic year exists
    let currentAcademicYear = await AcademicYear.findOne({ yearRange });

    if (!currentAcademicYear) {
      console.log(`Creating new Academic Year: ${yearRange}`);
      currentAcademicYear = new AcademicYear({
        fromYear: academicYearStart.toString(),
        toYear: academicYearEnd.toString(),
        isCurrent: true,
        isNext: false,
        isAutoCreated: true,
        yearRange,
      });
      await currentAcademicYear.save();
    } else {
      console.log(`Academic Year ${yearRange} already exists.`);
    }

    // Reset `isCurrent` for all years and update the current one
    await AcademicYear.bulkWrite([
      {
        updateMany: {
          filter: {},
          update: { $set: { isCurrent: false, isNext: false } },
        },
      },
      {
        updateOne: {
          filter: { yearRange },
          update: { $set: { isCurrent: true } },
          upsert: true,
        },
      },
    ]);

    // Find the next academic year (starts after the current one)
    let nextAcademicYear = await AcademicYear.findOne({
      fromYear: academicYearEnd.toString(), // The next academic year starts after the current one
    });

    if (!nextAcademicYear) {
      console.log(
        `Creating next Academic Year: ${academicYearEnd}/${academicYearEnd + 1}`
      );
      nextAcademicYear = new AcademicYear({
        fromYear: academicYearEnd.toString(),
        toYear: (academicYearEnd + 1).toString(),
        isCurrent: false,
        isNext: true,
        isAutoCreated: true,
        yearRange: `${academicYearEnd}/${academicYearEnd + 1}`,
      });
      await nextAcademicYear.save();
    } else {
      // Ensure it's marked as `isNext`
      await AcademicYear.updateOne(
        { _id: nextAcademicYear._id },
        { $set: { isNext: true } }
      );
    }

    console.log(`Updated current academic year: ${yearRange}`);
    console.log(`Next academic year set to: ${nextAcademicYear.yearRange}`);
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
