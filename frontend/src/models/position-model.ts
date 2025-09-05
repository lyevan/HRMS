import axios from "axios";

export type Position = {
  position_id: number;
  title: string;
  department_id: number;
  department_name?: string | null;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PositionResponse = {
  success: boolean;
  result: Position[];
};

export type CreatePositionData = {
  title: string;
  department_id: number;
  description?: string;
};

export type UpdatePositionData = Partial<Position>;

// API Functions
export const fetchAllPositions = async (): Promise<PositionResponse> => {
  try {
    const response = await axios.get("/positions");
    return {
      success: true,
      result: response.data.data || response.data.result,
    };
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
};

export const fetchPositionById = async (id: number): Promise<Position> => {
  try {
    const response = await axios.get(`/positions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching position:", error);
    throw error;
  }
};

export const fetchPositionsByDepartment = async (
  departmentId: number
): Promise<PositionResponse> => {
  try {
    const response = await axios.get(`/positions/department/${departmentId}`);
    return {
      success: true,
      result: response.data.result,
    };
  } catch (error) {
    console.error("Error fetching positions by department:", error);
    throw error;
  }
};

export const createPosition = async (
  data: CreatePositionData
): Promise<Position> => {
  try {
    const response = await axios.post("/positions", data);
    return response.data;
  } catch (error) {
    console.error("Error creating position:", error);
    throw error;
  }
};

export const updatePosition = async (
  id: number,
  data: UpdatePositionData
): Promise<Position> => {
  try {
    const response = await axios.put(`/positions/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating position:", error);
    throw error;
  }
};

export const deletePosition = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/positions/${id}`);
  } catch (error) {
    console.error("Error deleting position:", error);
    throw error;
  }
};
