const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const User = require("../../models/user/UserModel");
const Payment = require("../../models/user/PaymentModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");

// FLW Secret Key
const FLW_PUBLIC_KEY = process.env.FLW_PUBLIC_KEY;
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE_URL = process.env.FLW_BASE_URL;

// FLUTTERWAVE
exports.requestFlutterWavePayment = async (req, res) => {
  const frontEndUrl = "http://192.168.178.22:2025/payment-success";
  const {
    studentId,
    amount,
    provider,
    year,
    phoneNumber,
    currency,
    email,
    reference,
  } = req.body;
  const momoProviders = {
    MTN: "mobile_money_mtn",
    AirtelTigo: "mobile_money_airtel",
    Telecel: "mobile_money_telecel",
  };
  try {
    const enrolledStudent = await User.findOne({ uniqueId: studentId });
    const placementStudent = await PlacementStudent.findOne({
      jhsIndexNo: studentId,
    });
    const foundStudent = enrolledStudent || placementStudent;
    if (!foundStudent) {
      return res.status(404).json({
        success: false,
        errorMessage: {
          message: ["Student not found!"],
        },
      });
    }
    const studentNamePrefix = foundStudent?.personalInfo?.fullName
      ?.split(" ")
      ?.map((name) => name[0])
      .join("");

    const ref = `${reference}_${Date.now()}_${studentNamePrefix}`;
    const response = await axios.post(
      "https://api.flutterwave.com/v3/charges?type=mobile_money_mtn",
      {
        tx_ref: `test_${Date.now()}`,
        amount: "10",
        currency: "GHS",
        redirect_url: "http://192.168.178.22:2025/payment-success",
        customer: {
          email: "kenneford85@gmail.com",
          phonenumber: "0539606865",
          name: "Test User",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    await Payment.create({
      studentId,
      transactionId: ref,
      amount,
      currency,
      reference,
      year,
      phoneNumber,
      email,
      status: "pending",
    });
    // Generating Enrollment Code Process
    // const generatedNum = Math.floor(100 + Math.random() * 900); // Generate random number
    // // Get the student's programme abbreviation
    // const programmeAbbreviation = existingStudent?.programme
    //   .split(" ")
    //   .map((word) => word[0].toUpperCase())
    //   .join("");

    // // Get the last two digits of the current year
    // const currentYear = new Date().getFullYear();
    // const yearSuffix = currentYear.toString().slice(-2);

    // // Generate the enrolment Code
    // const enrollmentCode = `${programmeAbbreviation}${generatedNum}-${yearSuffix}`;
    // await PlacementStudent.findOneAndUpdate(
    //   existingStudent?._id,
    //   {
    //     enrollmentCode,
    //     enrollmentFeesPaid: true,
    //   },
    //   { new: true }
    // );
    // console.log("MoMo Payment Response:", response.data);
    res.json({
      success: true,
      successMessage: "Payment initiated successfully!",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "MoMo Payment Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({
      success: false,
      errorMessage: {
        message: [
          "MoMo Payment Error:",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
  //   try {
  //     const {
  //       amount,
  //       schoolName,
  //       paymentMethod,
  //       nameOfBank,
  //       accountHolder,
  //       accountNumber,
  //       semester,
  //       year,
  //       phoneNumber,
  //       enrollmentFees,
  //       currency,
  //       email,
  //     } = req.body;
  //     const txRef = `TX-${Date.now()}`;

  //     const response = await axios.post(
  //       `${FLW_BASE_URL}/charges`,
  //       {
  //         tx_ref: txRef,
  //         amount,
  //         currency,
  //         payment_type: paymentMethod,
  //         redirect_url: `http://192.168.178.22:2025/payment_success`,
  //         customer: { email, phone_number: phoneNumber },
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
  //         "Content-Type": "application/json",
  //       }
  //     );

  // await Payment.create({
  //   studentId: foundStudent?.uniqueId,
  //   transactionId: txRef,
  //   amount,
  //   currency,
  //   reference: "School Fees",
  //   paidVia:
  //     paymentMethod === "mobilemoneygh" ? "Mobile Money" : paymentMethod,
  //   nameOfBank,
  //   bankAccountHolder: accountHolder,
  //   bankAccountNo: accountNumber,
  //   semester,
  //   year,
  //   contact: phoneNumber,
  //   status: "pending",
  // });
  //     res.json({ success: true, paymentLink: response.data.data.link });
  //   } catch (error) {
  //     console.log(error);

  //     console.error("Payment Error:", error.message);
  //     res
  //       .status(500)
  //       .json({ success: false, errorMessage: { message: [error.message] } });
  //   }
};
// Verify Transaction by sender
module.exports.verifyFlutterWavePaymentMade = async (req, res) => {
  const { transactionId } = req.params;
  try {
    const response = await axios.get(
      `${FLW_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    const status = response.data.status;
    await Payment.findOneAndUpdate(
      { transactionId },
      { status },
      { new: true }
    );

    // Step 4: Return Payment Status to User
    res.json({
      success: true,
      successMessage: "Payments received!",
      data: response.data, // Now includes transaction details
    });
  } catch (error) {
    console.error(
      "Verifying payment sent Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({
      success: false,
      errorMessage: {
        message: [
          "Verifying payment sent failed!",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
};
// FLUTTERWAVE WEBHOOK
module.exports.flutterWaveWebhook = async (req, res) => {
  try {
    const { transactionId, status } = req.body;
    await Payment.findOneAndUpdate(
      { transactionId },
      { status },
      { new: true }
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({
      success: false,
      errorMessage: { message: [error.message] },
    });
  }
};
// FETCH FLUTTERWAVE CURRENCIES
module.exports.fetchFlutterWaveCurrencies = async (req, res) => {
  try {
    const flutterwaveCurrencies = [
      "NGN",
      "USD",
      "GBP",
      "KES",
      "GHS",
      "ZAR",
      "UGX",
      "TZS",
      "XAF",
      "XOF",
      "EUR",
      "CAD",
    ];
    const response = await axios.get(
      `https://api.flutterwave.com/v3/currencies`,
      {
        headers: {
          Authorization: `Bearer ${FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json({
      success: true,
      successMessage: "Currencies fetched successfully!.",
      data: flutterwaveCurrencies,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      errorMessage: { message: [error.message] },
    });
  }
};
// FETCH FLUTTERWAVE PAYMENT METHODS
module.exports.fetchFlutterWavePaymentMethods = async (req, res) => {
  try {
    const response = await axios.get(`${FLW_BASE_URL}/banks/GH`, {
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });
    res.json({
      success: true,
      successMessage: "Payment methods fetched successfully!.",
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errorMessage: { message: [error.message] },
    });
  }
};
