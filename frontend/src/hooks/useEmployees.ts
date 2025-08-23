import { useState, useEffect } from "react";
import { fetchAllEmployees, type Employee } from "@/models/employee-model";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllEmployees();
      setEmployees(response.results);
    } catch (err) {
      setError("Failed to fetch employees");
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return {
    employees,
    loading,
    error,
    refetch: loadEmployees,
  };
};
