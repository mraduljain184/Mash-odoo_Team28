const cloudinary = require('../Utils/cloudinary');

exports.getUploadSignature = async (req, res, next) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'services';
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret);
    return res.json({
      success: true,
      data: {
        timestamp,
        signature,
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key,
        folder,
      },
    });
  } catch (err) {
    next(err);
  }
};
