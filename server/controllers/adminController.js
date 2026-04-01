const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

async function getAdmins(req, res) {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });
    return res.json(admins);
  } catch (error) {
    console.error("Get admins failed:", error);
    return res.status(500).json({ message: "Unable to load admins" });
  }
}

async function createAdmin(req, res) {
  try {
    const { email, password, role = "admin" } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!["admin", "superadmin"].includes(role)) {
      return res.status(400).json({ message: "Role must be admin or superadmin" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);
    const admin = await Admin.create({
      email: normalizedEmail,
      password: passwordHash,
      role
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin: {
        _id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Create admin failed:", error);
    return res.status(500).json({ message: "Unable to create admin" });
  }
}

async function deleteAdmin(req, res) {
  try {
    const adminId = req.params.id;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (String(admin._id) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot remove your own account" });
    }

    if (admin.role === "superadmin") {
      return res.status(400).json({ message: "Superadmin cannot be removed from this screen" });
    }

    await Admin.findByIdAndDelete(adminId);

    return res.json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Delete admin failed:", error);
    return res.status(500).json({ message: "Unable to remove admin" });
  }
}

module.exports = {
  getAdmins,
  createAdmin,
  deleteAdmin
};
