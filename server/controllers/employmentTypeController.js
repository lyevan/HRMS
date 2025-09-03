import { pool } from "../config/db.js";

export const getAllEmploymentTypes = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM employment_types");
    res.json({
      success: true,
      result: result.rows,
    });
  } catch (error) {
    console.error("Error fetching employment types:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching employment types",
      error: error.message,
    });
  }
};
