import React, { useState, useEffect } from "react";
import axios from "axios";
import AddDepartment from "./forms/AddDepartment";
import { Plus, Building } from "lucide-react";
import Select from "./forms/Select";
import { capitalizeEachWord } from "../utils/stringUtils";
import LoadingSpinner from "./LoadingSpinner";
import AddPosition from "./forms/AddPosition";

const OrgTableByDept = () => {
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/departments");
        console.log(response.data);
        setDepartments(response.data.result);
      } catch (error) {
        console.error("Error fetching departments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [isDepartmentModalOpen]);

  useEffect(() => {
    const fetchPositions = async () => {
      setPositions([]);
      if (!selectedDepartment) return;

      try {
        setIsLoading(true);
        const response = await axios.get(
          `positions/department/${selectedDepartment}`
        );
        console.log(response.data);
        setPositions(response.data.result);
      } catch (error) {
        console.error("Error fetching positions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, [selectedDepartment, isPositionModalOpen]);

  return (
    <div>
      <section className="flex items-center gap-2 mb-4">
        <Select
          width="17rem"
          icon={<Building />}
          label=""
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          placeholder="Select Department"
          options={
            isLoading
              ? [{ value: "", label: "Loading..." }]
              : departments.map((dept) => ({
                  value: dept.id,
                  label: capitalizeEachWord(dept.name),
                }))
          }
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setIsDepartmentModalOpen(true)}
        >
          <Plus size={24} />
        </button>
      </section>
      <AddDepartment
        isModalOpen={isDepartmentModalOpen}
        setIsModalOpen={setIsDepartmentModalOpen}
      />
      <AddPosition
        isModalOpen={isPositionModalOpen}
        setIsModalOpen={setIsPositionModalOpen}
        department={departments.find((dept) => dept.id === selectedDepartment)}
      />
      <table className="table">
        <thead>
          <tr>
            <th className="bg-base-200 space-x-3 flex items-center">
              <span className="text-sm font-medium">Positions</span>
              <button
                disabled={!selectedDepartment}
                hidden={!selectedDepartment}
                className="btn btn-primary btn-xs"
                onClick={() => setIsPositionModalOpen(true)}
              >
                <Plus size={16} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {selectedDepartment ? (
            isLoading ? (
              <tr>
                <td className="text-center h-32">
                  <LoadingSpinner />
                </td>
              </tr>
            ) : (
              <tr>
                <td>
                  {positions?.length > 0 ? (
                    positions?.map((position) => (
                      <div key={position.id}>
                        {capitalizeEachWord(position.name)}
                      </div>
                    ))
                  ) : (
                    <div>No positions available</div>
                  )}
                </td>
              </tr>
            )
          ) : (
            <tr className="colspan-1 text-center h-120">
              <td>Select a department first to view available positions</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrgTableByDept;
