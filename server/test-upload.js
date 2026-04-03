const fs = require('fs');
const path = require('path');
const { uploadImageAsBase64, getCloudinaryConfigError } = require('./config/cloudinary');

(async () => {
  try {
    const error = getCloudinaryConfigError();
    if (error) {
      console.error('Config error:', error);
      process.exit(1);
    }

    const filePath = path.join(__dirname, '..', 'client', 'public', 'placeholder.png');
    const buf = fs.readFileSync(filePath);
    const mime = 'image/png';
    const res = await uploadImageAsBase64(buf, mime, { public_id: `test-upload-${Date.now()}` });
    console.log('Upload result:', res && res.secure_url);
  } catch (err) {
    console.error('Upload failed:', err);
    process.exit(1);
  }
})();
