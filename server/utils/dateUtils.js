import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Business timezone - configurable for different deployments
const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || "Asia/Manila";

// Deployment environment logging
// console.log(
//   `🌍 Date Utils Initialized - Business Timezone: ${BUSINESS_TIMEZONE}`
// );
// console.log(
//   `📍 Server Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`
// );
// console.log(`⏰ Server Time: ${new Date().toISOString()}`);
// console.log(`🏢 Business Time: ${dayjs().tz(BUSINESS_TIMEZONE).format()}`);

/**
 * Normalize any date input to business timezone date string (YYYY-MM-DD)
 * Works regardless of frontend, backend, or database server locations
 */
export const normalizeToBusinessDate = (dateInput) => {
  if (!dateInput) return null;

  try {
    // Handle ISO datetime strings (from frontend) - most common case
    if (typeof dateInput === "string" && dateInput.includes("T")) {
      return dayjs(dateInput).tz(BUSINESS_TIMEZONE).format("YYYY-MM-DD");
    }

    // Handle date-only strings or Date objects
    return dayjs(dateInput).format("YYYY-MM-DD");
  } catch (error) {
    console.error(`❌ Date normalization error for input: ${dateInput}`, error);
    return null;
  }
};

/**
 * Normalize time_in/time_out to business timezone datetime
 * Works regardless of server deployment locations
 */
export const normalizeToBusinessDateTime = (datetimeInput) => {
  if (!datetimeInput) return null;

  try {
    return dayjs(datetimeInput)
      .tz(BUSINESS_TIMEZONE)
      .format("YYYY-MM-DD HH:mm:ss");
  } catch (error) {
    console.error(
      `❌ DateTime normalization error for input: ${datetimeInput}`,
      error
    );
    return null;
  }
};

/**
 * Get current business date (for comparisons)
 * Always returns business timezone date regardless of server location
 */
export const getCurrentBusinessDate = () => {
  return dayjs().tz(BUSINESS_TIMEZONE).format("YYYY-MM-DD");
};

/**
 * Get current business datetime
 * Always returns business timezone datetime regardless of server location
 */
export const getCurrentBusinessDateTime = () => {
  return dayjs().tz(BUSINESS_TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * Convert any datetime to business timezone for database storage
 * Ensures consistent timezone handling across all deployments
 */
export const convertToBusinessTimezone = (datetimeInput) => {
  if (!datetimeInput) return null;

  try {
    // Return ISO string with business timezone offset
    return dayjs(datetimeInput).tz(BUSINESS_TIMEZONE).toISOString();
  } catch (error) {
    console.error(
      `❌ Timezone conversion error for input: ${datetimeInput}`,
      error
    );
    return null;
  }
};

// Legacy aliases for backward compatibility
export const normalizeToPhilippineDate = normalizeToBusinessDate;
export const normalizeToPhilippineDateTime = normalizeToBusinessDateTime;
export const getCurrentPhilippineDate = getCurrentBusinessDate;
export const getCurrentPhilippineDateTime = getCurrentBusinessDateTime;

/**
 * Extract date from datetime field in database
 * Use this for queries that need to compare dates regardless of time
 */
export const extractDateFromDateTime = (datetimeField) => {
  return `DATE(${datetimeField} AT TIME ZONE '${BUSINESS_TIMEZONE}')`;
};

/**
 * Create date range query conditions for PostgreSQL
 * Returns parameterized query parts for safe date filtering
 */
export const createDateRangeQuery = (
  startDate,
  endDate,
  dateColumn = "date"
) => {
  const normalizedStart = normalizeToBusinessDate(startDate);
  const normalizedEnd = normalizeToBusinessDate(endDate);

  return {
    condition: `${dateColumn}::date BETWEEN $1 AND $2`,
    params: [normalizedStart, normalizedEnd],
    startDate: normalizedStart,
    endDate: normalizedEnd,
  };
};

/**
 * Create datetime range query for time_in/time_out comparisons
 */
export const createDateTimeRangeQuery = (
  startDate,
  endDate,
  timeColumn = "time_in"
) => {
  const startOfDay = dayjs(startDate)
    .tz(BUSINESS_TIMEZONE)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  const endOfDay = dayjs(endDate)
    .tz(BUSINESS_TIMEZONE)
    .endOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  return {
    condition: `${timeColumn} AT TIME ZONE '${BUSINESS_TIMEZONE}' BETWEEN $1 AND $2`,
    params: [startOfDay, endOfDay],
    startDateTime: startOfDay,
    endDateTime: endOfDay,
  };
};

/**
 * Debug: Compare different date formats for troubleshooting
 */
export const debugDateFormats = (inputDate, label = "Date") => {
  console.log(`🔍 [DATE DEBUG] ${label}:`);
  console.log(`  - Input: ${inputDate}`);
  console.log(`  - Type: ${typeof inputDate}`);
  console.log(`  - UTC: ${dayjs(inputDate).utc().format()}`);
  console.log(
    `  - Business Time: ${dayjs(inputDate).tz(BUSINESS_TIMEZONE).format()}`
  );
  console.log(`  - Normalized Date: ${normalizeToBusinessDate(inputDate)}`);
  console.log(
    `  - Normalized DateTime: ${normalizeToBusinessDateTime(inputDate)}`
  );
};
