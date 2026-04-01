const express = require('express');
const lessonRoutes = require('./lessons');
const grammarRoutes = require('./grammar');

const router = express.Router();

// Define all route groups
router.use('/lessons', lessonRoutes);
router.use('/grammar', grammarRoutes);

// Serve uploads
router.use('/uploads', express.static('uploads'));

module.exports = router;
