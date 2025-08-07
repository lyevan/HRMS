import React from "react";
import useToastStore from "../store/toastStore";
import { X, CircleCheck, CircleX } from "lucide-react";

const Toast = () => {
  const { message, type, isVisible, hideToast } = useToastStore();

  if (!isVisible) return null;

  // Map alert types to specific DaisyUI classes
  const getAlertClass = (type) => {
    switch (type) {
      case "success":
        return {
          style: "alert alert-success",
          icon: <CircleCheck className="w-6 h-6 mr-2" />,
        };
      case "error":
        return {
          style: "alert alert-error",
          icon: <CircleX className="w-6 h-6 mr-2" />,
        };
      case "warning":
        return {
          style: "alert alert-warning",
          icon: <CircleWarning className="w-6 h-6 mr-2" />,
        };
      case "info":
        return {
          style: "alert alert-info",
          icon: <CircleInfo className="w-6 h-6 mr-2" />,
        };
      default:
        return "alert alert-info";
    }
  };

  return (
    <div className="toast toast-top toast-end z-9999999">
      <div className={`${getAlertClass(type).style}`}>
        {getAlertClass(type).icon}
        <span>{message}</span>
        <button
          className={`cursor-pointer`}
          onClick={() => useToastStore.getState().hideToast()}
        >
          <X />
        </button>
      </div>
    </div>
  );
};

export default Toast;
