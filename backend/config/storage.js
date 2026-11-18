const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('✅ Cloudinary configured with cloud:', process.env.CLOUDINARY_CLOUD_NAME);

// Test Cloudinary connection
cloudinary.api.ping()
    .then(() => console.log('✅ Cloudinary connection successful'))
    .catch((error) => console.error('❌ Cloudinary connection failed:', error.message));

// Cloudinary Storage Configuration
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hndy-uploads',
        resource_type: 'auto',
        public_id: (req, file) => {
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            return `${file.fieldname}-${timestamp}-${random}`;
        },
        transformation: [
            {
                quality: 'auto',
                fetch_format: 'auto'
            }
        ]
    },
});

// Multer configuration with Cloudinary storage
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 200 * 1024 * 1024,
        files: 10,
        fieldSize: 200 * 1024 * 1024,
        fieldNameSize: 100,
        fields: 20
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image, video, and PDF files are allowed!'), false);
        }
    }
});

module.exports = {
    upload,
    cloudinary
};
