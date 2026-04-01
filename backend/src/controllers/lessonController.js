const Level = require('../models/Level');
const Lektion = require('../models/Lektion');
const Vocabulary = require('../models/Vocabulary');
const path = require('path');

// Get all levels
exports.getAllLevels = async (req, res, next) => {
  try {
    const levels = await Level.find().sort({ order: 1 });
    res.json(levels);
  } catch (err) {
    next(err);
  }
};

// Get lektions by level
exports.getLektionsByLevel = async (req, res, next) => {
  try {
    const { levelId } = req.params;
    const lektions = await Lektion.find({ level_id: levelId }).sort({ order: 1 });
    res.json(lektions);
  } catch (err) {
    next(err);
  }
};

// Get vocabularies by lektion
exports.getVocabByLektion = async (req, res, next) => {
  try {
    const { lektionId } = req.params;
    const vocabularies = await Vocabulary.find({ lektion_id: lektionId });
    res.json(vocabularies);
  } catch (err) {
    next(err);
  }
};

// Create vocabulary with image
exports.createVocab = async (req, res, next) => {
  try {
    const { word, meaning, lektion_id } = req.body;

    if (!word || !meaning || !lektion_id) {
      return res.status(400).json({ error: 'word, meaning, lektion_id là bắt buộc' });
    }

    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const vocab = new Vocabulary({
      word,
      meaning,
      lektion_id,
      image_url,
    });

    const savedVocab = await vocab.save();
    res.status(201).json({ message: 'OK', data: savedVocab });
  } catch (err) {
    next(err);
  }
};

// Update vocabulary
exports.updateVocab = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { word, meaning, pronunciation, example_sentences } = req.body;

    const updateData = {};
    if (word) updateData.word = word;
    if (meaning) updateData.meaning = meaning;
    if (pronunciation) updateData.pronunciation = pronunciation;
    if (example_sentences) updateData.example_sentences = example_sentences;
    if (req.file) {
      updateData.image_url = `/uploads/${req.file.filename}`;
    }

    const updatedVocab = await Vocabulary.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedVocab) {
      return res.status(404).json({ error: 'Không tìm thấy từ vựng' });
    }

    res.json({ message: 'Cập nhật thành công', data: updatedVocab });
  } catch (err) {
    next(err);
  }
};

// Delete vocabulary
exports.deleteVocab = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedVocab = await Vocabulary.findByIdAndDelete(id);

    if (!deletedVocab) {
      return res.status(404).json({ error: 'Không tìm thấy từ vựng' });
    }

    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    next(err);
  }
};
