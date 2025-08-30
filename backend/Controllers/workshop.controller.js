const Workshop = require('../Models/workshop');

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
