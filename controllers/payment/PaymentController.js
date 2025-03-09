const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const User = require("../../models/user/UserModel");
const Payment = require("../../models/user/PaymentModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
const { paidEnrollmentFeesEmail } = require("../../emails/sendEmail");

// FLW Secret Key
const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
const FLW_BASE_URL = process.env.FLW_BASE_URL;

async function mtnMomoPayment(req, res) {
  const referenceId = uuidv4(); // Generate a unique transaction ID
  console.log("Generated X-Reference-Id:", referenceId);
  const feePrices = {
    enrolment: 50,
    report: 10,
  };
  try {
    const data = req.body;
    const { foundStudent, paymentAccessToken } = req.paymentRequestData;

    const existingPayment = await Payment.findOne({
      $or: [
        { studentId: foundStudent.uniqueId },
        { studentId: foundStudent.jhsIndexNo },
      ],
      reference: data?.reference,
      status: "successful",
    });
    if (
      data?.reference === "Enrolment" &&
      data?.amount !== feePrices?.enrolment
    ) {
      return res.status(400).json({
        errorMessage: {
          message: [`Enrolment cost is ¢${feePrices?.enrolment} GHS!`],
        },
      });
    }
    if (data?.reference === "Report" && data?.amount !== feePrices?.report) {
      return res.status(400).json({
        errorMessage: {
          message: [`Report cost is ¢${feePrices?.report} GHS!`],
        },
      });
    }
    if (!paymentAccessToken) {
      return res.status(400).json({
        errorMessage: {
          message: ["Internal Server Error! Payment access token is missing!"],
        },
      });
    }
    if (existingPayment) {
      return res.status(400).json({
        errorMessage: {
          message: [`Payment already completed!`],
        },
      });
    }

    const studentNamePrefix =
      foundStudent?.personalInfo?.fullName
        ?.split(" ")
        ?.map((name) => name[0])
        .join("") ||
      foundStudent?.fullName
        ?.split(" ")
        ?.map((name) => name[0])
        .join("");

    const ref = `${data?.reference}_${Date.now()}_${studentNamePrefix}`;
    // Step 1: Request Payment
    const paid = await axios.post(
      `${process.env.MTN_MOMO_API_BASE}/collection/v1_0/requesttopay`,
      {
        amount: data?.amount,
        currency: process.env.MTN_MOMO_API_CURRENCY, // Use "EUR" in sandbox
        externalId: `SCHOOL_FEES_${Date.now()}`,
        payer: { partyIdType: "MSISDN", partyId: data?.phoneNumber },
        // payerMessage: "School Fees Payment",
        // payeeNote: "Thanks for paying",
        payerMessage: `${
          foundStudent?.personalInfo?.fullName || foundStudent?.fullName
        } is paying school fees to ${data?.schoolName}`, // Include sender's name
        payeeNote: `Fees for ${data?.schoolName}`, // Include school name
      },
      {
        headers: {
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Content-Type": "application/json",
          Authorization: `Bearer ${paymentAccessToken}`,
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_API_SUBSCRIPTION_KEY,
        },
      }
    );

    let enrolmentFees;
    try {
      enrolmentFees = await Payment.create({
        studentId: foundStudent?.jhsIndexNo,
        transactionId: referenceId, // Generated unique transaction ID
        amount: data?.amount,
        reference: data?.reference,
        provider: data?.provider,
        semester: data?.semester,
        year: data?.year,
        phoneNumber: data?.phoneNumber,
        email: data?.email,
        status: "pending", // Initially set to "pending"
      });
    } catch (error) {
      console.error("Error creating payment record:", error);
      return res.status(500).json({
        errorMessage: { message: ["Failed to create payment record."] },
      });
    }
    console.log("Paid Data: ", paid);

    console.log("Payment request sent. Checking status...");

    // Step 2: Wait for a few seconds before checking status (optional but recommended)
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Step 3: Check Payment Status and Update Record
    const statusResponse = await axios.get(
      `${process.env.MTN_MOMO_API_BASE}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          "X-Target-Environment": "sandbox",
          Authorization: `Bearer ${paymentAccessToken}`,
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_API_SUBSCRIPTION_KEY,
        },
      }
    );

    if (statusResponse.data?.status === "SUCCESSFUL") {
      // Update payment record to successful status
      await Payment.findOneAndUpdate(
        { _id: enrolmentFees?._id },
        {
          status: "successful",
        },
        { new: true }
      );
      // Update student's enrolment data
      if (data?.reference === "Enrolment") {
        const existingPlacementStudent = await PlacementStudent.findOne({
          jhsIndexNo: foundStudent?.jhsIndexNo,
        });
        // Generating Enrollment Code Process
        const generatedNum = Math.floor(100 + Math.random() * 900); // Generate random number
        // Get the student's programme abbreviation
        const programmeAbbreviation = existingPlacementStudent?.programme
          .split(" ")
          .map((word) => word[0].toUpperCase())
          .join("");

        // Get the last two digits of the current year
        const currentYear = new Date().getFullYear();
        const yearSuffix = currentYear.toString().slice(-2);

        // Generate the enrolment Code
        const enrollmentCode = `${programmeAbbreviation}${generatedNum}-${yearSuffix}`;
        await PlacementStudent.findOneAndUpdate(
          existingPlacementStudent?._id,
          {
            enrollmentCode,
            enrollmentFeesPaid: true,
            enrollmentFeesId: enrolmentFees?._id,
          },
          { new: true }
        );
        const paymentData = {
          studentId: foundStudent?.jhsIndexNo,
          fullName: foundStudent?.fullName,
          transactionId: referenceId, // Generated unique transaction ID
          amount: data?.amount,
          reference: data?.reference,
          phoneNumber: data?.phoneNumber,
          email: data?.email,
          provider: data?.provider,
          enrollmentCode,
        };
        paidEnrollmentFeesEmail(paymentData);
      }
    } else {
      // If the status is failed or anything unexpected
      await Payment.findOneAndUpdate(
        { _id: enrolmentFees?._id },
        { status: "failed" },
        { new: true }
      );
      console.log("Payment failed, status updated!");
    }
    console.log("Payment Status:", statusResponse.data);

    // Step 4: Return Payment Status to User
    res.json({
      success: true,
      successMessage: "Payment completed successfully!",
      paymentTracker: referenceId,
      paymentData: statusResponse.data, // Now includes transaction details
    });
  } catch (error) {
    console.error(
      "Payment Error:",
      error.response ? error.response.data : error.message
    );
    console.log(error);

    return res.status(500).json({
      errorMessage: {
        message: [
          "Payment request failed!",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
}
async function bankTransfer(req, res) {
  const referenceId = uuidv4();
  const {
    amount,
    schoolName,
    paymentMethod,
    nameOfBank,
    accountHolder,
    accountNumber,
    semester,
    year,
    phoneNumber,
    enrollmentFees,
  } = req?.body;

  const { foundStudent, paymentAccessToken } = req.paymentRequestData;
  try {
    // Simulate a Bank Transfer (In a real system, integrate with a bank API)
    const bankTransferDetails = {
      bankName: "Ghana Commercial Bank",
      accountNumber: "1234567890",
      accountName: schoolName,
      reference: `SCHOOL_FEES_${Date.now()}`,
    };

    if (bankTransferDetails) {
      await Payment.create({
        studentId: foundStudent?.uniqueId,
        transactionId: referenceId,
        amount,
        reference: "School Fees",
        paidVia: paymentMethod,
        nameOfBank,
        bankAccountHolder: accountHolder,
        bankAccountNo: accountNumber,
        semester,
        year,
        contact: phoneNumber,
      });
      if (enrollmentFees) {
        const existingStudent = await PlacementStudent.findOne({
          jhsIndexNo: foundStudent?.studentSchoolData?.jhsIndexNo,
        });
        // Generating Enrollment Code Process
        const generatedNum = Math.floor(100 + Math.random() * 900); // Generate random number
        // Get the student's programme abbreviation
        const programmeAbbreviation = existingStudent?.programme
          .split(" ")
          .map((word) => word[0].toUpperCase())
          .join("");

        // Get the last two digits of the current year
        const currentYear = new Date().getFullYear();
        const yearSuffix = currentYear.toString().slice(-2);

        // Generate the enrolment Code
        const enrollmentCode = `${programmeAbbreviation}${generatedNum}-${yearSuffix}`;
        await PlacementStudent.findOneAndUpdate(
          existingStudent?._id,
          {
            enrollmentCode,
            enrollmentFeesPaid: true,
          },
          { new: true }
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    return res.json({
      success: true,
      successMessage: "Bank transfer details generated.",
      data: bankTransferDetails,
    });
  } catch (error) {
    console.error(
      "Payment Error:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({
      success: false,
      errorMessage: {
        message: [
          "Payment request failed!",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
}
module.exports.requestPayment = async (req, res) => {
  const { provider } = req.body;
  if (!provider) {
    return res.status(404).json({
      errorMessage: {
        message: [`Select your mobile money provider!`],
      },
    });
  }
  if (provider === "MTN") {
    mtnMomoPayment(req, res);
  } else if (provider === "AirtelTigo") {
    bankTransfer(req, res);
  } else if (provider === "Telecel/Vodafone") {
    bankTransfer(req, res);
  } else {
    return res.status(400).json({
      errorMessage: { message: ["Invalid mobile money provider selected!"] },
    });
  }
};
module.exports.requestEnrollmentFeesPayment = async (req, res) => {
  const { paymentMethod } = req.body;
  if (!paymentMethod) {
    return res.status(404).json({
      errorMessage: {
        message: [`Select a payment method!`],
      },
    });
  }
  if (paymentMethod === "MTN Momo") {
    mtnMomoPayment(req, res);
  } else if (paymentMethod === "Bank Transfer") {
    bankTransfer(req, res);
  } else {
    return res.status(400).json({
      success: false,
      errorMessage: { message: ["Invalid payment method selected!"] },
    });
  }
};
// Request Payment
module.exports.requestMomoPayment = async (req, res) => {
  const referenceId = uuidv4();
  console.log("Generated X-Reference-Id:", referenceId);
  try {
    const { amount, phoneNumber, schoolName } = req.body;
    const { foundStudent, paymentAccessToken } = req.paymentRequestData;
    const referenceId = uuidv4(); // Generate a unique transaction ID

    // Step 1: Request Payment
    await axios.post(
      `${process.env.MTN_MOMO_API_BASE}/collection/v1_0/requesttopay`,
      {
        amount,
        currency: process.env.MTN_MOMO_API_CURRENCY, // Use "EUR" in sandbox
        externalId: `SCHOOL_FEES_${Date.now()}`,
        payer: { partyIdType: "MSISDN", partyId: phoneNumber },
        // payerMessage: "School Fees Payment",
        // payeeNote: "Thanks for paying",
        payerMessage: `${foundStudent?.personalInfo?.fullName} is paying school fees to ${schoolName}`, // Include sender's name
        payeeNote: `Fees for ${schoolName}`, // Include school name
      },
      {
        headers: {
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Content-Type": "application/json",
          Authorization: `Bearer ${paymentAccessToken}`,
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_API_SUBSCRIPTION_KEY,
        },
      }
    );

    console.log("Payment request sent. Checking status...");

    // Step 2: Wait for a few seconds before checking status (optional but recommended)
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Step 3: Get Payment Status
    const statusResponse = await axios.get(
      `${process.env.MTN_MOMO_API_BASE}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          "X-Target-Environment": "sandbox",
          Authorization: `Bearer ${paymentAccessToken}`,
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_API_SUBSCRIPTION_KEY,
        },
      }
    );

    console.log("Payment Status:", statusResponse.data);

    // Step 4: Return Payment Status to User
    res.json({
      success: true,
      successMessage: "Payment completed successfully!",
      paymentTracker: referenceId,
      data: statusResponse.data, // Now includes transaction details
    });
  } catch (error) {
    console.error(
      "Payment Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      success: false,
      errorMessage: {
        message: [
          "Payment request failed!",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
};
module.exports.fetchMomoPaymentsReceived = async (req, res) => {
  const { referenceId } = req.params;
  const paymentAccessToken = req.paymentAccessToken;
  try {
    const response = await axios.get(
      `${process.env.MTN_MOMO_API_BASE}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_API_SUBSCRIPTION_KEY,
          Authorization: `Bearer ${paymentAccessToken}`,
        },
      }
    );
    console.log(response.data);

    // Step 4: Return Payment Status to User
    res.json({
      success: true,
      successMessage: "Payments received!",
      data: response.data, // Now includes transaction details
    });
  } catch (error) {
    console.error(
      "Fetching payments received Error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      success: false,
      errorMessage: {
        message: [
          "Fetching payments received failed!",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
};
module.exports.bankPayment = async (req, res) => {
  try {
    const {
      amount,
      email,
      bankCode,
      nameOfBank,
      accountHolder,
      accountNumber,
    } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100, // Convert GHS to kobo
        recipient: {
          type: "nuban",
          name: "Student Fees",
          bank_code: bankCode,
          account_number: accountNumber,
          currency: "GHS",
        },
        reason: "School Fees Payment",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      successMessage: "Payment completed successfully!",
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      errorMessage: {
        message: [
          "Payment request failed!",
          error.response ? JSON.stringify(error.response.data) : error.message,
        ],
      },
    });
  }
};
module.exports.bankPaymentWebhook = async (req, res) => {
  console.log("Payment Notification:", req.body);
  res.sendStatus(200); // Always respond to confirm receipt
};

// FLUTTERWAVE
exports.requestFlutterWavePayment = async (req, res) => {
  try {
    const {
      amount,
      schoolName,
      paymentMethod,
      nameOfBank,
      accountHolder,
      accountNumber,
      semester,
      year,
      phoneNumber,
      enrollmentFees,
      currency,
      email,
    } = req.body;
    const txRef = `TX-${Date.now()}`;

    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref: txRef,
        amount,
        currency,
        payment_type: paymentMethod,
        redirect_url: `https://senyashs.com/payment-success`,
        customer: { email, phone_number: phoneNumber },
      },
      {
        headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
      }
    );

    // await Transaction.create({
    //   userId,
    //   amount,
    //   currency,
    //   paymentMethod,
    //   status: "pending",
    //   transactionId: txRef,
    // });
    await Payment.create({
      studentId: foundStudent?.uniqueId,
      transactionId: txRef,
      amount,
      currency,
      reference: "School Fees",
      paidVia:
        paymentMethod === "mobilemoneygh" ? "Mobile Money" : paymentMethod,
      nameOfBank,
      bankAccountHolder: accountHolder,
      bankAccountNo: accountNumber,
      semester,
      year,
      contact: phoneNumber,
      status: "pending",
    });
    res.json({ success: true, paymentLink: response.data.data.link });
  } catch (error) {
    console.log(error);

    console.error("Payment Error:", error.message);
    res
      .status(500)
      .json({ success: false, errorMessage: { message: [error.message] } });
  }
};
// FLUTTERWAVE WEBHOOK
module.exports.flutterWaveWebhook = async (req, res) => {
  try {
    const { tx_ref, status } = req.body;
    await Payment.findOneAndUpdate({ transactionId: tx_ref }, { status });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({
      success: false,
      errorMessage: { message: [error.message] },
    });
  }
};
