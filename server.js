const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

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

// Ensure directories exist
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.static(PUBLIC_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer Storage Configuration
// Memory storage when uploading to Cloudinary, Disk storage when local fallback
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

// Database persistence helpers
const getInitialSeedData = () => {
  return [
    {
      id: 'TP-101',
      title: 'Mobile screen par login OTP button disable nahi ho raha',
      description: `Testing point:
1. Mobile screen par login page open karo.
2. Mobile number daalo aur request OTP karo.
3. OTP aane ke baad verify button dabane par infinite loading dikha raha hai aur error aata hai: "device_token missing".
Developer please check auth controller.`,
      module: 'Login & Auth',
      priority: 'High',
      status: 'pending',
      createdBy: 'Aakash (QA/Staff)',
      assignedTo: 'Vikram Dev',
      attachments: [
        {
          url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=800&auto=format&fit=crop&q=60',
          name: 'login-error-sample.jpg',
          size: 104200,
          uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString()
        }
      ],
      comments: [
        {
          id: uuidv4(),
          author: 'Aakash (QA/Staff)',
          role: 'Staff/Tester',
          text: 'Staging par verify kiya hai, Android aur iPhone dono me yahi issue aa raha hai.',
          attachments: [],
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'TP-102',
      title: 'Invoice PDF download me customer special characters corrupt ho rahe hai',
      description: `Testing observation:
Jab customer name me special characters jaise "&", "-" ya 12 digit se lamba order number hota hai, to generated invoice download nahi hoti aur corrupted file aati hai.

Developer note: Encoding UTF-8 format me fix karna hoga.`,
      module: 'Billing',
      priority: 'High',
      status: 'process',
      createdBy: 'Pooja (Staff)',
      assignedTo: 'Rohit Dev',
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: 'Rohit Dev',
          role: 'Developer',
          text: 'Maine UTF-8 sanitize filter lagaya hai. Local build me pass ho gaya, staging par deploy kar raha hoon.',
          attachments: [],
          statusChange: 'Moved to In Process',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'TP-103',
      title: 'Staff management dashboard table header color light background me clear nahi tha',
      description: `Testing point:
Staff list table ke header me text contrast issue tha, padhne me dikkat aa rahi thi.`,
      module: 'UI Design',
      priority: 'Low',
      status: 'done',
      createdBy: 'Sneha (Tester)',
      assignedTo: 'Kiran Dev',
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: 'Kiran Dev',
          role: 'Developer',
          text: 'CSS header color update kar diya hai. Contrast ratio 4.5:1 kar diya.',
          attachments: [],
          createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
        },
        {
          id: uuidv4(),
          author: 'Sneha (Tester)',
          role: 'Staff/Tester',
          text: 'Check kar liya hai, ab bilkul clear dikh raha hai. Checked & Done!',
          attachments: [],
          statusChange: 'Marked Done',
          createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
    }
  ];
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

const generateNextId = (points) => {
  let maxNum = 1000;
  points.forEach(p => {
    if (p.id && p.id.startsWith('TP-')) {
      const num = parseInt(p.id.replace('TP-', ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  return `TP-${maxNum + 1}`;
};

// ================= API ROUTES =================

// 1. Health check & Config status
app.get('/api/config', (req, res) => {
  res.json({
    status: 'ok',
    cloudinaryEnabled: isCloudinaryConfigured,
    storageType: isCloudinaryConfigured ? 'Cloudinary Cloud Storage' : 'Local Disk Storage (/uploads)',
    timestamp: new Date().toISOString()
  });
});

// 2. Dashboard Statistics
app.get('/api/stats', (req, res) => {
  const points = loadPoints();
  const pendingCount = points.filter(p => normalizeStatus(p.status) === 'pending').length;
  const processCount = points.filter(p => normalizeStatus(p.status) === 'process').length;
  const doneCount = points.filter(p => normalizeStatus(p.status) === 'done').length;

  const stats = {
    total: points.length,
    pending: pendingCount,
    process: processCount,
    done: doneCount,
    // backwards compatibility keys
    new: pendingCount,
    in_progress: processCount,
    retest: 0,
    critical: points.filter(p => p.priority === 'Critical' && normalizeStatus(p.status) !== 'done').length,
    high: points.filter(p => p.priority === 'High' && normalizeStatus(p.status) !== 'done').length,
  };
  res.json(stats);
});

// 3. Get all testing points (with optional filters)
app.get('/api/points', (req, res) => {
  let points = loadPoints();
  const { status, priority, module: mod, search } = req.query;

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

  // Sort: most recently updated first
  points.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  res.json(points);
});

// 4. Get single testing point
app.get('/api/points/:id', (req, res) => {
  const points = loadPoints();
  const point = points.find(p => p.id === req.params.id);
  if (!point) {
    return res.status(404).json({ error: 'Testing point not found' });
  }
  res.json(point);
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

    const points = loadPoints();
    const newId = generateNextId(points);

    // Process image attachments
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

    points.unshift(newPoint);
    savePoints(points);

    res.status(201).json(newPoint);
  } catch (err) {
    console.error('Error creating point:', err);
    res.status(500).json({ error: err.message || 'Failed to create testing point' });
  }
});

// 6. Update testing point fields (status, priority, assignedTo, description, etc.)
app.patch('/api/points/:id', (req, res) => {
  try {
    const points = loadPoints();
    const index = points.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Testing point not found' });
    }

    const point = points[index];
    const prevStatus = point.status;
    const { status, priority, assignedTo, title, description, module: newMod, updatedBy } = req.body;

    let hasStatusChanged = false;
    let statusLogText = '';

    if (status && status !== point.status) {
      hasStatusChanged = true;
      const statusLabels = {
        new: 'New / To Test',
        in_progress: 'In Progress / Dev Fixing',
        retest: 'Ready for Re-Test',
        done: 'Verified & Done'
      };
      statusLogText = `Status updated from "${statusLabels[point.status] || point.status}" to "${statusLabels[status] || status}"`;
      point.status = status;
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
        role: status === 'in_progress' ? 'Developer' : (status === 'done' ? 'Tester' : 'Staff'),
        text: statusLogText,
        attachments: [],
        statusChange: statusLogText,
        createdAt: point.updatedAt
      });
    }

    savePoints(points);
    res.json(point);
  } catch (err) {
    console.error('Error updating point:', err);
    res.status(500).json({ error: 'Failed to update testing point' });
  }
});

// 7. Add Comment to testing point (supports image attachment)
app.post('/api/points/:id/comments', upload.array('images', 3), async (req, res) => {
  try {
    const points = loadPoints();
    const index = points.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Testing point not found' });
    }

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
    let statusChangeNotice = null;

    // Optional status change along with the comment (e.g. Developer comments "Fixed" and moves to Re-Test)
    if (nextStatus && nextStatus !== points[index].status) {
      const oldStatus = points[index].status;
      points[index].status = nextStatus;
      statusChangeNotice = `Status changed: ${oldStatus} ➜ ${nextStatus}`;
    }

    const newComment = {
      id: uuidv4(),
      author: author ? author.trim() : 'Team Member',
      role: role || 'Developer',
      text: text ? text.trim() : '',
      attachments,
      statusChange: statusChangeNotice,
      createdAt: now
    };

    points[index].comments = points[index].comments || [];
    points[index].comments.push(newComment);
    points[index].updatedAt = now;

    savePoints(points);

    res.status(201).json({ comment: newComment, updatedPoint: points[index] });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: err.message || 'Failed to add comment' });
  }
});

// 8. Delete a testing point
app.delete('/api/points/:id', (req, res) => {
  try {
    let points = loadPoints();
    const exists = points.some(p => p.id === req.params.id);
    if (!exists) {
      return res.status(404).json({ error: 'Testing point not found' });
    }
    points = points.filter(p => p.id !== req.params.id);
    savePoints(points);
    res.json({ success: true, message: `Point ${req.params.id} deleted` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete point' });
  }
});

// 9. Reset seed data endpoint (handy for demo)
app.post('/api/reset-demo', (req, res) => {
  const initial = getInitialSeedData();
  savePoints(initial);
  res.json({ success: true, message: 'Demo data reset successfully', points: initial });
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
  console.log(`🚀 QA & Dev Testing Point Tracker is running!`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`☁️ Cloudinary: ${isCloudinaryConfigured ? 'Enabled' : 'Disabled (Local /uploads fallback)'}`);
  console.log(`=================================================`);
});
