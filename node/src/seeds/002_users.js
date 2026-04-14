const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Inserts seed entries
  await knex("users").insert([
    {
      id: 1,
      email: "admin@finance.com",
      password: hashedPassword,
      roleid: 1, // admin role
      status: "active",
    },
  ]);
};
