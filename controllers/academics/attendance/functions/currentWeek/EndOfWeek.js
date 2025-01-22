//Function to calculate the end of the week(MONDAY)
const endOfWeek = (date) => {
  // Clone the date to avoid modifying the original
  const currentDate = new Date(date);

  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = currentDate.getDay();

  // Calculate Monday (start of the week)
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - ((dayOfWeek + 6) % 7)); // Adjust for Monday
  monday.setHours(0, 0, 0, 0); // Set to midnight

  // Calculate Friday (end of the week)
  const friday = new Date(currentDate);
  friday.setDate(monday.getDate() + 4); // Add 4 days to get Friday
  friday.setHours(23, 59, 59, 999); // Set to end of the day

  return friday;
};
module.exports = { endOfWeek };
