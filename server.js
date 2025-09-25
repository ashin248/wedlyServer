require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongooseConnection = require('./DB/mongooseConnection');
const path = require('path');
const fs = require('fs');

const app = express();

// Log environment variables for debugging
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
  process.exit(1);
}
if (!process.env.MONGOOSE_CONNECTION) {
  console.error('⚠ Error: MONGOOSE_CONNECTION is not set. Please define it in your environment variables.');
  process.exit(1);
}

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.PRODUCTION_CLIENT_URL]
  : [process.env.LOCALHOST_CLIENT_API_URL];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for Render
app.set('trust proxy', 1);

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGOOSE_CONNECTION, collectionName: 'sessions' }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'lax'
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve a simple message for the root URL
app.get('/', (req, res) => {
  res.send('API Server is live!');
});

// API Routes (no /api prefix to match working version)
const interestRouter = require('./Pages/interest');
const blockRouter = require('./Pages/block');
const settingsRouter = require('./Pages/Settings');
const notificationsRouter = require('./Pages/notifications');
const helpRouter = require('./Pages/Help');
const registerRouter = require('./components/register');
const logoutRouter = require('./components/logout');
const homeRouter = require('./components/home');
const informationRouter = require('./components/information');
const loginRouter = require('./components/login');
const middlewareRouter = require('./Auth/middleware');
const userRouter = require('./Auth/user');
const adminRouter = require('./admin/admin');

app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/information', informationRouter);
app.use('/update-information', informationRouter); // Assuming same router handles both
app.use('/user', userRouter);
app.use('/home', homeRouter);
app.use('/interest', interestRouter);
app.use('/message', require('./Pages/Message')); // Assuming case matches file
app.use('/block', blockRouter);
app.use('/notifications', notificationsRouter);
app.use('/settings', settingsRouter);
app.use('/help', helpRouter);
app.use('/admin', adminRouter);
app.use('/middleware', middlewareRouter, (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.session.user });
});
app.use('/blockedUsers', middlewareRouter, async (req, res) => {
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

// Serving static files
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// Client-side routes
const clientDist = path.join(__dirname, '../wedlyClient', 'dist');
const clientRoutes = [
  '/', '/register', '/login', '/home', '/information', '/update-information',
  '/interest', '/message', '/conversation/:partnerId', '/MassageImage',
  '/MassageVoice', '/notifications', '/admin/login', '/admin/home', '/settings',
  '/help', '/admin/help', '/admin/reports', '/admin/blocks', '/admin/history'
];

app.get(clientRoutes, (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  console.log(`Attempting to serve: ${indexPath}`);
  if (!fs.existsSync(indexPath)) {
    console.error(`Index.html not found at: ${indexPath}`);
    return res.status(500).send('Server configuration error: Build files missing');
  }
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`Error serving index.html: ${err.message}`);
      res.status(500).send('Error serving the application');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 6969;
async function startServer() {
  try {
    await mongooseConnection();
    app.listen(PORT, () => {
      console.log(`🚀 API Server listening on port ${PORT} at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
    });
  } catch (error) {
    console.error(`Server failed to start on port ${PORT}`, error);
    process.exit(1);
  }
}

startServer();











// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const path = require('path');
// const fs = require('fs'); // Added for file existence check
// const mongooseConnection = require('./DB/mongooseConnection');
// const User = require('./Schema/User');

// const server = express();

// // Log environment variables at startup for debugging purposes
// console.log('Environment variables:');
// console.log('PORT:', process.env.PORT);
// console.log('MONGOOSE_CONNECTION:', process.env.MONGOOSE_CONNECTION);
// console.log('SESSION_SECRET:', process.env.SESSION_SECRET);
// console.log('PRODUCTION_CLIENT_URL:', process.env.PRODUCTION_CLIENT_URL);
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('---------------------------------');

// // Validate critical environment variables
// if (!process.env.SESSION_SECRET) {
//     console.error('⚠ Error: SESSION_SECRET is not set. Please set a secure one in your environment variables.');
//     process.exit(1); // Exit if critical variable is missing
// }
// if (!process.env.MONGOOSE_CONNECTION) {
//     console.error('⚠ Error: MONGOOSE_CONNECTION is not set. Please define it in your environment variables.');
//     process.exit(1); // Exit if critical variable is missing
// }

// // CORS configuration - Use production URL if in production, otherwise use localhost
// const allowedOrigins = process.env.NODE_ENV === 'production'
//     ? [process.env.PRODUCTION_CLIENT_URL]
//     : [process.env.LOCALHOST_CLIENT_API_URL];

// server.use(cors({
//     origin: allowedOrigins,
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Middleware for parsing JSON and URL-encoded data
// server.use(express.json());
// server.use(express.urlencoded({ extended: true }));

// // Session configuration using MongoStore
// server.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//         mongoUrl: process.env.MONGOOSE_CONNECTION,
//         collectionName: 'sessions'
//     }),
//     cookie: {
//         secure: process.env.NODE_ENV === 'production',
//         httpOnly: true,
//         maxAge: 24 * 60 * 60 * 1000, // 1 day
//         sameSite: 'lax'
//     }
// }));

// // Logging middleware
// server.use((req, res, next) => {
//     console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//     next();
// });

// // Serve a simple message for the root URL
// server.get('/', (req, res) => {
//     res.send('API Server is live!');
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
// server.use('/middleware', require('./Auth/checkAuth'), (req, res) => {
//     res.status(200).json({ message: 'Authenticated', user: req.session.user });
// });
// server.use('/blockedUsers', require('./Auth/checkAuth'), async (req, res) => {
//     try {
//         const user = await User.findById(req.session.user._id).exec();
//         if (!user) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         res.status(200).json({
//             user: { _id: user._id, blockedUsers: user.blockedUsers || [] }
//         });
//     } catch (error) {
//         console.error('Error fetching blocked users:', error.message, error.stack);
//         res.status(500).json({ error: 'Failed to fetch blocked users' });
//     }
// });

// // Serving static files from the Uploads directory
// server.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// // Client-side routes
// const clientDist = path.join(__dirname, '../wedlyClient', 'dist'); // Define clientDist
// const clientRoutes = [
//     '/', '/register', '/login', '/home', '/information', '/update-information',
//     '/interest', '/message', '/conversation/:partnerId', '/MassageImage',
//     '/MassageVoice', '/notifications', '/admin/login', '/admin/home', '/settings',
//     '/help', '/admin/help', '/admin/reports', '/admin/blocks', '/admin/history'
// ];

// server.get(clientRoutes, (req, res) => {
//     const indexPath = path.join(clientDist, 'index.html');
//     console.log(`Attempting to serve: ${indexPath}`);
//     if (!fs.existsSync(indexPath)) {
//         console.error(`Index.html not found at: ${indexPath}`);
//         return res.status(500).send('Server configuration error: Build files missing');
//     }
//     res.sendFile(indexPath, (err) => {
//         if (err) {
//             console.error(`Error serving index.html: ${err.message}`);
//             res.status(500).send('Error serving the application');
//         }
//     });
// });

// // Start the server
// const PORT = process.env.PORT || 6969;
// async function startServer() {
//     try {
//         await mongooseConnection();
//         server.listen(PORT, () => {
//             console.log(`🚀 API Server listening on port 🚀 http://localhost${PORT}`);
//         });
//     } catch (error) {
//         console.error(`Server failed to start on port ${PORT}`, error);
//         process.exit(1);
//     }
// }

// startServer();