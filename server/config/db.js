// db.js or database.js
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT } = process.env;

export const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: PGPORT,
});

export async function initDB() {
  try {
    const version = await pool.query(`
    SELECT VERSION();
    `);
    console.log(
      "\n\x1b[32m%s\x1b[0m %s",
      "✅ Database initialized successfully:",
      version.rows[0].version.split("on")[0].trim()
    );
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "🔴  Error initializing database:",
      error.message
    );
    console.error(
      "\x1b[33m%s\x1b[0m",
      "⚠️  Please check your database connection settings in the .env file."
    );
  }
}
