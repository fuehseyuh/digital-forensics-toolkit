const crypto = require('crypto');
const fs = require('fs');

/**
 * Computes MD5, SHA-1, and SHA-256 hashes of a file using streams,
 * so large evidence files don't get loaded fully into memory.
 * @param {string} filePath - absolute path to the file on disk
 * @returns {Promise<{md5: string, sha1: string, sha256: string}>}
 */
function computeHashes(filePath) {
  return new Promise((resolve, reject) => {
    const md5 = crypto.createHash('md5');
    const sha1 = crypto.createHash('sha1');
    const sha256 = crypto.createHash('sha256');

    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => {
      md5.update(chunk);
      sha1.update(chunk);
      sha256.update(chunk);
    });

    stream.on('end', () => {
      resolve({
        md5: md5.digest('hex'),
        sha1: sha1.digest('hex'),
        sha256: sha256.digest('hex'),
      });
    });

    stream.on('error', (err) => reject(err));
  });
}

/**
 * Re-verifies a file's integrity by recomputing its SHA-256 and
 * comparing against a previously stored hash. Used to detect tampering.
 * @param {string} filePath
 * @param {string} originalSha256
 * @returns {Promise<boolean>}
 */
async function verifyIntegrity(filePath, originalSha256) {
  const { sha256 } = await computeHashes(filePath);
  return sha256 === originalSha256;
}

module.exports = { computeHashes, verifyIntegrity };
