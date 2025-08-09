export const capitalizeFirstLetter = (str) => {
  if (typeof str !== "string" || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeEachWord = (str) => {
  if (typeof str !== "string" || str.length === 0) return str;
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
export const truncateString = (str, length = 100) => {
  if (typeof str !== "string" || str.length <= length) return str;
  return str.slice(0, length) + "...";
};
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })} at ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
};
export const formatCurrency = (amount, currency = "PHP") => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency,
  }).format(amount);
};
export const formatPercentage = (value) => {
  return `${parseFloat(value).toFixed(2)}%`;
};
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";
  const cleaned = ("" + phoneNumber).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phoneNumber;
};
export const formatAddress = (address) => {
  if (!address) return "";
  return address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(", ");
};
export const formatFullName = (firstName, lastName) => {
  if (!firstName && !lastName) return "";
  return `${firstName ? capitalizeFirstLetter(firstName) : ""} ${
    lastName ? capitalizeFirstLetter(lastName) : ""
  }`.trim();
};
export const formatEmail = (email) => {
  if (!email) return "";
  return email.toLowerCase().trim();
};
export const formatUsername = (username) => {
  if (!username) return "";
  return username.toLowerCase().trim();
};
export const formatDepartmentName = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};
