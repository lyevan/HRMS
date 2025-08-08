import React from "react";
import { RefreshCcw } from "lucide-react";

const RefreshButton = ({ isRefreshing, setIsRefreshing }) => {
  return (
    <button title="Refresh" className={`btn btn-sm btn-primary`} onClick={() => setIsRefreshing(!isRefreshing)}>
      <RefreshCcw size={16}/>
    </button>
  );
};

export default RefreshButton;
