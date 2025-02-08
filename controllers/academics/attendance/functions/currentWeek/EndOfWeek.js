const {
  formatDate,
} = require("../../../../../middlewares/dateFormatter/dateFormatter");

//Function to calculate the end of the week(MONDAY)
const endOfWeek = (date) => {
  // Clone the date to avoid modifying the original
  const currentDate = new Date(date);

  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = currentDate.getDay();
  // console.log("dayOfWeek: ", dayOfWeek);

  // Calculate Monday (start of the week)
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust for Monday
  monday.setHours(0, 0, 0, 0); // Set to midnight
  // console.log("Monday Start: ", formatDate(monday));

  // Calculate Sunday (end of the week)
  const sunday = new Date(currentDate);
  sunday.setDate(monday.getDate() + 6); // Add 6 days to get Sunday
  // console.log("sunday: ", sunday);
  sunday.setHours(23, 59, 59, 999); // Set to end of the day
  // console.log("Sunday End: ", formatDate(sunday));

  return formatDate(sunday);
};
module.exports = { endOfWeek };
