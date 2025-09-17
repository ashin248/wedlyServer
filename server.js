

// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const path = require('path');
// const mongooseConnection = require('./DB/mongooseConnection');
// const User = require('./Schema/User');

// const server = express();

// // Debug environment variables upon startup
// console.log('Environment variables:');
// console.log('PORT:', process.env.PORT);
// console.log('MONGOOSE_CONNECTION:', process.env.MONGOOSE_CONNECTION);
// console.log('LOCALHOST_BD:', process.env.LOCALHOST_BD);
// console.log('SESSION_SECRET:', process.env.SESSION_SECRET);
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('PRODUCTION_CLIENT_URL:', process.env.PRODUCTION_CLIENT_URL);
// console.log('LOCALHOST_CLIENT_API_URL:', process.env.LOCALHOST_CLIENT_API_URL);   

// // CORS configuration
// const allowedOrigins = process.env.NODE_ENV === 'production'
//   ? [process.env.PRODUCTION_CLIENT_URL]
//   : [process.env.LOCALHOST_CLIENT_API_URL];

// server.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, origin);
//     } else {
//       console.error(`CORS error: Origin ${origin} not allowed`);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Middleware for parsing JSON and URL-encoded data
// server.use(express.json());
// server.use(express.urlencoded({ extended: true }));

// // Validate environment variables
// if (!process.env.SESSION_SECRET) {
//   console.warn('⚠ SESSION_SECRET not set — using default. Set a secure one in production.');
// }

// if (!process.env.MONGOOSE_CONNECTION && !process.env.LOCALHOST_BD) {
//   console.error('⚠ No MongoDB connection string set. Please define MONGOOSE_CONNECTION or LOCALHOST_BD in .env file.');
//   process.exit(1);
// }

// // Session configuration
// server.use(session({
//   secret: process.env.SESSION_SECRET || 'supersecretkeyfornow',
//   resave: false,
//   saveUninitialized: false,
//   store: MongoStore.create({
//     mongoUrl: process.env.MONGOOSE_CONNECTION || process.env.LOCALHOST_BD,
//     collectionName: 'sessions'
//   }),
//   cookie: {
//     secure: process.env.NODE_ENV === 'production',
//     httpOnly: true,
//     maxAge: 24 * 60 * 60 * 1000, // 1 day
//     sameSite: 'lax'
//   }
// }));

// // Logging middleware
// server.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   next();
// });

// // API Routes
// server.use('/register', require('./components/register'));
// server.use('/login', require('./components/login'));
// server.use('/logout', require('./components/logout'));
// server.use('/information', require('./components/information'));
// server.use('/update-information', require('./components/information'));
// server.use('/user', require('./Auth/user'));
// server.use('/home', require('./components/home'));
// server.use('/interest', require('./Pages/interest'));
// server.use('/message', require('./Pages/Message'));
// server.use('/block', require('./Pages/block'));
// server.use('/notifications', require('./Pages/notifications'));
// server.use('/settings', require('./Pages/Settings'));
// server.use('/help', require('./Pages/Help'));
// server.use('/admin', require('./admin/admin'));

// // Middleware test route
// server.get('/middleware', require('./Auth/checkAuth'), (req, res) => {
//   res.status(200).json({ message: 'Authenticated', user: req.session.user });
// });

// // Blocked users route
// server.get('/blockedUsers', require('./Auth/checkAuth'), async (req, res) => {
//   try {
//     const user = await User.findById(req.session.user._id).exec();
//     if (!user) {
//       console.log('User not found for ID:', req.session.user._id);
//       return res.status(404).json({ error: 'User not found' });
//     }
//     console.log('Blocked users fetched for user:', req.session.user._id);
//     res.status(200).json({
//       user: {
//         _id: user._id,
//         blockedUsers: user.blockedUsers || []
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching blocked users:', error.message, error.stack);
//     res.status(500).json({ error: 'Failed to fetch blocked users' });
//   }
// });

// // Serve static files
// // const clientDist = path.join(__dirname, 'wedlyClient', 'dist');


// const clientDist = path.join(__dirname,  '../wedlyClient', 'dist');
// server.use(express.static(clientDist))

// server.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));


// // Client-side routes
// const clientRoutes = [
//   '/', '/register', '/login', '/home', '/information', '/update-information',
//   '/interest', '/message', '/conversation/:partnerId', '/MassageImage',
//   '/MassageVoice', '/notifications', '/admin/login', '/admin/home', '/settings',
//   '/help', '/admin/help', '/admin/reports', '/admin/blocks', '/admin/history'
// ];

