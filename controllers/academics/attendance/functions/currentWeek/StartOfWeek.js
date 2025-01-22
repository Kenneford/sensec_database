//Function to calculate the start of the week(MONDAY)
const startOfWeek = (date) => {
  // Clone the date to avoid modifying the original
  const currentDate = new Date(date);

  // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = currentDate.getDay();

  // Calculate Monday (start of the week)
  const monday = new Date(currentDate);
  monday.setDate(currentDate.getDate() - ((dayOfWeek + 6) % 7)); // Adjust for Monday
  monday.setHours(0, 0, 0, 0); // Set to midnight

  return monday;
};
module.exports = { startOfWeek };
