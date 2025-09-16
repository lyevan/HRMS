export interface Holiday {
  holiday_id: number;
  name: string;
  date: string;
  holiday_type: "regular" | "special";
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHolidayRequest {
  name: string;
  date: string;
  holiday_type: "regular" | "special";
  description?: string;
}

export interface UpdateHolidayRequest {
  name?: string;
  date?: string;
  holiday_type?: "regular" | "special";
  description?: string;
  is_active?: boolean;
}

export interface HolidaysResponse {
  success: boolean;
  message: string;
  data: Holiday[];
}

export interface HolidayResponse {
  success: boolean;
  message: string;
  data: Holiday;
}

// API Functions
export const fetchAllHolidays = async (): Promise<Holiday[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/holidays", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: HolidaysResponse = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to fetch holidays");
  }

  return result.data;
};

export const fetchCurrentYearHolidays = async (): Promise<Holiday[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/holidays/current-year", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: HolidaysResponse = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to fetch current year holidays");
  }

  return result.data;
};

export const fetchUpcomingHolidays = async (): Promise<Holiday[]> => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/holidays/upcoming", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: HolidaysResponse = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to fetch upcoming holidays");
  }

  return result.data;
};

export const createHoliday = async (
  holidayData: CreateHolidayRequest
): Promise<Holiday> => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/holidays", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(holidayData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: HolidayResponse = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to create holiday");
  }

  return result.data;
};

export const updateHoliday = async (
  holidayId: number,
  holidayData: UpdateHolidayRequest
): Promise<Holiday> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`/api/holidays/${holidayId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(holidayData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result: HolidayResponse = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to update holiday");
  }

  return result.data;
};

export const deleteHoliday = async (holidayId: number): Promise<void> => {
  const token = localStorage.getItem("token");
  const response = await fetch(`/api/holidays/${holidayId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to delete holiday");
  }
};

export const initializePhilippineHolidays = async (): Promise<any> => {
  const token = localStorage.getItem("token");
  const response = await fetch("/api/holidays/initialize-philippine", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(
      result.message || "Failed to initialize Philippine holidays"
    );
  }

  return result.data;
};
