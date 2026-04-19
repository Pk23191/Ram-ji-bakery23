# Quick Start Guide - Ramji Bakery Development

## 🚀 First Time Setup

```bash
# 1. Clone repository
git clone <your-repo-url>
cd "Ram ji bakery"

# 2. Install everything
npm run install:all

# 3. Create .env file in server/ (use .env.example as template)
cp server/.env.example server/.env

# 4. Create .env.local in client/ (optional, use relative API paths for dev)
# Leave NEXT_PUBLIC_API_URL commented or use: http://localhost:5000/api

# 5. Start development
npm run dev

# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Admin: http://localhost:3000/admin
```

---

## 📋 Common Commands

```bash
# Development (all services)
npm run dev

# Frontend only
npm run client:dev

# Backend only  
npm run server:dev

# Build
npm run build:all

# Install dependencies
npm run install:all

# Build frontend
npm run client:build

# Start server (production mode)
npm run server:start
```

---

## 🔧 Environment Variables (.env)

### Required Variables

```bash
# Database
MONGO_URI=mongodb://127.0.0.1:27017/ramji-bakery

# Cloudinary (Image Hosting)
CLOUDINARY_CLOUD_NAME=dxjhtsb2s
CLOUDINARY_API_KEY=956249967932616
CLOUDINARY_API_SECRET=gZx0FQ2vHts9c1UxkMYFuHUEHmc

# Security
JWT_SECRET=ramji123securekey

# Admin
ADMIN_EMAIL=admin@ramjibakery.in
ADMIN_PASSWORD=admin123
```

---

## 🧪 Testing Product Features

### Test Add Product
1. Go to http://localhost:3000/admin
2. Login with `admin@ramjibakery.in` / `admin123`
3. Click "Products" tab
4. Fill form:
   - Name: "Chocolate Cake"
   - Price: "499"
   - Category: "cake"
5. Upload image from your device
6. Click "Save Product"
7. ✅ Should appear in product list

### Test Image Upload
1. Upload a JPG (max 5MB)
2. ✅ Image should appear in form preview
3. Go to frontend and ✅ image should display

### Test Product Display
1. Go to http://localhost:3000/menu
2. ✅ Products should load and display
3. ✅ Images should show with loading state
4. Click "Add to Cart"
5. Go to cart, ✅ product should be there

---

## 🐛 Debugging

### Check API Connection
```javascript
// In browser console:
fetch('/api/products').then(r => r.json()).then(console.log)
```

### Check Console Errors
Press `F12` in browser, go to Console tab

### Check Network Errors
Press `F12`, go to Network tab, refresh page, check failed requests

### Backend Logs
```bash
# Terminal should show:
✅ MongoDB connected
✅ Cloudinary configured successfully
✅ Server listening on port 5000
```

---

## 📁 Project Structure

```
Ram ji bakery/
├── client/                    # Next.js Frontend
│   ├── pages/                # Routes (/menu, /cart, /admin, etc)
│   ├── components/           # React components
│   ├── utils/                # Helpers (api.js, helpers.js)
│   ├── styles/               # Global CSS
│   ├── public/               # Static files
│   └── next.config.js        # Next.js config
│
├── server/                    # Express.js Backend
│   ├── routes/               # API routes (/api/products, /api/upload)
│   ├── controllers/          # Business logic (productController.js)
│   ├── models/               # MongoDB schemas (Product.js)
│   ├── middleware/           # Auth, validation, error handling
│   ├── config/               # Database, Cloudinary config
│   ├── data/                 # JSON storage (products, admins)
│   └── server.js             # Entry point
│
├── vercel.json               # Vercel deployment config
├── DEPLOYMENT_GUIDE.md       # Production deployment guide
└── README.md                 # Project overview
```

---

## 🔑 File Purposes

### Critical Files (Don't Delete!)
```
server/routes/server.js        - Express app with CORS & middleware
server/routes/productRoutes.js - Product API endpoints
client/pages/_app.js           - React wrapper (ErrorBoundary)
client/utils/api.js            - Axios client with auth
vercel.json                    - Routing config for production
```

### Important URLs

| Page | URL | Purpose |
|------|-----|---------|
| Home | `/` | Homepage |
| Menu | `/menu` | Product listing |
| Cake | `/cakes` | Cake products |
| Pastry | `/party` | Party/pastry items |
| Cart | `/cart` | Shopping cart |
| Admin | `/admin` | Admin panel |
| Admin Products | `/admin/products` | Product management |

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Port 3000 already in use | `npx kill-port 3000` |
| Port 5000 already in use | `npx kill-port 5000` |
| MongoDB not running | Start with: `brew services start mongodb-community` |
| Image upload fails | Check Cloudinary credentials in .env |
| API 404 errors | Check `NEXT_PUBLIC_API_URL` or ensure backend running |
| Admin login fails | Check ADMIN_EMAIL and ADMIN_PASSWORD in .env |

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# After merge, Vercel auto-deploys!
```

---

## 📊 Next.js Build Info

```bash
# Analyze build size
npm run client:build

# Output shows:
# ✓ Compiled 25 pages
# ✓ Total: 500KB (should be < 2MB)
```

---

## 🔒 Security Notes

- Never commit `.env` file
- Never expose CLOUDINARY_API_SECRET
- Always use HTTPS in production
- Validate all user inputs (backend)
- Keep dependencies updated: `npm audit`

---

**Need help?** Check DEPLOYMENT_GUIDE.md for production issues.