// server.get(clientRoutes, (req, res) => {
//   const indexPath = path.join(clientDist, 'index.html');
//   console.log(`Attempting to serve: ${indexPath}`);
//   res.sendFile(indexPath, (err) => {
//     if (err) {
//       console.error(`Error serving index.html: ${err.message}`);
//       res.status(500).send('Error serving the application');
//     }
//   });
// });

// // Handle 404 for API routes
// server.use((req, res) => {
//   if (req.originalUrl.startsWith('/api') || req.originalUrl === '/middleware') {
//     return res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
//   }
//   const indexPath = path.join(clientDist, 'index.html');
//   console.log(`Fallback: Attempting to serve: ${indexPath}`);
//   res.sendFile(indexPath, (err) => {
//     if (err) {
//       console.error(`Error serving index.html: ${err.message}`);
//       res.status(500).send('Error serving the application');
//     }
//   });
// });

// // Start server
// async function startServer() {
//   const PORT = process.env.PORT || 6969;
//   try {
//     await mongooseConnection();
//     server.listen(PORT, () => {
//       console.log(`🚀 Server running at http://localhost:${PORT}`);
//     });
//   } catch (error) {
//     console.error(`Server failed to start on port ${PORT}:`, error);
//     process.exit(1);
//   }
// }

// startServer();

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const mongooseConnection = require('./DB/mongooseConnection');
const User = require('./Schema/User');

const server = express();

// Log environment variables at startup for debugging purposes
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGOOSE_CONNECTION:', process.env.MONGOOSE_CONNECTION);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);
console.log('PRODUCTION_CLIENT_URL:', process.env.PRODUCTION_CLIENT_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('---------------------------------');

// Validate critical environment variables
if (!process.env.SESSION_SECRET) {
    console.error('⚠ Error: SESSION_SECRET is not set. Please set a secure one in your environment variables.');
    process.exit(1); // Exit if critical variable is missing
}
if (!process.env.MONGOOSE_CONNECTION) {
    console.error('⚠ Error: MONGOOSE_CONNECTION is not set. Please define it in your environment variables.');
    process.exit(1); // Exit if critical variable is missing
}

// CORS configuration - Use production URL if in production, otherwise use localhost
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.PRODUCTION_CLIENT_URL]
    : [process.env.LOCALHOST_CLIENT_API_URL];

server.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON and URL-encoded data
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Session configuration using MongoStore
server.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGOOSE_CONNECTION,
        collectionName: 'sessions'
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax'
    }
}));

// Logging middleware
server.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// API Routes
server.use('/register', require('./components/register'));
server.use('/login', require('./components/login'));
server.use('/logout', require('./components/logout'));
server.use('/information', require('./components/information'));
server.use('/update-information', require('./components/information'));
server.use('/user', require('./Auth/user'));
server.use('/home', require('./components/home'));
server.use('/interest', require('./Pages/interest'));
server.use('/message', require('./Pages/Message'));
server.use('/block', require('./Pages/block'));
server.use('/notifications', require('./Pages/notifications'));
server.use('/settings', require('./Pages/Settings'));
server.use('/help', require('./Pages/Help'));
server.use('/admin', require('./admin/admin'));
server.use('/middleware', require('./Auth/checkAuth'), (req, res) => {
    res.status(200).json({ message: 'Authenticated', user: req.session.user });
});
server.use('/blockedUsers', require('./Auth/checkAuth'), async (req, res) => {
    try {
        const user = await User.findById(req.session.user._id).exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({
            user: { _id: user._id, blockedUsers: user.blockedUsers || [] }
        });
    } catch (error) {
        console.error('Error fetching blocked users:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch blocked users' });
    }
});

// Serve static files from the client's 'dist' directory
const clientDist = path.join(__dirname, '../wedlyClient', 'dist');
server.use(express.static(clientDist));
server.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Handle all client-side routes and serve index.html
server.get([
    '/', '/register', '/login', '/home', '/information', '/update-information',
    '/interest', '/message', '/conversation/:partnerId', '/MassageImage',
    '/MassageVoice', '/notifications', '/admin/login', '/admin/home', '/settings',
    '/help', '/admin/help', '/admin/reports', '/admin/blocks', '/admin/history'
], (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 6969;
async function startServer() {
    try {
        await mongooseConnection();
        server.listen(PORT, () => {
            console.log(`🚀 http://localhost${PORT}`);
        });
    } catch (error) {
        console.error(`Server failed to start on port ${PORT}:`, error);
        process.exit(1);
    }
}

startServer();