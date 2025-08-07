import React from "react";
// import { useAuth } from "../../contexts/authContext";
import Sidebar from "../../components/Sidebar";
import { Outlet, useLocation } from "react-router";
import SidebarSizeButton from "../../components/SidebarSizeButton";

const AdminDashboard = () => {
  // const { user } = useAuth();

  const location = useLocation().pathname;
  const locationName =
    location.split("/").pop().replace(/-/g, " ").charAt(0).toUpperCase() +
    location.split("/").pop().replace(/-/g, " ").slice(1);
  return (
    <div className="flex h-screen w-screen">
      {/* Fixed Sidebar - always visible for admins */}{" "}
      <div className="flex-shrink-0 h-full overflow-visible relative z-40">
        <Sidebar />
      </div>
      {/* Dynamic Content Area - renders child routes */}
      <div className="flex-1 flex flex-col h-full overflow-x-hidden">
        <header className="flex-shrink-0 flex sticky top-0 z-50 gap-2 p-4 bg-base-100 border-b border-base-300">
          <SidebarSizeButton />
          {/* Display current location name */}
          <h1 className="text-2xl font-bold">{locationName}</h1>
        </header>

        <div className="flex-1 p-2 bg-base-100 h-full">
          <div className="bg-base-100 rounded-md min-h-full overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
