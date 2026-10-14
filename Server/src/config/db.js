const mongoose = require('mongoose');

let connecting = false;

async function connectDB(uri, retries = 5) {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      connecting = true;
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
      });
      console.log('MongoDB Connected Successfully');
      connecting = false;
      return;
    } catch (err) {
      console.error(
        `DB connection attempt ${attempt}/${retries} failed:`,
        err.message
      );
      if (attempt === retries) {
        connecting = false;
        throw err;
      }
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDbConnected };
