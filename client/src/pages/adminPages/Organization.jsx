import React, { useState, useEffect } from "react";
import OrgTableByDept from "../../components/OrgTableByDept";
import axios from "axios";

const Organization = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold">Organization Management</h1>
      <p>Manage your organization’s departments here.</p>
      <OrgTableByDept />
    </div>
  );
};

export default Organization;
