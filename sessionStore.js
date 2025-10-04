// sessionStore.js
const session = require('express-session');
const mongoose = require('mongoose');

// Get the base Store class from express-session
const Store = session.Store;

const sessionSchema = new mongoose.Schema({
    _id: String, // Session ID
    session: String, // JSON string of session data
    expires: Date, // Expiration date
});

const Session = mongoose.model('Session', sessionSchema);

// Make MongooseStore inherit from express-session.Store
class MongooseStore extends Store {
    constructor(options) {
        super(options);
    }

    async get(sid, callback) {
        try {
            const sessionDoc = await Session.findById(sid);
            callback(null, sessionDoc ? JSON.parse(sessionDoc.session) : null);
        } catch (err) {
            callback(err);
        }
    }

    async set(sid, session, callback) {
        try {
            await Session.findOneAndUpdate(
                { _id: sid },
                { session: JSON.stringify(session), expires: new Date(session.cookie.expires) },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            callback(null);
        } catch (err) {
            callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            await Session.deleteOne({ _id: sid });
            callback(null);
        } catch (err) {
            callback(err);
        }
    }
    
    // Optional: Add a touch method for session resets
    async touch(sid, session, callback) {
      try {
        await Session.findOneAndUpdate(
          { _id: sid },
          { expires: new Date(session.cookie.expires) }
        );
        callback(null);
      } catch (err) {
        callback(err);
      }
    }
}

// Pass an instance of the new MongooseStore to the session middleware
module.exports = session({
    secret: process.env.SESSION_SECRET || 'supersecretkeyfornow',
    resave: false,
    saveUninitialized: false,
    store: new MongooseStore(), // Instantiate the class
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
});