import React from "react";
import { useUserSessionStore } from "../store/userSessionStore";
import axios from "axios";
import {
  Home,
  CalendarClock,
  CreditCard,
  IdCardLanyard,
  CalendarDays,
  ScrollText,
  Bolt,
  MessageCircleQuestion,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle2,
} from "lucide-react";
import { Navigate, useNavigate, useLocation } from "react-router";
import { useTheme } from "../store/themeStore";
import ThemeSwitcher from "./ThemeSwitcher";
import { useSidebar } from "../store/sidebarStore";
import SidebarSizeButton from "./SidebarSizeButton";
import useToastStore from "../store/toastStore";

const Sidebar = () => {
  const { user, logout } = useUserSessionStore();
  const { theme, setTheme } = useTheme();
  const { isSidebarSmall, toggleSidebar } = useSidebar();

  const navigate = useNavigate();
  const location = useLocation().pathname;
  const { showToast } = useToastStore();

  const adminLinks = [
    { name: "Home", path: "home", logo: <Home /> },
    { name: "Attendance", path: "attendance", logo: <CalendarClock /> },
    { name: "Employees", path: "employees", logo: <IdCardLanyard /> },
    { name: "Payroll", path: "payroll", logo: <CreditCard /> },
    { name: "Reports", path: "reports", logo: <ScrollText /> },
    {
      name: "Requests",
      path: "requests",
      logo: <MessageCircleQuestion />,
    },
    { name: "Schedules", path: "schedules", logo: <CalendarDays /> },
    { name: "Settings", path: "settings", logo: <Bolt /> },
  ];

  return (
    <div
      className={`relative bg-base-100 flex flex-col justify-center text-base-content h-screen pb-4 transition-all duration-75 ease-in-out border-r border-base-300 z-50 ${
        isSidebarSmall ? `w-12 px-0` : "w-48 px-4"
      }`}
    >
      {/* Brand Header */}
      <div
        className={`flex w-full flex-row gap-2 items-center py-4 border-neutral-600 ${
          isSidebarSmall ? "justify-center px-0" : "justify-start px-2"
        }`}
      >
        {isSidebarSmall ? (
          <div className="w-full h-8 flex justify-center">
            <img
              src="/emplore-dark-small.png"
              alt="Brand Logo"
              className="w-3/4 h-auto"
            />
          </div>
        ) : (
          <div className="w-full h-8 flex justify-center">
            <img src="/emplore-light.png" alt="Brand Logo" className="w-3/4" />
          </div>
        )}
      </div>

      {/* Company Header */}
      <div
        className={`flex w-full flex-row gap-2 items-center py-4 border-y border-base-300 ${
          isSidebarSmall ? "justify-center pl-0" : "pl-2"
        }`}
      >
        <UserCircle2 size={24} />
        {isSidebarSmall ? (
          ""
        ) : (
          <div className="w-auto h-full flex justify-start text-nowrap">
            "IC Solutions"
          </div>
        )}
      </div>

      {/* Container for button links */}
      <div className="flex flex-col items-center">
        <h1
          className={`text-xs text-base-content mt-2 text-nowrap  ${
            isSidebarSmall ? "px-0" : " self-start px-4"
          }`}
        >
          {isSidebarSmall ? "MENU" : "MAIN MENU"}
        </h1>
        {/* Admin Links */}
        {user?.role === "admin" && (
          <ul
            className={`text-base-content flex flex-col gap-2 pb-2 my-2 border-b border-base-300 ${
              isSidebarSmall ? "w-12 items-center" : "w-full"
            }`}
          >
            {adminLinks.map((link) => {
              const isActive = location.includes("/" + link.path);
              return (
                <li
                  key={link.name}
                  className={isSidebarSmall ? "tooltip tooltip-right" : ""}
                  data-tip={link.name}
                >
                  <div
                    onClick={() => !isActive && navigate(link.path)}
                    className={`flex flex-row items-center cursor-pointer py-1 hover:bg-primary hover:text-primary-content rounded text-sm ${
                      isSidebarSmall
                        ? "justify-center gap-0 p-2"
                        : "justify-start gap-2 p-2"
                    }${
                      isActive
                        ? " bg-primary text-primary-content pointer-events-none"
                        : ""
                    }`}
                  >
                    {link.logo}
                    <span className={isSidebarSmall ? "hidden" : ""}>
                      {link.name}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Employee Links */}
        {user?.role === "employee" && <div>Employee Links</div>}
      </div>

      {/* Container for logout button */}
      <div className="flex-1 flex flex-col justify-start">
        {" "}
        <button
          className={
            isSidebarSmall
              ? "tooltip items-end tooltip-right tooltip-error text-error-content w-full p-1 z-[60]"
              : ""
          }
          data-tip="Logout"
        >
          <div
            className={`flex rounded px-2 cursor-pointer text-base-content hover:bg-error hover:text-error-content py-1 gap-2 w-full font-montserrat items-center font-medium text-sm ${
              isSidebarSmall ? "justify-center" : "justify-center p-0"
            }`}
            onClick={() => {
              showToast("Logged out successfully", "success");
              logout();
            }}
          >
            <LogOut />

            {isSidebarSmall ? "" : "Logout"}
          </div>
        </button>
      </div>

      <div className="flex justify-center">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default Sidebar;
