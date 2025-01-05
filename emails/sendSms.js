const { africastalking } = require("./africasTalkingMiddleware");

// SMS sending function
const sendEnrollmentCodeSMS = async (phoneNumber, enrollmentCode) => {
  const sms = africastalking.SMS;
  try {
    const response = await sms.send({
      //   to: [phoneNumber],
      to: ["+233539606865"],
      message: `Your enrollment code is: ${"SS666-24"}. Welcome to SHS!`,
    });
    console.log(response);
    return response;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

module.exports = { sendEnrollmentCodeSMS };
