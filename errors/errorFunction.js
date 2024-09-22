// Simulate async function that throws an error
const handleErrorFunction = async (err) => {
  console.log(err);

  throw new Error(err);
};

module.exports = { handleErrorFunction };
