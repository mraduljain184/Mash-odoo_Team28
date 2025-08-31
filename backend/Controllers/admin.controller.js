const Service = require('../Models/service');
const AdminSetting = require('../Models/adminSetting');
const { getIO } = require('../Utils/io');

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

    // Fetch current to enforce idempotency
    const current = await Service.findById(id);
    if (!current) return res.status(404).json({ success: false, message: 'Not found' });

    const prevStatus = current.status;
    if (prevStatus === status) {
      // No change; return current without emitting duplicate events
      return res.json({ success: true, data: current });
    }

    const doc = await Service.findByIdAndUpdate(id, { status }, { new: true });

    // On acceptance transition, notify the worker who owns the workshop (if linked)
    if (status === 'accepted' && prevStatus !== 'accepted' && doc.workshop) {
      try {
        const full = await Service.findById(doc._id)
          .populate({ path: 'user', select: 'name email' })
          .populate({ path: 'workshop', select: 'name workerId', populate: { path: 'workerId', select: 'name email phone' } })
          .lean();
        const workerId = full?.workshop?.workerId?._id || full?.workshop?.workerId;
        if (workerId) {
          const coords = Array.isArray(full?.location?.coordinates) ? full.location.coordinates : [];
          const payload = {
            id: String(full._id),
            name: full.name,
            description: full.description || '',
            serviceType: full.serviceType,
            imageUrl: full.imageUrl || '',
            createdAt: full.createdAt,
            user: full.user ? { id: String(full.user._id || ''), name: full.user.name || '', email: full.user.email || '' } : null,
            workshop: full.workshop ? { id: String(full.workshop._id || ''), name: full.workshop.name || '' } : null,
            lat: typeof coords[1] === 'number' ? coords[1] : null,
            lng: typeof coords[0] === 'number' ? coords[0] : null,
            status: full.status,
          };
          const { getIO } = require('../Utils/io');
          const io = getIO();
          if (io) io.to(`worker:${workerId}`).emit('service:accepted', payload);
        }
      } catch (emitErr) {
        console.warn('[admin.updateServiceStatus] notify worker failed', emitErr);
      }
    }

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
