// File Storage Solution for Railway
// File: backend/file-storage.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Option 1: Railway Volume Storage (Recommended for Railway)
class RailwayVolumeStorage {
  constructor() {
    // Railway volumes persist at /app/data
    this.uploadDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/app/data/uploads';
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✅ Created upload directory: ${this.uploadDir}`);
    }
  }

  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
      }
    });

    return multer({ 
      storage: storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (req, file, cb) => {
        // Accept images and videos
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new Error('Only images and videos are allowed'), false);
        }
      }
    });
  }

  getFileUrl(filename) {
    return `/uploads/${filename}`;
  }

  getStaticMiddleware() {
    return (req, res, next) => {
      // Serve files from Railway volume
      if (req.path.startsWith('/uploads/')) {
        const filename = req.path.replace('/uploads/', '');
        const filePath = path.join(this.uploadDir, filename);
        
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).send('File not found');
        }
      } else {
        next();
      }
    };
  }
}

// Option 2: Cloudinary Cloud Storage (Alternative)
class CloudinaryStorage {
  constructor() {
    if (!process.env.CLOUDINARY_URL) {
      console.error('❌ CLOUDINARY_URL not configured');
      return;
    }
    
    this.cloudinary = require('cloudinary').v2;
    const { CloudinaryStorage } = require('multer-storage-cloudinary');
    
    this.storage = new CloudinaryStorage({
      cloudinary: this.cloudinary,
      params: {
        folder: 'hndy-uploads',
        resource_type: 'auto', // Supports images and videos
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'],
      },
    });
  }

  getMulterConfig() {
    return multer({ 
      storage: this.storage,
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });
  }

  getFileUrl(filename) {
    // Cloudinary provides full URLs
    return filename;
  }

  getStaticMiddleware() {
    // Not needed for Cloudinary - files are served directly from their CDN
    return (req, res, next) => next();
  }
}

// Factory function to choose storage based on environment
function createFileStorage() {
  if (process.env.CLOUDINARY_URL) {
    console.log('📁 Using Cloudinary storage');
    return new CloudinaryStorage();
  } else {
    console.log('📁 Using Railway volume storage');
    return new RailwayVolumeStorage();
  }
}

module.exports = createFileStorage();