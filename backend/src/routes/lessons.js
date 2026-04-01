const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const upload = require('../config/multer');

// Level routes
router.get('/levels', lessonController.getAllLevels);

// Lektion routes
router.get('/lektions/:levelId', lessonController.getLektionsByLevel);

// Vocabulary routes
router.get('/vocab/:lektionId', lessonController.getVocabByLektion);
router.post('/vocab', upload.single('image'), lessonController.createVocab);
router.put('/vocab/:id', upload.single('image'), lessonController.updateVocab);
router.delete('/vocab/:id', lessonController.deleteVocab);

module.exports = router;
