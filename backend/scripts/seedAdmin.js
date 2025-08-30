require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../Models/admin');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'changeMe@123';

    let admin = await Admin.findOne({ username });
    if (admin) {
      admin.password = password;
      await admin.save();
      console.log('Updated existing admin password for', username);
    } else {
      admin = new Admin({ username, password, name: 'Super Admin' });
      await admin.save();
      console.log('Created admin user', username);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed admin error:', err);
    process.exit(1);
  }
})();
