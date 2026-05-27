import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const db = new pg.Client({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "movies",
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 5432),
});

db.connect().catch(err => console.error("Database connection error", err.stack));

export default db;