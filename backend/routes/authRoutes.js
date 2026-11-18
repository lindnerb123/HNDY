const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, schemas } = require('../middleware/validation');
const { authLimiter } = require('../middleware/security');

router.post('/auth/login', authLimiter, validate(schemas.login), authController.login);
router.post('/auth/set-password', validate(schemas.setPassword), authController.setPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/auth/forgot-password', validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/auth/reset-password', validate(schemas.resetPassword), authController.resetPassword);

module.exports = router;

