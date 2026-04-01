# Backend - Vocabulary Learning App

Professional Node.js + Express + MongoDB backend for the Vocabulary Learning Application.

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.js           # MongoDB connection
│   │   └── multer.js       # File upload configuration
│   ├── middleware/          # Express middleware
│   │   └── errorHandler.js # Global error handler
│   ├── models/              # MongoDB schemas
│   │   ├── Level.js        # Level model
│   │   ├── Lektion.js      # Lesson model
│   │   └── Vocabulary.js   # Vocabulary model
│   ├── controllers/         # Business logic
│   │   ├── lessonController.js   # Lesson/vocab operations
│   │   └── grammarController.js  # Grammar checking
│   ├── routes/              # API routes
│   │   ├── index.js        # Route aggregator
│   │   ├── lessons.js      # Lesson routes
│   │   └── grammar.js      # Grammar routes
│   ├── utils/               # Utility functions
│   │   └── grammar.js      # Grammar checking helpers
│   └── app.js              # Express app setup
├── uploads/                 # Uploaded images directory
├── .env                     # Environment variables (local)
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies
└── server.js               # Entry point
```

## Features

- ✅ **MongoDB Integration** - Ready for MongoDB database
- ✅ **RESTful API** - Well-organized routes and controllers
- ✅ **File Uploads** - Image upload with multer
- ✅ **Grammar Checking** - Integration with LanguageTool API
- ✅ **Error Handling** - Centralized error handling middleware
- ✅ **Environment Configuration** - Configurable via .env
- ✅ **CORS Support** - Configured for frontend integration

## Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Create .env file from template
cp .env.example .env

# Edit .env with your settings:
MONGODB_URI=mongodb://localhost:27017/VocabularyApp
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

3. Start the server:
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## API Endpoints

### Lessons API

- `GET /api/lessons/levels` - Get all levels
- `GET /api/lessons/lektions/:levelId` - Get lessons by level
- `GET /api/lessons/vocab/:lektionId` - Get vocabularies by lesson
- `POST /api/lessons/vocab` - Create new vocabulary (with image)
- `PUT /api/lessons/vocab/:id` - Update vocabulary
- `DELETE /api/lessons/vocab/:id` - Delete vocabulary

### Grammar API

- `POST /api/grammar/check` - Check grammar
  - Request: `{ sentence: string, level?: string }`
  - Levels: A1.1, A1.2, A2.1, A2.2

- `POST /api/grammar/analyze` - Analyze sentence
  - Request: `{ sentence: string, targetWord?: string }`

## Database Schema

### Level
```javascript
{
  level_name: String,
  description: String,
  order: Number,
  timestamps: true
}
```

### Lektion
```javascript
{
  level_id: ObjectId (ref: Level),
  lektion_name: String,
  description: String,
  order: Number,
  timestamps: true
}
```

### Vocabulary
```javascript
{
  lektion_id: ObjectId (ref: Lektion),
  word: String,
  meaning: String,
  image_url: String,
  pronunciation: String,
  example_sentences: [
    {
      german: String,
      vietnamese: String
    }
  ],
  timestamps: true
}
```

## File Upload

- Location: `/uploads` directory
- Max file size: 5MB (configurable in .env)
- Allowed types: JPEG, PNG, GIF, WebP
- Access via: `http://localhost:3000/uploads/filename.ext`

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/VocabularyApp

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=http://localhost:5173

# Grammar API
LANGUAGE_TOOL_URL=https://api.languagetool.org/v2/check
```

## Migration from Old Backend

This backend has been restructured for scalability and maintainability:

- **Old**: MSSQL → **New**: MongoDB with Mongoose ODM
- **Old**: Single server.js → **New**: Modular MVC architecture
- **Old**: Mixed concerns → **New**: Separated controllers, routes, models
- **Old**: Config hardcoded → **New**: Environment-based configuration

All original functionality is preserved and compatible with the frontend.

## Development

### Adding a New Route

1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Import and use in `src/routes/index.js`

### Adding a New Model

1. Create schema in `src/models/`
2. Use in controllers via import

### Error Handling

All errors are caught by the global error handler in `src/middleware/errorHandler.js`. Errors are automatically formatted and returned as JSON.

## Testing

Run health check:
```bash
curl http://localhost:3000/health
```

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in .env
2. Use MongoDB Atlas or managed MongoDB service
3. Use a process manager (PM2, forever, etc.)
4. Set up proper logging
5. Configure CORS for production domain
6. Use HTTPS

Example PM2 startup:
```bash
pm2 start server.js --name "vocab-backend"
pm2 save
pm2 startup
```

## License

ISC
