const axios = require("axios");
const User = require("../../models/user/UserModel");
const PlacementStudent = require("../../models/PlacementStudent/PlacementStudentModel");
// Generate Access Token
async function getPaymentAccessToken(req, res, next) {
  const data = req.body;
  try {
    const enrolledStudent = await User.findOne({ uniqueId: data?.studentId });
    const placementStudent = await PlacementStudent.findOne({
      jhsIndexNo: data?.studentId,
    });
    const foundStudent = enrolledStudent || placementStudent;
    if (!foundStudent) {
      return res.status(404).json({
        errorMessage: {
          message: ["Student not found!"],
        },
      });
    }
    const response = await axios.post(
      `${process.env.MTN_MOMO_API_BASE}/collection/token/`,
      {},
      {
        headers: {
          "Ocp-Apim-Subscription-Key":
            process.env.MTN_MOMO_API_SUBSCRIPTION_KEY,
          "X-Target-Environment": process.env.MTN_MOMO_API_ENVIRONMENT,
          Authorization: `Basic ${Buffer.from(
            `${process.env.MTN_MOMO_API_USER}:${process.env.MTN_MOMO_API_KEY}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response) {
      req.paymentRequestData = {
        foundStudent,
        paymentAccessToken: response.data.access_token,
      };
      next();
    } else {
      return res.status(404).json({
        errorMessage: {
          message: [`Payment request failed!`],
        },
      });
    }
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      errorMessage: {
        message: ["Internal Server Error!", error?.message],
      },
    });
  }
}

module.exports = { getPaymentAccessToken };
