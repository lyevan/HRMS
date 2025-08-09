import { pool } from "../config/db.js";

export const getAllPositions = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM positions");
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching positions",
      error: error.message,
    });
  }
};

export const getAllPositionsByDepartment = async (req, res) => {
  const { deptId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM positions WHERE department_id = $1",
      [deptId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No positions found for this department",
      });
    }
    res.json({
      success: true,
      result: result.rows,
    });
  } catch (error) {
    console.error("Error fetching positions by department:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching positions by department",
      error: error.message,
    });
  }
};

export const getPositionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM positions WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }
    res.json({
      success: true,
      results: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching position by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching position by ID",
      error: error.message,
    });
  }
};

export const addPosition = async (req, res) => {
  const { name, department_id, description = null } = req.body;
  if (!name || !department_id) {
    return res.status(400).json({
      success: false,
      message: "Position name and department ID are required",
    });
  }
  try {
    const result = await pool.query(
      "INSERT INTO positions (name, department_id, description) VALUES ($1, $2, $3) RETURNING *",
      [name, department_id, description]
    );
    res.status(201).json({
      success: true,
      results: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding position:", error);
    res.status(500).json({
      success: false,
      message: "Error adding position",
      error: error.message,
    });
  }
};

export const updatePosition = async (req, res) => {
  const { id } = req.params;
  const { title, department_id } = req.body;
  try {
    const result = await pool.query(
      "UPDATE positions SET title = $1, department_id = $2 WHERE id = $3 RETURNING *",
      [title, department_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }
    res.json({
      success: true,
      results: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating position:", error);
    res.status(500).json({
      success: false,
      message: "Error updating position",
      error: error.message,
    });
  }
};

export const deletePosition = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM positions WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found",
      });
    }
    res.json({
      success: true,
      message: "Position deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting position:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting position",
      error: error.message,
    });
  }
};
