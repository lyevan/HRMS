import { pool } from "../config/db.js";

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM departments");
    return res.status(200).json({ result: result.rows });
  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get a specific department by ID
export const getDepartment = async (req, res) => {
  const { id } = req.params;
  console.log("Fetching department with ID:", id);

  // Validate ID parameter
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ message: "Valid department ID is required" });
  }

  try {
    const result = await pool.query("SELECT * FROM departments WHERE id = $1", [
      parseInt(id),
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching department:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addDepartment = async (req, res) => {
  const { name, description = null } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Department name is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding department:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Department name is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE departments SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Department not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating department:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM departments WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Department not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting department:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
