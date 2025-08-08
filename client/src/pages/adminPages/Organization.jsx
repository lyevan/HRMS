import React, { useState, useEffect } from "react";
import AddDepartment from "../../components/forms/AddDepartment";
import axios from "axios";

const Organization = () => {
  const [departments, setDepartments] = useState([]);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get("/departments");
        console.log(response.data);
        setDepartments(response.data.result);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Organization Management</h1>
      <p>Manage your organization’s departments here.</p>
      <button
        className="btn btn-primary"
        onClick={() => setIsDepartmentModalOpen(true)}
      >
        Add Department
      </button>
      <AddDepartment
        isModalOpen={isDepartmentModalOpen}
        setIsModalOpen={setIsDepartmentModalOpen}
      />
      <ul>
        {departments.map((department) => (
          <li key={department.id}>{department.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Organization;
