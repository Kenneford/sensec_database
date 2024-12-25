const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers.authorization?.split(" ")[1];
  if (apiKey !== process.env.SHARED_API_KEY) {
    return res.status(403).json({ message: "Unauthorized access!" });
  }
  next();
};

module.exports = { verifyApiKey };
