const mongoose = require('mongoose');

async function mongooseConnection() {
    try {
        const mongoURL = process.env.NODE_ENV === 'development'
            ? process.env.MONGOOSE_CONNECTION
            : process.env.GLOBAL_MONGOOSE_CONNECTION;

        if (!mongoURL) {
            throw new Error('MONGOOSE_CONNECTION or GLOBAL_MONGOOSE_CONNECTION env var is missing.');
        }

        await mongoose.connect(mongoURL, {
            bufferTimeoutMS: 30000, // 30s timeout for buffering operations
            serverSelectionTimeoutMS: 30000, // 30s for server selection
        });

        console.log('✅ MongoDB connected successfully');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        throw err; // Let server.js handle exit
    }
}

module.exports = mongooseConnection;





// const mongoose = require('mongoose');

// async function mongooseConnection() {
//     try {
//         const mongoURL = process.env.NODE_ENV === 'development'
//             ? process.env.MONGOOSE_CONNECTION
//             : process.env.GLOBAL_MONGOOSE_CONNECTION;

//         await mongoose.connect(mongoURL, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });

//         console.log('✅ MongoDB connected successfully');
//     } catch (err) {
//         console.error('❌ MongoDB connection error:', err);
//         throw err; // Let server.js handle exit
//     }
// }

// module.exports = mongooseConnection;
