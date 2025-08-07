// Helper function to get Philippine time
export const getPhilippineTime = () => {
  const now = new Date();
  const phTime = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const date = `${phTime.find((p) => p.type === "year").value}-${
    phTime.find((p) => p.type === "month").value
  }-${phTime.find((p) => p.type === "day").value}`;
  const time = `${phTime.find((p) => p.type === "hour").value}:${
    phTime.find((p) => p.type === "minute").value
  }:${phTime.find((p) => p.type === "second").value}`;

  return { date, time };
};