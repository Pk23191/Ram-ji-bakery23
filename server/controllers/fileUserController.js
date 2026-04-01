const path = require("path");
const { readJson, writeJson } = require("../utils/fileStore");

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

async function listUsers(req, res) {
  try {
    const users = await readJson(USERS_FILE, []);
    return res.json(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "customer",
        emailVerified: Boolean(user.emailVerified)
      }))
    );
  } catch (error) {
    console.error("List users failed:", error);
    return res.status(500).json({ message: "Unable to load users" });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const users = await readJson(USERS_FILE, []);
    const existing = users.find((user) => user.id === userId);

    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    const filtered = users.filter((user) => user.id !== userId);
    await writeJson(USERS_FILE, filtered);
    return res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Delete user failed:", error);
    return res.status(500).json({ message: "Unable to delete user" });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = req.params.id;
    const role = ["customer", "admin"].includes(req.body.role) ? req.body.role : "customer";
    const users = await readJson(USERS_FILE, []);
    const index = users.findIndex((user) => user.id === userId);

    if (index < 0) {
      return res.status(404).json({ message: "User not found" });
    }

    users[index] = {
      ...users[index],
      role,
      updatedAt: new Date().toISOString()
    };

    await writeJson(USERS_FILE, users);
    return res.json({ message: "User role updated", user: users[index] });
  } catch (error) {
    console.error("Update user role failed:", error);
    return res.status(500).json({ message: "Unable to update user role" });
  }
}

module.exports = {
  listUsers,
  deleteUser,
  updateUserRole
};
