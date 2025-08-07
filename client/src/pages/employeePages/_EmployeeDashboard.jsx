import React from "react";
import { Navigate, Outlet } from "react-router";
// import { useAuth } from "../../contexts/authContext";
import Sidebar from "../../components/Sidebar";

const EmployeeDashBoard = () => {
  // const { user } = useAuth();
  return (
    <div className="flex h-screen w-screen">
      {/* Fixed Sidebar - always visible for employees */}
      
        <Sidebar />
      

      {/* Dynamic Content Area - renders child routes */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeDashBoard;
