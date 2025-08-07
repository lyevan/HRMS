import React, { useState } from "react";
import axios from "axios";
// import { useAuth } from "../contexts/authContext";

const CreateAccountForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    username: "",
    password: "",
    email: "",
    role: "employee", // Default role
  });

  // const { token } = useAuth();
  const handleCreate = async () => {
    console.log(token);
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(
        "/users/",
        {
          username: data.username,
          password: data.password,
          email: data.email,
          role: data.role,
        },
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );
      console.log("Account created:", response.data);
    } catch (error) {
      console.error("Account creation failed:", error);
      setError("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-5/6 p-4">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <form
          className="form-control w-full max-w-xs flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <label className="label">Username</label>
          <input
            type="text"
            className="input"
            placeholder="Username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
            disabled={isLoading}
          />

          <label className="label">Password</label>
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            disabled={isLoading}
          />

          <label className="label">Email</label>
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            disabled={isLoading}
          />

          <label className="label">Role</label>
          <select
            className="select"
            value={data.role}
            onChange={(e) => setData({ ...data, role: e.target.value })}
            disabled={isLoading}
          >
            <option value="employee">Employee</option>
            <option value="admin">Admin</option>
          </select>

          {error && <div className="text-error text-sm">{error}</div>}

          <button
            type="submit"
            className="btn btn-neutral mt-4 w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </fieldset>
    </div>
  );
};

export default CreateAccountForm;
