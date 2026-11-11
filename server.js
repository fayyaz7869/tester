const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

// ===================================================================
// 🍃 MONGODB DATABASE CONFIGURATION (MERN STACK)
// File: server.js
// Aap apna MongoDB connection URL yahan paste kar sakte hain, ya
// .env file me MONGODB_URI=... paste kar sakte hain, ya Render Environment me!
// ===================================================================
const MONGODB_URI = process.env.MONGODB_URI || ''; // <--- YAHAN APNA MONGODB CONNECTION STRING LIKHEIN!

let isMongoConnected = false;

if (MONGODB_URI && MONGODB_URI.trim()) {
  mongoose.connect(MONGODB_URI.trim(), {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    isMongoConnected = true;
    console.log('=================================================');
    console.log('✓ Successfully connected to MongoDB Database! 🍃');
    console.log('=================================================');
    syncAdminUser();
  })
  .catch((err) => {
    isMongoConnected = false;
    console.error('⚠️ MongoDB connection error:', err.message);
    console.log('ℹ Continuing with resilient local fallback store...');
  });
} else {
  console.log('ℹ MONGODB_URI not provided. Set MONGODB_URI in .env to connect MongoDB Atlas.');
}

// ===================================================================
// 🔐 ADMIN CREDENTIALS CONFIGURATION
// File: server.js
// ===================================================================
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@shifteronline.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ShifterAdmin@2026!Secure'; // <--- YAHAN APNA ADMIN PASSWORD LIKHEIN!

