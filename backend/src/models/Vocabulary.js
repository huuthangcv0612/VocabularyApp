const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema(
  {
    lektion_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lektion',
      required: [true, 'ID bài học là bắt buộc'],
    },
    word: {
      type: String,
      required: [true, 'Từ là bắt buộc'],
      trim: true,
    },
    meaning: {
      type: String,
      required: [true, 'Ý nghĩa là bắt buộc'],
      trim: true,
    },
    image_url: {
      type: String,
      trim: true,
    },
    pronunciation: {
      type: String,
      trim: true,
    },
    example_sentences: [
      {
        german: String,
        vietnamese: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vocabulary', vocabularySchema);
