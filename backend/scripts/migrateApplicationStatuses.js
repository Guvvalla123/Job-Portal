/**
 * One-time migration: shortlisted → screening (new pipeline enum).
 * Run from backend: node scripts/migrateApplicationStatuses.js
 * Requires MONGODB_URI in env (load .env if you use dotenv in server — here use process.env only).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { Application } = require("../src/models/Application");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const res = await Application.updateMany({ status: "shortlisted" }, { $set: { status: "screening" } });
  console.log("Updated shortlisted → screening:", res.modifiedCount);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
