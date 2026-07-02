const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { createCase, listCases, getCase, updateCaseStatus, deleteCase } = require('../controllers/caseController');

router.post('/', authenticate, createCase);
router.get('/', authenticate, listCases);
router.get('/:id', authenticate, getCase);
router.patch('/:id/status', authenticate, updateCaseStatus);
router.delete('/:id', authenticate, deleteCase);

module.exports = router;