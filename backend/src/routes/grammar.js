const express = require('express');
const router = express.Router();
const grammarController = require('../controllers/grammarController');

// Grammar checking routes
router.post('/check', grammarController.checkGrammar);
router.post('/analyze', grammarController.analyzeSentence);

module.exports = router;
