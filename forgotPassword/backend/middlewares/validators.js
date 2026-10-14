const Joi = require('joi');

// 🛡️ Signup Validation
exports.validateSignup = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required() // Frontend par robust regex pehle hi hai
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 'fail', message: error.details[0].message });
    next();
};

// 🛡️ Login Validation
exports.validateLogin = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ status: 'fail', message: error.details[0].message });
    next();
};

// 🛡️ 1. Forgot Password ke liye Validation (Sirf Email check karenge)
exports.validateForgotPassword = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string()
            .email() // Proper email format hona chahiye (e.g., test@test.com)
            .required()
            .messages({
                'string.empty': 'Please provide a valid email address.',
                'string.email': 'Please provide a valid email address.',
                'any.required': 'Email is a required field.'
            })
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            status: 'fail',
            message: error.details[0].message
        });
    }

    next(); // Agar sab sahi hai, toh controller par aage badho
};

// 🛡️ 2. Reset Password ke liye Validation (Strong Password Rules)
exports.validateResetPassword = (req, res, next) => {
    const schema = Joi.object({
        password: Joi.string()
            .min(8) // Minimum 8 characters long
            .max(30) // Maximum 30 characters
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'))
            // ☝️ Regex Rule: 1 Uppercase, 1 Lowercase, 1 Number, aur 1 Special Character zaroori hai!
            .required()
            .messages({
                'string.empty': 'Password is a required field.',
                'string.min': 'Password must be at least 8 characters long.',
                'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
                'any.required': 'Password is a required field.'
            })
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            status: 'fail',
            message: error.details[0].message
        });
    }

    next();
};



exports.validateVerifyOTP = (req, res, next) => {
    const schema = Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address.',
            'any.required': 'Email is required.'
        }),
        otp: Joi.string().length(6).required().messages({
            'string.length': 'OTP must be exactly 6 digits long.',
            'any.required': 'OTP is a required field.'
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            status: 'fail',
            message: error.details[0].message
        });
    }
    next(); // Agar rules match ho gaye, toh controller par bhejo
};