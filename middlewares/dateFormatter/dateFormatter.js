// Helper function to format a date as "DD/MM/YYYY"
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0"); // Ensure 2 digits
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2 digits (month is 0-indexed)
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
module.exports = { formatDate };
