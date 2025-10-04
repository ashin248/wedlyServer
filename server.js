



const express = require('express');
const DotEnv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const mongooseConnection = require('./DB/mongooseConnection');
const User = require('./Schema/User');

DotEnv.config();

const DEFAULT_PORT = 6969; 

const DEFAULT_FRONTEND_URL = 'http://localhost:5173'; 

const DEFAULT_SESSION_SECRET = process.env.SESSION_SECRET || 'supersecretkeyfornow'; 

// -------------------------------------------------------------------

const server = express();

// Middleware
server.use(cors({
  origin: process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL, 
  credentials: true,
}));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

if (!process.env.SESSION_SECRET) {
  console.warn('⚠ SESSION_SECRET not set — using default. Set a secure one in production.');
}

if (!process.env.MONGOOSE_CONNECTION) {
  console.error('⚠ MONGOOSE_CONNECTION not set. Please define it in .env file.');
  process.exit(1);
}

server.use(session({
  secret: DEFAULT_SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGOOSE_CONNECTION,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: 'lax',
  },
}));

// Logging middleware for debugging
server.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- API ROUTES ---
const Register = require('./components/register');
const Login = require('./components/login');
const Logout = require('./components/logout');
const informationRoute = require('./components/information');
const checkAuth = require('./Auth/checkAuth');
const userRoute = require('./Auth/user');
const home = require('./components/home');
const interest = require('./Pages/interest');
const messageRouter = require('./Pages/Message');
const block = require('./Pages/block');
const Notification = require('./Pages/notifications');
const Setting = require('./Pages/Settings');
const help = require('./Pages/Help');
const AdminSection = require('./admin/admin');

server.use('/register', Register);
server.use('/login', Login);
server.use('/logout', Logout);
server.use('/information', informationRoute);
server.use('/update-information', informationRoute);
server.use('/user', userRoute);
server.use('/home', home);
server.use('/interest', interest);
server.use('/message', messageRouter);
server.use('/block', block);
server.use('/notifications', Notification);
server.use('/settings', Setting);
server.use('/help', help);
server.use('/admin', AdminSection);

// Middleware test route
server.get('/middleware', checkAuth, (req, res) => {
  res.status(200).json({ message: 'Authenticated', user: req.session.user });
});

// Blocked users route to fix 404 error
server.get('/blockedUsers', checkAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).exec();
    if (!user) {
      console.log('User not found for ID:', req.session.user._id);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('Blocked users fetched for user:', req.session.user._id);
    res.status(200).json({
      user: {
        _id: user._id,
        blockedUsers: user.blockedUsers || [],
      },
    });
  } catch (error) {
    console.error('Error fetching blocked users:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

// Static files
const clientDist = path.join(__dirname, '../wedlyClient/dist');
server.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
server.use('/Uploads', express.static(path.join(__dirname, 'Uploads/DpImage')));
server.use('/Uploads', express.static(path.join(__dirname, 'Uploads/audio')));
server.use('/Uploads', express.static(path.join(__dirname, 'Uploads/images')));
server.use(express.static(clientDist));

// Client-side routes (excluding /middleware)
const clientRoutes = [
  '/', '/register', '/login', '/home', '/information', '/update-information',
  '/interest', '/message', '/conversation/:partnerId', '/MassageImage',
  '/MassageVoice', '/notifications', '/admin/login', '/admin/home', '/settings',
  '/help', '/admin/help', '/admin/reports', '/admin/blocks', '/admin/history'
];

server.get(clientRoutes, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Catch-all for unmatched routes
server.use((req, res) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl === '/middleware') {
    return res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

async function startServer() {
  // Use process.env.PORT or the explicit default 
  const PORT = process.env.PORT || DEFAULT_PORT; 
  try {
    await mongooseConnection(); // Ensure this connects properly
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Server failed to start on port ${PORT}:`, error);
    process.exit(1);
  }
}

startServer();

