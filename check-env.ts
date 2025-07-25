import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("DATABASE_URL =", process.env.DATABASE_URL);
