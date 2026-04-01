const Settings = require("../models/Settings");

async function getSettings(req, res) {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      const created = await Settings.create({
        gstEnabled: false,
        gstRate: 18
      });
      return res.json(created);
    }
    return res.json(settings);
  } catch (error) {
    console.error("Load settings failed:", error);
    return res.status(500).json({ message: "Unable to load settings" });
  }
}

async function upsertSettings(req, res) {
  try {
    const gstEnabled = Boolean(req.body.gstEnabled);
    const gstRate = Number(req.body.gstRate);

    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
      return res.status(400).json({ message: "GST rate must be between 0 and 100" });
    }

    const payload = {
      gstEnabled,
      gstRate
    };

    const settings = await Settings.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    return res.json({
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Update settings failed:", error);
    return res.status(500).json({ message: "Unable to update settings" });
  }
}

module.exports = {
  getSettings,
  upsertSettings
};
