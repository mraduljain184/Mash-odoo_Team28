const { validationResult } = require('express-validator');
const Review = require('../Models/review');
const Workshop = require('../Models/workshop');

// List reviews for a workshop with user info (name)
exports.listByWorkshop = async (req, res, next) => {
  try {
    const { id } = req.params; // workshop id
    const docs = await Review.find({ workshopId: id })
      .sort({ createdAt: -1 })
      .populate({ path: 'userId', select: 'name email' })
      .lean();
    res.json({ success: true, data: docs });
  } catch (err) { next(err); }
};

// Create or update a review (one per user per workshop)
exports.upsert = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid input', errors: errors.array() });

    const user = req.user;
    if (!user || user.role !== 'user') return res.status(403).json({ success: false, message: 'User only' });

    const { workshopId, rating, comment = '' } = req.body || {};
    if (!workshopId) return res.status(400).json({ success: false, message: 'workshopId required' });

    const ws = await Workshop.findById(workshopId).lean();
    if (!ws) return res.status(404).json({ success: false, message: 'Workshop not found' });

    const doc = await Review.findOneAndUpdate(
      { workshopId, userId: user.id },
      { $set: { rating: Number(rating), comment: String(comment || ''), createdAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update aggregate metrics on workshop
    const agg = await Review.aggregate([
      { $match: { workshopId: doc.workshopId } },
      { $group: { _id: '$workshopId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    const a = agg[0] || { avg: 0, count: 0 };
    await Workshop.findByIdAndUpdate(doc.workshopId, { ratingAvg: a.avg, reviewsCount: a.count });

    res.status(201).json({ success: true, data: doc });
  } catch (err) { next(err); }
};
