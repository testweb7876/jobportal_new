const { JobAlert } = require('../models/Misc.model');

// ─── GET ALL ALERTS ─────────────────────────────────────────
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await JobAlert.find({
      uid: req.user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      alerts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── CREATE ALERT ───────────────────────────────────────────
exports.createAlert = async (req, res) => {
  try {
    const alert = await JobAlert.create({
      ...req.body,
      uid: req.user._id,
    });

    res.status(201).json({
      success: true,
      alert,
      message: 'Job alert created successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── UPDATE ALERT ───────────────────────────────────────────
exports.updateAlert = async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndUpdate(
      {
        _id: req.params.id,
        uid: req.user._id,
      },
      req.body,
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      alert,
      message: 'Alert updated successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ─── DELETE ALERT ───────────────────────────────────────────
exports.deleteAlert = async (req, res) => {
  try {
    const alert = await JobAlert.findOneAndUpdate(
      {
        _id: req.params.id,
        uid: req.user._id,
      },
      {
        isDeleted: true,
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};