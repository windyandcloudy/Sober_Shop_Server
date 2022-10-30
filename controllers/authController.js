require('dotenv').config();
const User = require('../models/User');
const asyncHandle = require('../middlewares/asyncHandle');
const ErrorResponse = require('../helpers/ErrorResponse');
const GenerateRefreshToken = require('../helpers/GenerateRefreshToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const redisClient = require('../config/redis');
const sendMail = require('../helpers/sendMail');
const saltRounds = 10;

module.exports = {

    // @route [POST] /api/auth/register
    // @desc User register
    // @access Public
    register: asyncHandle(async (req, res, next) => {
        const { username, email, password, confirmPassword } = req.body;

        // Simple validation
        if(!(username && email && password && confirmPassword)) {
            return next(new ErrorResponse(400, 'Missing information'));
        }

        // Confirm password
        if(password !== confirmPassword) {
            return next(new ErrorResponse(400, 'Confirm password does not match'));
        }

        // Check for existing email
        const emailTaken = await User.findOne({ email });
        if(emailTaken) {
            return next(new ErrorResponse(400, 'Email is taken'));
        }

        // Check for existing username
        const user = await User.findOne({ username });

        if(user) {
            return next(new ErrorResponse(400, 'Username is taken'));
        }

        // Everything is good
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        const accessToken = jwt.sign({ userId: newUser._id, role: newUser.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
        const refreshToken = GenerateRefreshToken(newUser._id);

        res.json({
            success: true,
            message: 'Account successfully created',
            accessToken,
            refreshToken,
        });
    }),

    // @route [POST] /api/auth/login
    // @desc User login
    // @access Public
    login: asyncHandle(async (req, res, next) => {
        const { username, password } = req.body;

        // Simple validation
        if(!username || !password) {
            return next(new ErrorResponse(400, 'Missing username and/or password'));
        }

        // Check for existing user 
        const user = await User.findOne({ username });

        if(!user) {
            return next(new ErrorResponse(400, 'Incorrect username or password'));
        }

        // Check password
        const passwordValid = await bcrypt.compare(password, user.password);

        if(!passwordValid) {
            return next(new ErrorResponse(400, 'Incorrect username or password'));
        }

        // Everything is good
        const accessToken = jwt.sign({ userId: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
        const refreshToken = GenerateRefreshToken(user._id);

        res.json({
            success: true,
            message: 'Logged in successfully',
            accessToken,
            refreshToken,
        });
    }),

    // @route [GET] /api/auth
    // @desc Confirm token
    // @access Public
    confirm: asyncHandle(async (req, res, next) => {
        const userId = req.userId;

        const user = await User.findOne({ _id: userId }).select('-password');

        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'User not exist'));
        }

        // Everything is good
        res.json({ success: true, user });
    }),

    // @route [PUT] /api/auth
    // @desc Update user information 
    // @access Private
    updateInfor: asyncHandle(async (req, res, next) => {
        
        const user = await User.findById(req.userId).select('-password');
                
        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'User not exist'));
        } 

        const { 
            fullname = user.fullname,
            phoneNumber = user.phoneNumber, 
            email = user.email, 
            address = user.address, 
            money = 0, 
        } = req.body;

        // Check for existing email
        if(email !== user.email) {
            const userWithEmail = await User.findOne({ email });

            if(userWithEmail)
                return next(new ErrorResponse(400, 'This email is taken'));
        } 

        // Everything is good

        user.fullname = fullname;
        user.phoneNumber = phoneNumber;
        user.email = email;
        user.address = address;
        user.accountBalance = user.accountBalance + (+money);

        await user.save();

        res.json({ success: true, user });
    }),

    // @route [PUT] api/auth/password
    // @desc Change password
    // @access Private
    changePassword: asyncHandle(async (req, res, next) => {
        const { password, newPassword, confirmPassword } = req.body;

        // Simple validation
        if(!(password && newPassword && confirmPassword)) {
            return next(new ErrorResponse(400, 'Missing information'));
        }

        // Check the difference between old password and new password
        if(password === newPassword) {
            return next(new ErrorResponse(400, 'The new password must be different from the old password'));
        }

         // Confirm password
         if(newPassword !== confirmPassword) {
            return next(new ErrorResponse(400, 'Confirm password does not match'));
        }

        const user = await User.findById(req.userId);

        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'User not exist'));
        }

        // Check password
        const passwordValid = await bcrypt.compare(password, user.password);

        if(!passwordValid) {
            return next(new ErrorResponse(400, 'Incorrect password'));
        }

        // Everything is good
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();
        
        res.json({ success: true, message: "Change password successfully" });
    }),

    // @route [POST] /api/auth/token
    // @desc Refresh access token
    // @access private
    getAccessToken: asyncHandle(async (req, res, next) => {
        const userId = req.userId;

        const user = await User.findOne({ _id: userId });

        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'User not exist'));
        }

        // Everything is good
        const accessToken = jwt.sign({ userId, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
        const refreshToken = GenerateRefreshToken(userId);

        res.json({ success: true, message: "Refesh access token", accessToken, refreshToken });
    }),

    // @route [GET] /api/auth/logout
    // @desc Log out account
    // @access private
    logout: asyncHandle(async (req, res, next) => {
        const userId = req.userId;

        const user = await User.findOne({ _id: userId }).select('-password');

        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'User not exist'));
        }

        await redisClient.del(userId.toString());

        res.json({ success: true, message: "Log out successfully" });
    }),

    // @route [POST] /api/auth/forget-password
    // @desc Send password reset link to user's email
    // @access public
    forgetPassword: asyncHandle(async (req, res, next) => {
        const { email } = req.body;

        // Check empty email
        if(!email) {
            return next(new ErrorResponse(400, 'Empty email'));
        }

        const user = await User.findOne({ email });

        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'Not found user with this email'));
        }

        // Everything is good
        const resetToken = jwt.sign({ userId: user._id }, process.env.RESET_TOKEN_SECRET, { expiresIn: process.env.RESET_TOKEN_EXPIRE });

        const resetUrl = `${process.env.CLIENT_URL}/user/reset-password/${resetToken}`;

        const message = `
            Vui lòng click vào đây ${resetUrl} để cập nhật lại mật khẩu.
            Link tồn tại trong 20 phút.
        `;

        try {
            await sendMail({
              email: email,
              subject: "Quên mật khẩu?",
              message,
            });
      
            return res.json({
                success: true,
                message: "Email sent.",
            });

            } catch (err) {
                console.log(`Error send mail: ${err.message}`);
                
                return res.status(400).json({
                    success: false,
                    message: err.message,
                });
            }
        
        res.status(200).json({
            success: true,
            resetUrl,
        });
    }),

    // @route [PUT] /api/auth/reset-password/:resetToken
    // @desc Reset password with email
    // @access public
    resetPassword: asyncHandle(async (req, res, next) => {
        const { newPassword, confirmPassword } = req.body;

        // Simple validate
        if(!(newPassword && confirmPassword)) {
            return next(new ErrorResponse(400, 'Missing password'));
        }

        // Confirm password
        if(newPassword !== confirmPassword) {
            return next(new ErrorResponse(400, 'Confirm password does not match'));
        }

        const user = await User.findOne({ _id: req.userId });
        
        // Check for existing user
        if(!user) {
            return next(new ErrorResponse(404, 'User not exist'));
        }

        // Everything is good
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: 'Reset password successfully'});
    }),

}
