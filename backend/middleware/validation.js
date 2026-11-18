const { z } = require('zod');

// Schema Definitions
const schemas = {
    // Auth Schemas
    login: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters')
    }),

    setPassword: z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        token: z.string().min(1, 'Token is required')
    }),

    forgotPassword: z.object({
        email: z.string().email('Invalid email address')
    }),

    resetPassword: z.object({
        email: z.string().email(),
        token: z.string().min(1, 'Token is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters')
    }),

    // Request Schemas
    createRequest: z.object({
        customerName: z.string().min(2, 'Name is required'),
        customerEmail: z.string().email('Invalid email address'),
        address: z.string().min(5, 'Address is required'),
        problemDescription: z.string().min(10, 'Please provide more detail about the issue'),
        serviceType: z.enum(['plumbing', 'electrical', 'hvac', 'general', 'carpentry', 'painting', 'other']).optional()
    })
};

// Validation Middleware
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};

module.exports = {
    schemas,
    validate
};
