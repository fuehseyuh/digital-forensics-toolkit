const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadEvidence,
  getEvidenceDetail,
  reverifyIntegrity,
} = require('../controllers/evidenceController');

router.post('/case/:caseId/upload', authenticate, upload.single('file'), uploadEvidence);
router.get('/:evidenceId', authenticate, getEvidenceDetail);
router.post('/:evidenceId/reverify', authenticate, reverifyIntegrity);

module.exports = router;
