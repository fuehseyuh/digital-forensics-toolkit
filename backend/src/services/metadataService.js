const { fromFile } = require('file-type');
const fs = require('fs');
const path = require('path');
const exifr = require('exifr');

// Maps common file extensions to their expected MIME type family.
// Used to flag when a file's real signature doesn't match its extension
// (a classic anti-forensics / disguise trick).
const EXTENSION_MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.exe': 'application/x-msdownload',
  '.7z': 'application/x-7z-compressed',
  '.rar': 'application/x-rar-compressed',
};

/**
 * Detects the true file type from magic bytes (file signature) rather than
 * trusting the file extension, and flags a mismatch if found.
 */
async function detectFileSignature(filePath, originalFilename) {
  const detected = await fromFile(filePath); // { ext, mime } or undefined
  const ext = path.extname(originalFilename).toLowerCase();
  const expectedMime = EXTENSION_MIME_MAP[ext];

  const detectedMime = detected ? detected.mime : null;
  const detectedExt = detected ? detected.ext : null;

  let mismatch = false;
  if (expectedMime && detectedMime && expectedMime !== detectedMime) {
    mismatch = true;
  }
  // Extension claims a known type but no signature could be detected at all
  if (expectedMime && !detected) {
    mismatch = true;
  }

  return {
    declaredMime: expectedMime || 'unknown/unrecognized-extension',
    detectedMime: detectedMime || 'unknown/undetectable',
    detectedExt: detectedExt || null,
    mismatch,
  };
}

/**
 * Extracts filesystem-level timestamps (MAC times: Modified, Accessed, Changed).
 */
function extractFilesystemMetadata(filePath) {
  const stats = fs.statSync(filePath);
  return {
    size_bytes: stats.size,
    modified_at: stats.mtime.toISOString(),
    accessed_at: stats.atime.toISOString(),
    changed_at: stats.ctime.toISOString(), // inode change time
    created_at: stats.birthtime.toISOString(),
  };
}

/**
 * Strips large binary-looking fields (raw thumbnail bytes, JFIF padding,
 * maker-note buffers) that some cameras/tools embed in EXIF data. Without
 * this, a single field can dump thousands of numbered byte entries into
 * the report, which is noise rather than forensic signal.
 */
function sanitizeExif(data) {
  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const isBloated =
      Array.isArray(value)
        ? value.length > 64
        : value && typeof value === 'object'
        ? Object.keys(value).length > 64
        : false;

    if (isBloated) continue; // drop raw byte-array/buffer-style fields
    clean[key] = value;
  }
  return clean;
}

/**
 * Extracts EXIF metadata from image files (camera model, GPS, timestamps, etc.)
 * Returns null gracefully if the file has no EXIF data (e.g. not an image, or stripped).
 */
async function extractExifMetadata(filePath) {
  try {
    const data = await exifr.parse(filePath, { gps: true });
    if (!data) return null;
    return sanitizeExif(data);
  } catch (err) {
    return null; // not an image, or no EXIF present — not an error condition
  }
}

module.exports = {
  detectFileSignature,
  extractFilesystemMetadata,
  extractExifMetadata,
};