const fs = require('fs');
const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { uploadImageAsBase64, getCloudinaryConfigError } = require('../config/cloudinary');

async function fileExists(p) {
  try { await fs.promises.access(p); return true; } catch (e) { return false; }
}

function mimeFromFilename(name) {
  const ext = path.extname(name || '').toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

(async function migrate() {
  try {
    const cfgErr = getCloudinaryConfigError();
    if (cfgErr) {
      console.error('Cloudinary config error:', cfgErr);
      process.exit(1);
    }

    const dataDir = path.join(__dirname, '..', 'data');
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const productsFile = path.join(dataDir, 'products.json');

    const products = await readJson(productsFile, []);
    if (!Array.isArray(products) || !products.length) {
      console.log('No products to migrate.');
      return process.exit(0);
    }

    const backupFile = path.join(dataDir, `products.json.bak.${Date.now()}`);
    await fs.promises.copyFile(productsFile, backupFile);
    console.log('Backup written to', backupFile);

    let uploadedCount = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      const processEntry = async (val) => {
        if (!val) return val;
        const s = String(val).trim();
        // matches http://localhost:5000/uploads/filename or /uploads/filename or uploads/filename or localhost:5000/uploads/filename
        const m = s.match(/(?:https?:\/\/[^/]+\/)?(?:uploads\/(.+)|([^\s]+?:\d+\/uploads\/(.+))|(?:\/uploads\/(.+)))/i);
        // Better approach: extract filename from path
        let filename = null;
        if (/uploads\//i.test(s)) {
          const parts = s.split(/uploads\//i);
          filename = parts[1] || null;
        }

        if (!filename) return s;

        // if already a cloudinary url, skip
        if (/res\.cloudinary\.com\//i.test(s)) return s;

        const filePath = path.join(uploadsDir, filename);
        const exists = await fileExists(filePath);
        if (!exists) {
          console.warn('Local file not found for', filename, '- leaving original value.');
          return s;
        }

        // upload
        try {
          const buf = await fs.promises.readFile(filePath);
          const mime = mimeFromFilename(filename);
          const res = await uploadImageAsBase64(buf, mime, { public_id: `migrate-${Date.now()}-${Math.random().toString(36).slice(2,6)}` });
          if (res && res.secure_url) {
            uploadedCount++;
            console.log(`Uploaded ${filename} -> ${res.secure_url}`);
            return res.secure_url;
          }
        } catch (err) {
          console.error('Upload failed for', filename, err.message || err);
          return s;
        }

        return s;
      };

      // process main image
      try {
        p.image = await processEntry(p.image);
      } catch (e) {
        console.error('Error processing product image for', p._id, e);
      }

      // process images array
      if (Array.isArray(p.images)) {
        const next = [];
        for (const img of p.images) {
          try {
            const v = await processEntry(img);
            next.push(v);
          } catch (e) {
            next.push(img);
          }
        }
        p.images = next;
      }

      products[i] = p;
    }

    await writeJson(productsFile, products);
    console.log(`Migration complete. Uploaded ${uploadedCount} files. products.json updated.`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
