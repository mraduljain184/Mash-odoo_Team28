const Workshop = require('../Models/workshop');
const Worker = require('../Models/worker');

// Haversine distance calculation
function distanceKm([lng1, lat1], [lng2, lat2]) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.list = async (req, res, next) => {
  try {
    const { q = '', status = 'all', sort = 'nearby', lat, lng, radiusKm } = req.query;

    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (status === 'open' || status === 'closed') filter.status = status;

    let docs = await Workshop.find(filter).limit(200).lean();

    // Compute distance if lat/lng provided
    let userLoc = null;
    if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      userLoc = [Number(lng), Number(lat)];
      docs = docs.map(d => {
        const dist = d.location?.coordinates ? distanceKm(d.location.coordinates, userLoc) : null;
        return { ...d, distanceKm: dist };
      });
      if (radiusKm && !Number.isNaN(Number(radiusKm))) {
        const r = Number(radiusKm);
        docs = docs.filter(d => d.distanceKm == null || d.distanceKm <= r);
      }
    }

    if (sort === 'nearby' && userLoc) docs.sort((a,b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
    if (sort === 'rated') docs.sort((a,b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0));

    res.json({ success: true, data: docs });
  } catch (err) {
    next(err);
  }
};

// Get full workshop details by id
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.query;
    const doc = await Workshop.findById(id)
      .populate({ path: 'workerId', select: 'name email phone' })
      .lean();

    if (!doc) return res.status(404).json({ success: false, message: 'Workshop not found' });

    if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng)) && doc.location?.coordinates) {
      const userLoc = [Number(lng), Number(lat)];
      doc.distanceKm = distanceKm(doc.location.coordinates, userLoc);
    }

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// Worker-owned endpoints
exports.myWorkshop = async (req, res, next) => {
  try {
    const workerId = req.user?.id;
    if (!workerId || req.user?.role !== 'worker') return res.status(403).json({ success: false, message: 'Worker only' });
    const doc = await Workshop.findOne({ workerId }).lean();
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.createMine = async (req, res, next) => {
  try {
    const workerId = req.user?.id;
    if (!workerId || req.user?.role !== 'worker') return res.status(403).json({ success: false, message: 'Worker only' });

    const exists = await Workshop.findOne({ workerId });
    if (exists) return res.status(400).json({ success: false, message: 'Workshop already exists' });

    const { name, status = 'open', address = '', lat, lng, ratingAvg = 0, reviewsCount = 0, images = [], services = [] } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    if (lat == null || lng == null) return res.status(400).json({ success: false, message: 'Location lat/lng required' });

    const doc = new Workshop({
      name,
      workerId,
      status,
      address,
      location: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
      ratingAvg: Number(ratingAvg) || 0,
      reviewsCount: Number(reviewsCount) || 0,
      images: Array.isArray(images) ? images : [],
      services: Array.isArray(services) ? services : [],
    });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};

exports.updateMine = async (req, res, next) => {
  try {
    const workerId = req.user?.id;
    if (!workerId || req.user?.role !== 'worker') return res.status(403).json({ success: false, message: 'Worker only' });
    const doc = await Workshop.findOne({ workerId });
    if (!doc) return res.status(404).json({ success: false, message: 'No workshop found' });

    const { name, status, address, lat, lng, ratingAvg, reviewsCount, images, services, description, ownerContact, social } = req.body || {};
    if (name != null) doc.name = name;
    if (status != null) doc.status = status;
    if (address != null) doc.address = address;
    if (lat != null && lng != null) doc.location = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
    if (ratingAvg != null) doc.ratingAvg = Number(ratingAvg) || 0;
    if (reviewsCount != null) doc.reviewsCount = Number(reviewsCount) || 0;
    if (Array.isArray(images)) doc.images = images;
    if (Array.isArray(services)) doc.services = services;
    if (description != null) doc.description = description;
    if (ownerContact != null) doc.ownerContact = ownerContact;
    if (social != null) doc.social = social;
    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) { next(err); }
};
