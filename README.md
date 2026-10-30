# 🚀 DevTest Hub - Staff & Developer Testing Management System

Staff aur Developer team ke liye ek well-structured, fast aur modern Testing Points & Bug Tracking system.
Isme testers/staff testing points log kar sakte hai, developer fix kar sakte hai, 1-click me tab-by-tab status move ho sakta hai, screenshots upload ho sakti hai (Cloudinary & Local), aur threaded comment system ke sath re-testing ho sakti hai.

---

## 🌟 Key Features

1. **📑 Tab-by-Tab Workflow (Dynamic Stages)**:
   - 📝 **New / To Test**: Tester ya staff ke dale hue fresh testing points.
   - ⚙️ **In Progress**: Developer points ko open karke fix karna shuru karta hai.
   - 🔄 **Ready for Re-Test**: Developer fix karne ke baad comment dal kar testing ke liye wapas bhejta hai.
   - ✅ **Done / Verified**: Tester point ko verify karke Done mark karta hai to point "Done" tab me chala jata hai.
   - 🗂️ **All Points**: Ek jagah par sabhi tasks ka consolidated view.

2. **💬 Rich Comment & Re-testing System**:
   - Har testing point ke andar full chronological discussion thread.
   - Developer fix ka note likh sakta hai (e.g. commit hash, staging link).
   - Comment ke sath sath status change karne ka option (e.g. comment post karte hi point automatically "Ready for Re-Test" ho jayega).
   - Roles badge: 🛠️ Developer, 🧪 QA/Tester, 👤 Staff/Lead.

3. **📝 Large Text & Formatted Notes**:
   - Long testing steps, steps to reproduce, actual vs expected results.
   - "Insert QA Template" button for quick standardized bug reporting.

4. **☁️ Cloudinary & Local Image Uploads**:
   - Testing point create karte waqt multiple screenshots / proof images upload kar sakte hai.
   - Har comment ke sath bhi screenshot attach karne ki suvidha (e.g. bug screenshot or fix evidence).
   - **Dual Storage Engine**:
     - Render/Production me **Cloudinary** use hota hai (persistent cloud storage).
     - Local machine me agar Cloudinary keys na ho to automatically **`/uploads` local disk** fallback use hota hai (bina kisi error ke app smoothly chalegi!).
   - HD Lightbox Image Zoom: Kisi bhi image par click karke full-screen high resolution me dekh sakte hai.

5. **🔍 Advanced Filters & Dual View**:
   - Live instant search (Title, ID, Description, Creator, Assignee).
   - Filter by Module (Authentication, Billing, Frontend, Backend, UI/UX, etc.).
   - Filter by Priority (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low).
   - **View Toggle**: Modern Grid Card View & 4-Column Kanban Board View!

---

## 📁 Project Directory Structure

```text
dev-qa-tracker/
├── server.js              # Express Backend API & Static server
├── package.json           # Dependencies & start scripts
├── render.yaml            # Render Blueprint deployment configuration
├── .env.example           # Environment variables sample
├── .env                   # Local environment file
├── data/
│   └── testing_points.json# Persistent JSON database (auto-seeded)
├── uploads/               # Local fallback image uploads directory
└── public/
    ├── index.html         # Modern responsive dashboard UI
    ├── css/
    │   └── style.css      # Dark glassmorphism modern UI styling
    └── js/
        ├── api.js         # Decoupled REST API Client
        └── app.js         # Reactive UI, tabs, comments & image handling
```

---

## 🔐 Admin & User Authentication (Login / Signup)

Software me staff aur developer team ke liye authentication system shuru kar diya gaya hai:

### 1. Pre-set Admin Account:
- **Email**: `admin@shifteronline.com`
- **Default Password**: `admin123`

### 🔑 Admin Password Kahan Badalna Hai?
Aap do aasan tareeqo se admin password set kar sakte hain:
1. **`.env` file me**:
   ```env
   ADMIN_PASSWORD=apna_naya_password
   ```
2. **`server.js` file me line ~38 par**:
   ```javascript
   const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'apna_naya_password'; // <-- Yahan likhein
   ```
3. **Render.com par live karte waqt**:
   Render Dashboard me **Environment** tab me ja kar `ADMIN_PASSWORD` variable add kar dein.

---

## 💻 Local Machine Setup & Run

### 1. Requirements:
- Node.js (v18+)

### 2. Run Locally:
```bash
# Terminal me project folder me jayein:
cd dev-qa-tracker

# Dependencies install karein:
npm install

# Server start karein:
npm start
```

Browser me open karein:
👉 **`http://localhost:3000`**

---

## ☁️ Cloudinary Configuration (Optional but Recommended)

Agar aap screenshots ko permanent cloud storage par save karna chahte hai:
1. [Cloudinary.com](https://cloudinary.com/) par free account banayein.
2. Dashboard se `Cloud Name`, `API Key`, aur `API Secret` copy karein.
3. `.env` file me paste karein:
```env
PORT=3000
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

*(Note: Agar aap ye 3 variables nahi dalenge to app bina ruke local `/uploads` folder use karegi).*

---

## 🚀 Render.com Deployment Guide (Live Kaise Karein)

App Render par 1-click me deploy hone ke liye 100% ready hai:

### Step 1: GitHub par code push karein
```bash
git init
git add .
git commit -m "Initial commit of DevTest Hub"
git branch -M main
git remote add origin https://github.com/<your-username>/dev-qa-tracker.git
git push -u origin main
```

### Step 2: Render.com par New Web Service banayein
1. [Render.com](https://render.com) par login karein.
2. **"New +"** button par click karke **"Web Service"** select karein.
3. Apna GitHub repository connect karein.
4. Settings me ye configure karein:
   - **Name**: `dev-qa-tracker` (ya koi bhi naam)
   - **Language/Environment**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free`

### Step 3: Environment Variables (Render Dashboard)
Render Web Service ke **"Environment"** tab me jayein aur ye variables add karein:
- `NODE_ENV` = `production`
- `PORT` = `10000` (ya Render auto-assign karta hai)
- `CLOUDINARY_CLOUD_NAME` = `<Aapka Cloudinary Cloud Name>`
- `CLOUDINARY_API_KEY` = `<Aapki Cloudinary API Key>`
- `CLOUDINARY_API_SECRET` = `<Aapka Cloudinary Secret>`

### Step 4: Click "Deploy Web Service"
2 minute ke andar aapka application Render par live URL ke sath chalu ho jayega! (e.g. `https://dev-qa-tracker.onrender.com`).
