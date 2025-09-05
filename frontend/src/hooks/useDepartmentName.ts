import { useState, useEffect } from "react";
import { useFetchDepartmentNameById } from "@/store/departmentStore";

/**
 * Custom hook to fetch and cache department names by ID
 * @param departmentId - The ID of the department to fetch
 * @returns The department name or null if not found/loading
 */
export const useDepartmentName = (departmentId: number | null | undefined) => {
  const [departmentName, setDepartmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchDepartmentNameById = useFetchDepartmentNameById();

  useEffect(() => {
    if (!departmentId) {
      setDepartmentName(null);
      return;
    }

    let mounted = true;
    setLoading(true);

    const fetchName = async () => {
      try {
        const name = await fetchDepartmentNameById(departmentId);
        if (mounted) {
          setDepartmentName(name);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching department name:", error);
        if (mounted) {
          setDepartmentName(null);
          setLoading(false);
        }
      }
    };

    fetchName();

    return () => {
      mounted = false;
    };
  }, [departmentId, fetchDepartmentNameById]);

  return { departmentName, loading };
};