// Cloudinary setup (optional / conditional)
let cloudinary = null;
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✓ Cloudinary configured successfully.');
} else {
  console.log('ℹ Cloudinary credentials not found. Using local disk upload fallback (/uploads).');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static directories
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'testing_points.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure directories exist
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer Storage Configuration
const upload = multer({
  storage: isCloudinaryConfigured ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1E6)}${ext}`;
      cb(null, safeName);
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, GIF, WEBP) are allowed!'));
    }
  }
});

// Helper: Upload file buffer to Cloudinary using stream
const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'qa_bug_tracker',
        resource_type: 'image',
        public_id: `${Date.now()}_${path.parse(originalName).name.replace(/[^a-zA-Z0-9]/g, '_')}`
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Status normalizer helper: pending | process | done
const normalizeStatus = (status) => {
  if (!status) return 'pending';
  const s = status.toLowerCase();
  if (s === 'new' || s === 'pending') return 'pending';
  if (s === 'in_progress' || s === 'process' || s === 'retest') return 'process';
  if (s === 'done' || s === 'checked' || s === 'completed') return 'done';
  return s;
};

// ===================================================================
// 🍃 MONGOOSE SCHEMAS & MODELS (MERN ARCHITECTURE)
// ===================================================================
const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Developer', 'Staff/Tester'], default: 'Staff/Tester' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  author: { type: String, default: 'Team Member' },
  role: { type: String, default: 'Staff/Tester' },
  text: { type: String, default: '' },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  statusChange: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

const testingPointSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  module: { type: String, default: 'General' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['pending', 'process', 'done'], default: 'pending' },
  createdBy: { type: String, default: 'Staff/Tester' },
  assignedTo: { type: String, default: 'Unassigned' },
  attachments: [{
    url: String,
    name: String,
    size: Number,
    type: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [commentSchema]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const TestingPoint = mongoose.models.TestingPoint || mongoose.model('TestingPoint', testingPointSchema);

// Sync Super Admin in MongoDB
const syncAdminUser = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      let admin = await User.findOne({ email: ADMIN_EMAIL });
      if (!admin) {
        await User.create({
          id: 'USR-ADMIN-01',
          name: 'Super Admin',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: 'Admin',
          status: 'approved'
        });
        console.log(`✓ Pre-set Admin initialized in MongoDB: ${ADMIN_EMAIL}`);
      } else {
        let changed = false;
        if (admin.password !== ADMIN_PASSWORD) {
          admin.password = ADMIN_PASSWORD;
          changed = true;
        }
        if (admin.role !== 'Admin') {
          admin.role = 'Admin';
          changed = true;
        }
        if (admin.status !== 'approved') {
          admin.status = 'approved';
          changed = true;
        }
        if (changed) {
          await admin.save();
          console.log(`✓ Admin credentials synced in MongoDB: ${ADMIN_EMAIL}`);
        }
      }
    }
  } catch (err) {
    console.error('Error syncing admin user in MongoDB:', err.message);
  }
};

// ================= LOCAL FALLBACK STORE (0 Fixed Test Cases) =================
// Completely clean initial data - No dummy or fixed test cases!
const getInitialSeedData = () => {
  return [];
};

const loadPoints = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialSeedData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file:', err);
    return [];
  }
};

const savePoints = (points) => {
  try {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(points, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (err) {
    console.error('Error writing data file:', err);
    return false;
  }
};

const loadUsers = () => {
  let users = [];
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading users file:', err);
    users = [];
  }

  // Ensure Admin account exists in file store
  const adminIndex = users.findIndex(u => u.email && u.email.toLowerCase() === ADMIN_EMAIL);
  const adminUserObj = {
    id: 'USR-ADMIN-01',
    name: 'Super Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'Admin',
    status: 'approved',
    createdAt: new Date().toISOString()
  };

  if (adminIndex === -1) {
    users.unshift(adminUserObj);
    saveUsers(users);
  } else {
    let changed = false;
    if (users[adminIndex].password !== ADMIN_PASSWORD) {
      users[adminIndex].password = ADMIN_PASSWORD;
      changed = true;
    }
    if (users[adminIndex].role !== 'Admin') {
      users[adminIndex].role = 'Admin';
      changed = true;
    }
    if (users[adminIndex].status !== 'approved') {
      users[adminIndex].status = 'approved';
      changed = true;
    }
    if (changed) saveUsers(users);
  }

  return users;
};

const saveUsers = (users) => {
  try {
    const tempFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
    fs.renameSync(tempFile, USERS_FILE);
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
};

// ID Generator for new testing points
const getNextId = async () => {
  if (mongoose.connection.readyState === 1) {
    const lastPoint = await TestingPoint.findOne().sort({ createdAt: -1 });
    let maxNum = 100;
    if (lastPoint && lastPoint.id && lastPoint.id.startsWith('TP-')) {
      const num = parseInt(lastPoint.id.replace('TP-', ''), 10);
      if (!isNaN(num)) maxNum = num;
    }
    const count = await TestingPoint.countDocuments();
    if (count >= maxNum) maxNum = count + 100;
    return `TP-${maxNum + 1}`;
  } else {
    const points = loadPoints();
    let maxNum = 100;
    points.forEach(p => {
      if (p.id && p.id.startsWith('TP-')) {
        const num = parseInt(p.id.replace('TP-', ''), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `TP-${maxNum + 1}`;
  }
};

// ================= API ROUTES =================

// 0. AUTHENTICATION ROUTES (Signup & Login)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Naam daalna zaroori hai (Name is required)' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email daalna zaroori hai (Email is required)' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password kam se kam 4 aksharo ka hona chahiye (Min 4 chars)' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = role === 'Developer' ? 'Developer' : 'Staff/Tester';
    const newUserId = `USR-${Date.now().toString(36).toUpperCase()}`;

    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ error: 'Ye email pehle se registered hai! Kripya Login karein.' });
      }

      const newUser = await User.create({
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        password: password.trim(),
        role: assignedRole,
        status: 'pending' // Requires admin approval!
      });

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Successfully signed up! Kindly wait for admin approval before you can log in.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        }
      });
    } else {
      const users = loadUsers();
      if (users.some(u => u.email && u.email.toLowerCase() === cleanEmail)) {
        return res.status(400).json({ error: 'Ye email pehle se registered hai! Kripya Login karein.' });
      }

      const newUser = {
        id: newUserId,
        name: name.trim(),
        email: cleanEmail,
        password: password.trim(),
        role: assignedRole,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);

      return res.status(201).json({
        success: true,
        pendingApproval: true,
        message: 'Successfully signed up! Kindly wait for admin approval before you can log in.',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status
        }
      });
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email aur Password dono daalna zaroori hai' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    let user = null;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      const users = loadUsers();
      user = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    }

    if (!user || user.password !== cleanPassword) {
      return res.status(401).json({ error: 'Galat Email ya Password! Kripya dobara check karein.' });
    }

    // Check approval status (Super Admin is always approved)
    const userStatus = user.status || (user.role === 'Admin' ? 'approved' : 'pending');
    if (userStatus === 'pending') {
      return res.status(403).json({
        error: 'Aapka account abhi Pending Approval me hai. Kripya Admin ke approve karne tak wait karein.',
        isPending: true
      });
    }

    if (userStatus === 'rejected') {
      return res.status(403).json({
        error: 'Aapka account registration request Admin dwara Reject kar diya gaya hai. Kripya Admin se sampark karein.',
        isRejected: true
      });
    }

    res.json({
      success: true,
      message: 'Login safal raha!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: userStatus
      },
      token: uuidv4()
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const emailQuery = req.query.email;
  if (!emailQuery) {
    return res.status(401).json({ error: 'Email parameter required' });
  }

  const cleanEmail = emailQuery.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ email: cleanEmail });
    if (user) {
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }
  } else {
    const users = loadUsers();
    const user = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (user) {
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }
  }

  res.status(404).json({ error: 'User not found' });
});

// Admin User Management Endpoints
app.get('/api/admin/users', async (req, res) => {
  const adminEmail = (req.headers['x-admin-email'] || req.query.adminEmail || '').trim().toLowerCase();
  if (adminEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Unauthorized. Only Admin can access user approval list.' });
  }

  if (mongoose.connection.readyState === 1) {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } else {
    const users = loadUsers();
    return res.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status || (u.role === 'Admin' ? 'approved' : 'pending'),
      createdAt: u.createdAt
    })));
  }
});

app.patch('/api/admin/users/:id/status', async (req, res) => {
  const adminEmail = (req.headers['x-admin-email'] || req.body.adminEmail || '').trim().toLowerCase();
  if (adminEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Unauthorized. Only Admin can approve/reject users.' });
  }

  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User nahi mila' });
    if (user.email.toLowerCase() === ADMIN_EMAIL) return res.status(400).json({ error: 'Super Admin status cannot be altered' });

    user.status = status;
    await user.save();

    return res.json({
      success: true,
      message: `User status '${status}' kar diya gaya!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } else {
    const users = loadUsers();
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User nahi mila' });
    if (user.email.toLowerCase() === ADMIN_EMAIL) return res.status(400).json({ error: 'Super Admin status cannot be altered' });

    user.status = status;
    saveUsers(users);

    return res.json({
      success: true,
      message: `User status '${status}' kar diya gaya!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  const adminEmail = (req.headers['x-admin-email'] || req.query.adminEmail || '').trim().toLowerCase();
  if (adminEmail !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (mongoose.connection.readyState === 1) {
    const target = await User.findOne({ id: req.params.id });
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.email.toLowerCase() === ADMIN_EMAIL) return res.status(400).json({ error: 'Super Admin cannot be deleted' });

    await User.deleteOne({ id: req.params.id });
    return res.json({ success: true, message: 'User request delete ho gayi!' });
  } else {
    let users = loadUsers();
    const target = users.find(u => u.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found' });
    if (target.email.toLowerCase() === ADMIN_EMAIL) return res.status(400).json({ error: 'Super Admin cannot be deleted' });

    users = users.filter(u => u.id !== req.params.id);
    saveUsers(users);
    return res.json({ success: true, message: 'User request delete ho gayi!' });
  }
});

// 1. Health check & Config status
app.get('/api/config', (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    adminEmail: ADMIN_EMAIL,
    databaseType: mongoConnected ? 'MongoDB (Connected) 🍃' : (MONGODB_URI ? 'Connecting to MongoDB...' : 'Local File Store (Set MONGODB_URI to connect MongoDB)'),
    mongoConnected: mongoConnected,
    cloudinaryEnabled: isCloudinaryConfigured,
    storageType: isCloudinaryConfigured ? 'Cloudinary Cloud Storage' : 'Local Disk Storage (/uploads)',
    timestamp: new Date().toISOString()
  });
});

// 2. Dashboard Statistics
app.get('/api/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const total = await TestingPoint.countDocuments();
      const pending = await TestingPoint.countDocuments({ status: 'pending' });
      const process = await TestingPoint.countDocuments({ status: 'process' });
      const done = await TestingPoint.countDocuments({ status: 'done' });
      const critical = await TestingPoint.countDocuments({ priority: 'Critical', status: { $ne: 'done' } });
      const high = await TestingPoint.countDocuments({ priority: 'High', status: { $ne: 'done' } });
      const pendingUsers = await User.countDocuments({ status: 'pending', email: { $ne: ADMIN_EMAIL } });

      return res.json({
        total,
        pending,
        process,
        done,
        pendingUsers,
        critical,
        high,
        new: pending,
        in_progress: process,
        retest: 0
      });
    } else {
      const points = loadPoints();
      const pendingCount = points.filter(p => normalizeStatus(p.status) === 'pending').length;
      const processCount = points.filter(p => normalizeStatus(p.status) === 'process').length;
      const doneCount = points.filter(p => normalizeStatus(p.status) === 'done').length;

      const users = loadUsers();
      const pendingUsersCount = users.filter(u => (u.status || 'pending') === 'pending' && u.email.toLowerCase() !== ADMIN_EMAIL).length;

      return res.json({
        total: points.length,
        pending: pendingCount,
        process: processCount,
        done: doneCount,
        pendingUsers: pendingUsersCount,
        new: pendingCount,
        in_progress: processCount,
        retest: 0,
        critical: points.filter(p => p.priority === 'Critical' && normalizeStatus(p.status) !== 'done').length,
        high: points.filter(p => p.priority === 'High' && normalizeStatus(p.status) !== 'done').length,
      });
    }
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// 3. Get all testing points (with optional filters)
app.get('/api/points', async (req, res) => {
  try {
    const { status, priority, module: mod, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status && status !== 'all') {
        query.status = normalizeStatus(status);
      }
      if (priority && priority !== 'all') {
        query.priority = priority;
      }
      if (mod && mod !== 'all') {
        query.module = mod;
      }
      if (search && search.trim()) {
        const q = search.trim();
        query.$or = [
          { id: { $regex: q, $options: 'i' } },
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { module: { $regex: q, $options: 'i' } },
          { assignedTo: { $regex: q, $options: 'i' } },
          { createdBy: { $regex: q, $options: 'i' } }
        ];
      }

      const points = await TestingPoint.find(query).sort({ updatedAt: -1 });
      return res.json(points);
    } else {
      let points = loadPoints();

      if (status && status !== 'all') {
        const targetStatus = normalizeStatus(status);
        points = points.filter(p => normalizeStatus(p.status) === targetStatus);
      }
      if (priority && priority !== 'all') {
        points = points.filter(p => p.priority === priority);
      }
      if (mod && mod !== 'all') {
        points = points.filter(p => p.module === mod);
      }
      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        points = points.filter(p =>
          (p.id && p.id.toLowerCase().includes(q)) ||
          (p.title && p.title.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.module && p.module.toLowerCase().includes(q)) ||
          (p.assignedTo && p.assignedTo.toLowerCase().includes(q)) ||
          (p.createdBy && p.createdBy.toLowerCase().includes(q))
        );
      }

      points.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      return res.json(points);
    }
  } catch (err) {
    console.error('Points fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch testing points' });
  }
});

// 4. Get single testing point
app.get('/api/points/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const point = await TestingPoint.findOne({ id: req.params.id });
      if (!point) return res.status(404).json({ error: 'Testing point not found' });
      return res.json(point);
    } else {
      const points = loadPoints();
      const point = points.find(p => p.id === req.params.id);
      if (!point) return res.status(404).json({ error: 'Testing point not found' });
      return res.json(point);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testing point' });
  }
});

// 5. Create new testing point (supports multiple image uploads)
app.post('/api/points', upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, module: pointModule, priority, createdBy, assignedTo } = req.body;

    let pointTitle = (title || '').trim();
    const pointDesc = (description || '').trim();

    if (!pointTitle && !pointDesc) {
      return res.status(400).json({ error: 'Please enter testing point details or title' });
    }

    if (!pointTitle) {
      pointTitle = pointDesc.split('\n')[0].substring(0, 80) || 'Testing Point';
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (isCloudinaryConfigured) {
          const url = await uploadToCloudinary(file.buffer, file.originalname);
          attachments.push({
            url,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString()
          });
        } else {
          attachments.push({
            url: `/uploads/${file.filename}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString()
          });
        }
      }
    }

    const newId = await getNextId();
    const now = new Date().toISOString();

    const newPoint = {
      id: newId,
      title: pointTitle,
      description: pointDesc,
      module: pointModule ? pointModule.trim() : 'General',
      priority: priority || 'Medium',
      status: 'pending',
      createdBy: createdBy ? createdBy.trim() : 'Staff/Tester',
      assignedTo: assignedTo ? assignedTo.trim() : 'Unassigned',
      attachments,
      comments: [
        {
          id: uuidv4(),
          author: createdBy ? createdBy.trim() : 'Staff/Tester',
          role: 'Staff/Tester',
          text: 'Testing point added by staff.',
          attachments: [],
          statusChange: 'Point Added (Pending)',
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    if (mongoose.connection.readyState === 1) {
      const created = await TestingPoint.create(newPoint);
      return res.status(201).json(created);
    } else {
      const points = loadPoints();
      points.unshift(newPoint);
      savePoints(points);
      return res.status(201).json(newPoint);
    }
  } catch (err) {
    console.error('Error creating point:', err);
    res.status(500).json({ error: err.message || 'Failed to create testing point' });
  }
});

