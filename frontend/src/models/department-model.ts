import axios from "axios";

export type Department = {
  department_id: number;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DepartmentResponse = {
  success: boolean;
  result: Department[];
};

export type CreateDepartmentData = {
  name: string;
  description?: string;
};

export type UpdateDepartmentData = Partial<Department>;

// API Functions
export const fetchAllDepartments = async (): Promise<DepartmentResponse> => {
  try {
    const response = await axios.get("/departments");
    return {
      success: true,
      result: response.data.result,
    };
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

export const fetchDepartmentById = async (id: number): Promise<Department> => {
  try {
    const response = await axios.get(`/departments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching department:", error);
    throw error;
  }
};

export const createDepartment = async (
  data: CreateDepartmentData
): Promise<Department> => {
  try {
    const response = await axios.post("/departments", data);
    return response.data;
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
};

export const updateDepartment = async (
  id: number,
  data: UpdateDepartmentData
): Promise<Department> => {
  try {
    const response = await axios.put(`/departments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
};

export const deleteDepartment = async (id: number): Promise<void> => {
  try {
    await axios.delete(`/departments/${id}`);
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
};
