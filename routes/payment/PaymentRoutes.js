const {
  fetchFlutterWaveCurrencies,
  fetchFlutterWavePaymentMethods,
  requestFlutterWavePayment,
  flutterWaveWebhook,
} = require("../../controllers/payment/FlutterWavePaymentController");
const {
  requestPayment,
  requestMomoPayment,
  bankPayment,
  bankPaymentWebhook,
  fetchMomoPaymentsReceived,
} = require("../../controllers/payment/PaymentController");
const {
  getPaymentAccessToken,
} = require("../../middlewares/payment/paymentSystem");

const router = require("express").Router();

// FLUTTERWAVE
router.post("/flutterwave/pay_fees", requestFlutterWavePayment);
router.post("/flutterwave/webhook", flutterWaveWebhook);
router.get("/flutterwave/currencies/fetch_all", fetchFlutterWaveCurrencies);
router.get(
  "/flutterwave/payment_methods/fetch_all",
  fetchFlutterWavePaymentMethods
);

// MTN MOMO
router.post("/pay_fees", getPaymentAccessToken, requestPayment);
router.post("/pay_enrollment_fees", getPaymentAccessToken, requestPayment);
router.post("/pay-momo", getPaymentAccessToken, requestMomoPayment);
router.get(
  "/momo_transactions-received/:referenceId",
  getPaymentAccessToken,
  fetchMomoPaymentsReceived
);

// BANK TRANSFER
router.post("/pay-bank", getPaymentAccessToken, bankPayment);
router.post("/payment-webhook", bankPaymentWebhook);

module.exports = router;
