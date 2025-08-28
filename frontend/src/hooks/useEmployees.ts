import { useState, useEffect } from "react";
import { fetchAllEmployees, type Employee } from "@/models/employee-model";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // parameter to bust cache or not
  const loadEmployees = async (bustCache = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAllEmployees(bustCache);
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

  // pass a parameter whether to bust cache or not
  const refetch = (bustCache = false) => {
    loadEmployees(bustCache);
  };

  return {
    employees,
    loading,
    error,
    refetch,
  };
};
