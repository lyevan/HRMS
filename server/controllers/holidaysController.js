import { pool } from "../config/db.js";

// Get all active holidays
export const getAllHolidays = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        holiday_id,
        name,
        date,
        holiday_type,
        description,
        is_active
      FROM holidays 
      WHERE is_active = true
      ORDER BY date ASC
    `);

    res.status(200).json({
      success: true,
      message: "Holidays retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching holidays:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch holidays",
      error: error.message,
    });
  }
};

// Get holidays for current year
export const getCurrentYearHolidays = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const result = await pool.query(
      `
      SELECT 
        holiday_id,
        name,
        date,
        holiday_type,
        description,
        is_active
      FROM holidays 
      WHERE is_active = true 
        AND EXTRACT(YEAR FROM date) = $1
      ORDER BY date ASC
    `,
      [currentYear]
    );

    res.status(200).json({
      success: true,
      message: "Current year holidays retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching current year holidays:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current year holidays",
      error: error.message,
    });
  }
};

// Get upcoming holidays (next 30 days)
export const getUpcomingHolidays = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        holiday_id,
        name,
        date,
        holiday_type,
        description,
        is_active
      FROM holidays 
      WHERE is_active = true 
        AND date >= CURRENT_DATE 
        AND date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY date ASC
    `);

    res.status(200).json({
      success: true,
      message: "Upcoming holidays retrieved successfully",
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching upcoming holidays:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming holidays",
      error: error.message,
    });
  }
};

// Create a new holiday
export const createHoliday = async (req, res) => {
  try {
    const { name, date, holiday_type, description } = req.body;

    // Validate required fields
    if (!name || !date || !holiday_type) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, date, and holiday_type are required",
      });
    }

    // Validate holiday_type
    if (!["regular", "special"].includes(holiday_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday_type. Must be 'regular' or 'special'",
      });
    }

    const result = await pool.query(
      `INSERT INTO holidays (name, date, holiday_type, description) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, date, holiday_type, description || null]
    );

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating holiday:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A holiday already exists for this date",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create holiday",
      error: error.message,
    });
  }
};

// Update a holiday
export const updateHoliday = async (req, res) => {
  try {
    const { holiday_id } = req.params;
    const { name, date, holiday_type, description, is_active } = req.body;

    // Check if holiday exists
    const existingHoliday = await pool.query(
      "SELECT holiday_id FROM holidays WHERE holiday_id = $1",
      [holiday_id]
    );

    if (existingHoliday.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    // Validate holiday_type if provided
    if (holiday_type && !["regular", "special"].includes(holiday_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday_type. Must be 'regular' or 'special'",
      });
    }

    const result = await pool.query(
      `UPDATE holidays 
       SET name = COALESCE($1, name),
           date = COALESCE($2, date),
           holiday_type = COALESCE($3, holiday_type),
           description = COALESCE($4, description),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE holiday_id = $6
       RETURNING *`,
      [name, date, holiday_type, description, is_active, holiday_id]
    );

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating holiday:", error);

    // Handle unique constraint violation
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A holiday already exists for this date",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update holiday",
      error: error.message,
    });
  }
};

// Delete a holiday
export const deleteHoliday = async (req, res) => {
  try {
    const { holiday_id } = req.params;

    // Check if holiday exists
    const existingHoliday = await pool.query(
      "SELECT holiday_id FROM holidays WHERE holiday_id = $1",
      [holiday_id]
    );

    if (existingHoliday.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    await pool.query("DELETE FROM holidays WHERE holiday_id = $1", [
      holiday_id,
    ]);

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting holiday:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete holiday",
      error: error.message,
    });
  }
};

// Initialize default Philippine holidays for current year
export const initializePhilippineHolidays = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const philippineHolidays = [
      {
        name: "New Year's Day",
        date: `${currentYear}-01-01`,
        type: "regular",
        description: "Beginning of the calendar year",
      },
      {
        name: "EDSA People Power Revolution Anniversary",
        date: `${currentYear}-02-25`,
        type: "special",
        description: "Commemoration of the 1986 EDSA Revolution",
      },
      {
        name: "Maundy Thursday",
        date: `${currentYear}-03-28`,
        type: "regular",
        description: "Holy Week observance",
      },
      {
        name: "Good Friday",
        date: `${currentYear}-03-29`,
        type: "regular",
        description: "Holy Week observance",
      },
      {
        name: "Black Saturday",
        date: `${currentYear}-03-30`,
        type: "special",
        description: "Holy Week observance",
      },
      {
        name: "Araw ng Kagitingan",
        date: `${currentYear}-04-09`,
        type: "regular",
        description: "Day of Valor",
      },
      {
        name: "Labor Day",
        date: `${currentYear}-05-01`,
        type: "regular",
        description: "International Workers' Day",
      },
      {
        name: "Independence Day",
        date: `${currentYear}-06-12`,
        type: "regular",
        description: "Philippine Independence Day",
      },
      {
        name: "National Heroes Day",
        date: `${currentYear}-08-26`,
        type: "regular",
        description: "Honor for Filipino heroes",
      },
      {
        name: "All Saints' Day",
        date: `${currentYear}-11-01`,
        type: "special",
        description: "Catholic observance",
      },
      {
        name: "Bonifacio Day",
        date: `${currentYear}-11-30`,
        type: "regular",
        description: "Birth anniversary of Andres Bonifacio",
      },
      {
        name: "Immaculate Conception",
        date: `${currentYear}-12-08`,
        type: "special",
        description: "Catholic observance",
      },
      {
        name: "Christmas Day",
        date: `${currentYear}-12-25`,
        type: "regular",
        description: "Celebration of the birth of Jesus Christ",
      },
      {
        name: "Rizal Day",
        date: `${currentYear}-12-30`,
        type: "regular",
        description: "Death anniversary of Jose Rizal",
      },
    ];

    const insertPromises = philippineHolidays.map((holiday) =>
      pool.query(
        `INSERT INTO holidays (name, date, holiday_type, description) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (date) DO NOTHING
         RETURNING *`,
        [holiday.name, holiday.date, holiday.type, holiday.description]
      )
    );

    const results = await Promise.all(insertPromises);
    const createdHolidays = results.filter((result) => result.rows.length > 0);

    res.status(200).json({
      success: true,
      message: `Successfully initialized ${createdHolidays.length} Philippine holidays for ${currentYear}`,
      data: {
        year: currentYear,
        holidaysCreated: createdHolidays.length,
        totalHolidays: philippineHolidays.length,
      },
    });
  } catch (error) {
    console.error("Error initializing Philippine holidays:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initialize Philippine holidays",
      error: error.message,
    });
  }
};
