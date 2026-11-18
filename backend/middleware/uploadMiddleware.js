const { upload } = require('../config/storage');
const multer = require('multer');

const handleFileUpload = (req, res, next) => {
    const uploadMiddleware = upload.array('files');

    uploadMiddleware(req, res, (err) => {
        if (err) {
            console.error('❌ File upload error:', err);

            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(413).json({
                        success: false,
                        message: 'File too large. Maximum size is 100MB per file.',
                        error: 'FILE_TOO_LARGE'
                    });
                }
                if (err.code === 'LIMIT_FILE_COUNT') {
                    return res.status(413).json({
                        success: false,
                        message: 'Too many files. Maximum is 10 files per request.',
                        error: 'TOO_MANY_FILES'
                    });
                }
            }

            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed',
                error: 'UPLOAD_ERROR'
            });
        }
        next();
    });
};

module.exports = handleFileUpload;
