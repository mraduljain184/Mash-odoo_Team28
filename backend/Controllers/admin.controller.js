const Service = require('../Models/service');
const AdminSetting = require('../Models/adminSetting');

exports.listServiceRequests = async (req, res, next) => {
  try {
    const docs = await Service.find({}).populate('user', 'name email').populate('workshop', 'name').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

exports.updateServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted' | 'rejected'
    if (!['accepted', 'rejected', 'pending'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const doc = await Service.findByIdAndUpdate(id, { status }, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const total = await Service.countDocuments();
    const accepted = await Service.countDocuments({ status: 'accepted' });
    const rejected = await Service.countDocuments({ status: 'rejected' });
    const pending = await Service.countDocuments({ status: 'pending' });
    res.json({ success: true, data: { total, accepted, rejected, pending } });
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    let s = await AdminSetting.findOne();
    if (!s) s = await AdminSetting.create({});
    res.json({ success: true, data: s });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let s = await AdminSetting.findOne();
    if (!s) s = new AdminSetting({});
    if (typeof req.body.openForRequest === 'boolean') s.openForRequest = req.body.openForRequest;
    s.updatedAt = new Date();
    await s.save();
    res.json({ success: true, data: s });
  } catch (err) {
    next(err);
  }
};
