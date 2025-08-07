import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebar } from "../store/sidebarStore";

const SidebarSizeButton = () => {
  const { isSidebarSmall, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="flex justify-center items-center rounded"
    >
      {isSidebarSmall ? (
        <PanelLeftOpen size={16} />
      ) : (
        <PanelLeftClose size={16} />
      )}
    </button>
  );
};

export default SidebarSizeButton;
