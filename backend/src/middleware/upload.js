const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Store under a UUID to avoid collisions/overwrites and to avoid
    // trusting user-supplied filenames on disk. Original name is kept
    // separately in the database for display.
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const maxSizeMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '200', 10);

const upload = multer({
  storage,
  limits: { fileSize: maxSizeMb * 1024 * 1024 },
});

module.exports = upload;
