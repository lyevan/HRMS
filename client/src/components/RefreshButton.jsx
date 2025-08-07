import React from "react";
import { RefreshCcw } from "lucide-react";

const RefreshButton = ({ isRefreshing, setIsRefreshing }) => {
  return (
    <button
      className="btn btn-primary"
      onClick={() => setIsRefreshing(!isRefreshing)}
    >
      <RefreshCcw />
    </button>
  );
};

export default RefreshButton;
