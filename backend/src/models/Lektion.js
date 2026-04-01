const mongoose = require('mongoose');

const lektionSchema = new mongoose.Schema(
  {
    level_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
      required: [true, 'ID cấp độ là bắt buộc'],
    },
    lektion_name: {
      type: String,
      required: [true, 'Tên bài học là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lektion', lektionSchema);
