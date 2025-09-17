// const mongoose = require('mongoose');

// const DB_URI = process.env.MONGOOSE_CONNECTION || process.env.LOCALHOST_BD;

// function mongooseConnection() {
//   mongoose.connect(DB_URI,)
//     .then(() => console.log('MongoDB connected'))
//     .catch(err => console.error('MongoDB connection error:', err));
// }

// module.exports = mongooseConnection;

const mongoose = require('mongoose');

const DB_URI = process.env.MONGOOSE_CONNECTION || process.env.LOCALHOST_BD;

async function mongooseConnection() {
  console.log('Attempting to connect to MongoDB with URI:', DB_URI);
  if (!DB_URI) {
    throw new Error('DB_URI is undefined. Check MONGOOSE_CONNECTION or LOCALHOST_BD in .env file.');
  }
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true, // Optional in Mongoose 8.x, included for compatibility
      useUnifiedTopology: true, // Optional in Mongoose 8.x
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err; // Rethrow to be handled by the caller
  }
}

module.exports = mongooseConnection;