export const capitalizeFirstLetter = (str: string) => {
  if (!str) return "--";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const toTitleCase = (str: string) => {
  if (!str) return str;
  return str
    .split(" ")
    .map((word) => capitalizeFirstLetter(word))
    .join(" ");
};

export const truncateString = (str: string, num: number) => {
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
};

export const getAge = (dateString: string | null) => {
  if (!dateString) return "--";
  const today = new Date();
  const birthDate = new Date(dateString);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1;
  }
  return age;
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return "--";
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
export const formatDateShort = (dateString: string | null) => {
  if (!dateString) return "--";
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatMoney = (amount: number | null) => {
  console.log("Formatting amount:", amount);
  if (amount === null || amount === undefined) return "--";
  // Convert amount to string
  const amountStr = amount.toString();
  // Format every 3 digits with comma and 2 decimal places
  return amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// ! GOVT NUMBERS FORMATTING

export const formatSSSNumber = (sssNumber: string | null) => {
  if (!sssNumber) return "--";
  // Assuming SSS number format is "XX-XXXXXXX-X"
  const cleaned = sssNumber.replace(/[^0-9]/g, "");
  if (cleaned.length !== 10) return sssNumber; // Return original if not 10 digits
  return `${cleaned.slice(0, 2)} - ${cleaned.slice(2, 9)} - ${cleaned.slice(
    9
  )}`;
};

export const formatPhilhealthNumber = (philhealthNumber: string | null) => {
  if (!philhealthNumber) return "--";
  // Assuming PhilHealth number format is "XX-XXXXXXXXX-X"
  const cleaned = philhealthNumber.replace(/[^0-9]/g, "");
  if (cleaned.length !== 12) return philhealthNumber; // Return original if not 12 digits
  return `${cleaned.slice(0, 2)} - ${cleaned.slice(2, 11)} - ${cleaned.slice(
    11
  )}`;
};

export const formatHDMFNumber = (hdmfNumber: string | null) => {
  if (!hdmfNumber) return "--";
  // Assuming HDMF number format is "XXXX-XXXX-XXXX"
  const cleaned = hdmfNumber.replace(/[^0-9]/g, "");
  if (cleaned.length !== 12) return hdmfNumber; // Return original if not 12 digits
  return `${cleaned.slice(0, 4)} - ${cleaned.slice(4, 8)} - ${cleaned.slice(
    8
  )}`;
};

export const formatTINNumber = (tinNumber: string | null) => {
  if (!tinNumber) return "--";
  // Assuming TIN number format is "XXX-XXX-XXX-XXX"
  const cleaned = tinNumber.replace(/[^0-9]/g, "");
  if (cleaned.length !== 12) return tinNumber; // Return original if not 12 digits
  return `${cleaned.slice(0, 3)} - ${cleaned.slice(3, 6)} - ${cleaned.slice(
    6,
    9
  )} - ${cleaned.slice(9)}`;
};
