const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema(
  {
    level_name: {
      type: String,
      required: [true, 'Tên cấp độ là bắt buộc'],
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

module.exports = mongoose.model('Level', levelSchema);
