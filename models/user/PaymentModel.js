const mongoose = require("mongoose");

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    studentId: { type: String, require: true },
    email: { type: String, require: true },
    transactionId: { type: String, require: true },
    amount: { type: Number, require: true },
    reference: {
      type: String,
      enum: ["Enrolment", "Report"],
    },
    semester: { type: String },
    currency: { type: String, require: true },
    year: { type: String, require: true },
    phoneNumber: { type: String, require: true },
    provider: {
      type: String,
      enum: ["MTN", "AirtelTigo", "Telecel/Vodafone"],
      require: true,
    },
    // paidVia: {
    //   type: String,
    //   enum: ["Mobile Money", "Bank Transfer", "Card Transfer"],
    //   require: true,
    // },
    // nameOfBank: {
    //   type: String,
    //   require: this?.paidVia === "Bank Transfer" ? true : false,
    // },
    // bankAccountNo: {
    //   type: String,
    //   require: this?.paidVia === "Bank Transfer" ? true : false,
    // },
    // bankAccountHolder: {
    //   type: String,
    //   require: this?.paidVia === "Bank Transfer" ? true : false,
    // },
    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
