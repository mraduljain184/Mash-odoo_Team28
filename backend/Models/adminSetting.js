const mongoose = require('mongoose');

const AdminSettingSchema = new mongoose.Schema({
  // Simple singleton settings collection
  openForRequest: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('admin_setting', AdminSettingSchema);
