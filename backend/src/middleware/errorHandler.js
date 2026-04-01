const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ error: 'Kích thước tệp quá lớn' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Quá nhiều tệp' });
    }
    return res.status(400).json({ error: 'Lỗi tải tệp: ' + err.message });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(500).json({ error: 'Lỗi cơ sở dữ liệu' });
  }

  // Generic error
  res.status(err.status || 500).json({
    error: err.message || 'Lỗi máy chủ nội bộ',
  });
};

module.exports = errorHandler;
