import { applyGSTMigration } from "../lib/database/migrate";

async function runMigration() {
  try {
    console.log("Starting GST migration...");
    await applyGSTMigration();
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration(); 