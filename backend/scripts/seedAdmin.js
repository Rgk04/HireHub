import "../config/env.js";
import mongoose from "mongoose";
import config from "../config/env.js";
import { connectDB } from "../database/dbConnection.js";
import { User } from "../models/userSchema.js";
import { ROLES } from "../utils/constants.js";

const run = async () => {
  await connectDB();

  const { name, email, password } = config.admin;
  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      console.error(
        `The email ${email} already belongs to a ${existing.role} account. Choose another ADMIN_EMAIL.`
      );
    } else {
      console.log("Admin account already exists:");
      console.log(`  Email:    ${email}`);
      console.log("  Password: (unchanged; taken from the existing account)");
    }
  } else {
    await User.create({
      name,
      email,
      password,
      phone: "0000000000",
      role: ROLES.ADMIN,
      profile: { headline: "Platform administrator" },
    });
    console.log("Admin account created:");
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log("Change ADMIN_PASSWORD in backend/.env for production use.");
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Admin seed failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
