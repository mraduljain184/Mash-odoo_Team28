const Service = require('../Models/service');
const cloudinary = require('../Utils/cloudinary');

exports.create = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, description, serviceType, serviceTimeStart, serviceTimeEnd, workshopId, lat, lng } = req.body;
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
    });

    // Image upload (optional)
    if (req.file?.path) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, { folder: 'services' });
      doc.imageUrl = uploaded.secure_url;
    }

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};
