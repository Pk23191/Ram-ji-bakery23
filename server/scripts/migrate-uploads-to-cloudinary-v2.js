const fs = require('fs');
const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { uploadImageAsBase64, uploadImageBuffer, getCloudinaryConfigError } = require('../config/cloudinary');

(async function() {
  try {
    const cfgErr = getCloudinaryConfigError();
    if (cfgErr) {
      console.error('Cloudinary config error:', cfgErr);
      process.exit(1);
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const dataDir = path.join(__dirname, '..', 'data');
    const productsFile = path.join(dataDir, 'products.json');

    const files = await fs.promises.readdir(uploadsDir);
    const imageFiles = files.filter((f) => !f.startsWith('.') && /\.(jpe?g|png|gif)$/i.test(f));
    if (!imageFiles.length) {
      console.log('No image files found in uploads/');
      return;
    }

    console.log(`Found ${imageFiles.length} files in uploads/`);

    const mapping = {};
    let uploaded = 0;

    async function uploadWithRetries(buf, mime, opts) {
      const maxAttempts = 3;
      let attempt = 0;
      while (attempt < maxAttempts) {
        attempt++;
        try {
          const res = await uploadImageBuffer(buf, { public_id: opts.public_id, resource_type: 'image', folder: 'ramji-bakery/products' });
          return res;
        } catch (err) {
          console.error(`Upload attempt ${attempt} failed for ${opts.filename}:`, err && err.message ? err.message : err);
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
      }
      throw new Error(`Failed to upload ${opts.filename} after ${maxAttempts} attempts`);
    }

    for (const filename of imageFiles) {
      const filepath = path.join(uploadsDir, filename);
      try {
        const buf = await fs.promises.readFile(filepath);
        const mime = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const res = await uploadWithRetries(buf, mime, { filename, public_id: `migrate-${path.parse(filename).name}-${Date.now()}` });
        if (res && res.secure_url) {
          mapping[filename] = res.secure_url;
          uploaded++;
          console.log(`Uploaded ${filename} -> ${res.secure_url}`);
        }
      } catch (err) {
        console.error('Upload failed for', filename, err && err.message ? err.message : err);
      }
    }

    if (!uploaded) {
      console.log('No files uploaded, aborting update.');
      return;
    }

    console.log(`Uploaded ${uploaded} files. Preparing to update products.json with ${Object.keys(mapping).length} mappings.`);

    const products = await readJson(productsFile, []);
    const backup = path.join(dataDir, `products.json.bak.${Date.now()}`);
    await fs.promises.copyFile(productsFile, backup);
    console.log('Backup created at', backup);

    const escapeForRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const updated = products.map((p) => {
      const clone = JSON.parse(JSON.stringify(p));

      const replaceIfLocal = (val) => {
        if (!val) return val;
        let s = String(val);
        for (const [fn, url] of Object.entries(mapping)) {
          // Replace either bare filename or any /uploads/<filename> with the cloudinary url
          const fnEsc = escapeForRegex(fn);
          // Try replacing the full localhost uploads URL first, then any /uploads/<filename>, then the bare filename
          // If a previous run accidentally left '/uploads/https://...' remove the '/uploads/' prefix
          if (/(https?:\/\/[^\/]+)?\/uploads\/(https?:\/\/)/.test(s)) {
            // remove any host+/uploads/ when it is followed by a protocol (i.e. /uploads/https://...)
            s = s.replace(/(https?:\/\/[^\/]+)?\/uploads\/(https?:\/\/)/g, '$2');
            if (s.startsWith('http')) {
              // now s should be the cloudinary URL or similar
              continue;
            }
          }

          // If the string contains the uploads path or the filename, replace the whole value with the cloudinary url.
          if (s.includes(`/uploads/${fn}`) || s.includes(fn)) {
            s = url;
            continue;
          }
        }
        return s;
      };

      clone.image = replaceIfLocal(clone.image);
      if (Array.isArray(clone.images)) {
        clone.images = clone.images.map(replaceIfLocal);
      }
      return clone;
    });

    await writeJson(productsFile, updated);
    console.log(`Migration finished. Uploaded ${uploaded} files and updated products.json.`);
  } catch (err) {
    console.error('Migration V2 failed:', err);
    process.exit(1);
  }
})();
