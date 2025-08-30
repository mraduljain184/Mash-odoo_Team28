const Service = require('../Models/service');
const { getIO } = require('../Utils/io');

exports.create = async (req, res, next) => {
  try {
    const ct = req.headers['content-type'] || '';
    console.log('[service.create] content-type =', ct);
    console.log('[service.create] body keys =', Object.keys(req.body || {}));

    if (ct.includes('multipart/form-data')) {
      // Frontend still sending multipart. We no longer accept files. Return a clear error.
      return res.status(415).json({ success: false, message: 'Send JSON only. Upload image to Cloudinary on client and pass imageUrl.' });
    }

    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, description, serviceType, serviceTimeStart, serviceTimeEnd, workshopId, lat, lng, imageUrl } = req.body || {};
    if (!name || !serviceType) return res.status(400).json({ success: false, message: 'Missing required fields' });

    const doc = new Service({
      user: userId,
      workshop: workshopId || undefined,
      name,
      description: description || '',
      serviceType,
      serviceTimeStart: serviceType === 'prebook' && serviceTimeStart ? new Date(serviceTimeStart) : undefined,
      serviceTimeEnd: serviceType === 'prebook' && serviceTimeEnd ? new Date(serviceTimeEnd) : undefined,
      location: (lat && lng) ? { type: 'Point', coordinates: [Number(lng), Number(lat)] } : undefined,
      imageUrl: imageUrl || '',
    });

    await doc.save();
    console.log('[service.create] saved service', { id: doc._id, name: doc.name, user: String(doc.user) });

    // Notify admins in realtime
    try {
      const io = getIO();
      if (io) io.emit('service:new', { id: doc._id, name: doc.name, description: doc.description, user: doc.user, imageUrl: doc.imageUrl, serviceType: doc.serviceType, createdAt: doc.createdAt });
    } catch (emitErr) {
      console.warn('[service.create] socket emit failed', emitErr);
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('[service.create] error', err);
    next(err);
  }
};