// 6. Update testing point fields
app.patch('/api/points/:id', async (req, res) => {
  try {
    const { status, priority, assignedTo, title, description, module: newMod, updatedBy } = req.body;
    const statusLabels = {
      pending: 'Pending / To Test',
      process: 'In Process',
      done: 'Checked / Done'
    };

    if (mongoose.connection.readyState === 1) {
      const point = await TestingPoint.findOne({ id: req.params.id });
      if (!point) return res.status(404).json({ error: 'Testing point not found' });

      let hasStatusChanged = false;
      let statusLogText = '';

      if (status && normalizeStatus(status) !== normalizeStatus(point.status)) {
        hasStatusChanged = true;
        const oldNorm = normalizeStatus(point.status);
        const newNorm = normalizeStatus(status);
        statusLogText = `Status updated: "${statusLabels[oldNorm] || oldNorm}" ➜ "${statusLabels[newNorm] || newNorm}"`;
        point.status = newNorm;
      }

      if (priority) point.priority = priority;
      if (assignedTo !== undefined) point.assignedTo = assignedTo;
      if (title) point.title = title.trim();
      if (description !== undefined) point.description = description.trim();
      if (newMod) point.module = newMod.trim();

      point.updatedAt = new Date();

      if (hasStatusChanged) {
        point.comments.push({
          id: uuidv4(),
          author: updatedBy || 'Team Member',
          role: point.status === 'process' ? 'Developer' : (point.status === 'done' ? 'Staff/Tester' : 'Staff'),
          text: statusLogText,
          attachments: [],
          statusChange: statusLogText,
          createdAt: point.updatedAt
        });
      }

      await point.save();
      return res.json(point);
    } else {
      const points = loadPoints();
      const index = points.findIndex(p => p.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Testing point not found' });

      const point = points[index];
      let hasStatusChanged = false;
      let statusLogText = '';

      if (status && normalizeStatus(status) !== normalizeStatus(point.status)) {
        hasStatusChanged = true;
        const oldNorm = normalizeStatus(point.status);
        const newNorm = normalizeStatus(status);
        statusLogText = `Status updated: "${statusLabels[oldNorm] || oldNorm}" ➜ "${statusLabels[newNorm] || newNorm}"`;
        point.status = newNorm;
      }

      if (priority) point.priority = priority;
      if (assignedTo !== undefined) point.assignedTo = assignedTo;
      if (title) point.title = title.trim();
      if (description !== undefined) point.description = description.trim();
      if (newMod) point.module = newMod.trim();

      point.updatedAt = new Date().toISOString();

      if (hasStatusChanged) {
        point.comments = point.comments || [];
        point.comments.push({
          id: uuidv4(),
          author: updatedBy || 'Team Member',
          role: point.status === 'process' ? 'Developer' : (point.status === 'done' ? 'Staff/Tester' : 'Staff'),
          text: statusLogText,
          attachments: [],
          statusChange: statusLogText,
          createdAt: point.updatedAt
        });
      }

      savePoints(points);
      return res.json(point);
    }
  } catch (err) {
    console.error('Error updating point:', err);
    res.status(500).json({ error: 'Failed to update testing point' });
  }
});

// 7. Add Comment to testing point
app.post('/api/points/:id/comments', upload.array('images', 3), async (req, res) => {
  try {
    const { author, role, text, nextStatus } = req.body;

    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ error: 'Comment must have text or image attachment' });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (isCloudinaryConfigured) {
          const url = await uploadToCloudinary(file.buffer, file.originalname);
          attachments.push({
            url,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString()
          });
        } else {
          attachments.push({
            url: `/uploads/${file.filename}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString()
          });
        }
      }
    }

    const now = new Date().toISOString();
    const newComment = {
      id: uuidv4(),
      author: author ? author.trim() : 'Team Member',
      role: role || 'Developer',
      text: text ? text.trim() : '',
      attachments,
      statusChange: null,
      createdAt: now
    };

    if (mongoose.connection.readyState === 1) {
      const point = await TestingPoint.findOne({ id: req.params.id });
      if (!point) return res.status(404).json({ error: 'Testing point not found' });

      if (nextStatus && normalizeStatus(nextStatus) !== normalizeStatus(point.status)) {
        const oldStatus = point.status;
        point.status = normalizeStatus(nextStatus);
        newComment.statusChange = `Status changed: ${oldStatus} ➜ ${point.status}`;
      }

      point.comments.push(newComment);
      point.updatedAt = new Date();
      await point.save();

      return res.status(201).json({ comment: newComment, updatedPoint: point });
    } else {
      const points = loadPoints();
      const index = points.findIndex(p => p.id === req.params.id);
      if (index === -1) return res.status(404).json({ error: 'Testing point not found' });

      if (nextStatus && normalizeStatus(nextStatus) !== normalizeStatus(points[index].status)) {
        const oldStatus = points[index].status;
        points[index].status = normalizeStatus(nextStatus);
        newComment.statusChange = `Status changed: ${oldStatus} ➜ ${points[index].status}`;
      }

      points[index].comments = points[index].comments || [];
      points[index].comments.push(newComment);
      points[index].updatedAt = now;

      savePoints(points);

      return res.status(201).json({ comment: newComment, updatedPoint: points[index] });
    }
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

// 8. Delete a testing point
app.delete('/api/points/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await TestingPoint.findOneAndDelete({ id: req.params.id });
      if (!deleted) return res.status(404).json({ error: 'Testing point not found' });
      return res.json({ success: true, message: `Point ${req.params.id} deleted` });
    } else {
      let points = loadPoints();
      const exists = points.some(p => p.id === req.params.id);
      if (!exists) return res.status(404).json({ error: 'Testing point not found' });
      points = points.filter(p => p.id !== req.params.id);
      savePoints(points);
      return res.json({ success: true, message: `Point ${req.params.id} deleted` });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete point' });
  }
});

// Fallback all other GET requests to index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  }
  next();
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🚀 QA & Dev Testing Point Tracker (MERN) Running!`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`🍃 Database: ${MONGODB_URI ? 'Connecting to MongoDB...' : 'Local JSON Store (Set MONGODB_URI in .env)'}`);
  console.log(`☁️ Cloudinary: ${isCloudinaryConfigured ? 'Enabled' : 'Disabled (Local /uploads fallback)'}`);
  console.log(`=================================================`);
});
