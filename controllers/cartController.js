const ErrorResponse = require('../helpers/ErrorResponse');
const asyncHandle = require('../middlewares/asyncHandle');
const { findByIdAndUpdate } = require('../models/Cart');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

module.exports = {
    
    // @route [POST] /api/cart
    // @desc Add product to user's cart
    // @access only role user
    add: asyncHandle(async (req, res, next) => {
        const userId = req.userId;
        const { productId, quantity } = req.body;

        // Simple validation
        if(!(productId && quantity)) {
            return next(new ErrorResponse(400, 'Lack of information'));
        }

        // Check for existing product
        const product = await Product.findOne({ _id: productId });

        if(!product) {
            return next(new ErrorResponse(404, 'Not found product'));
        }

        // Check for existing product in cart
        const cart = await Cart.findOne({ user: userId, product: productId });

        if(cart) {
            cart.quantity += quantity;
            await cart.save();

            res.json({ success: true, message: 'The product has been added to cart', cart });
        } else {
            const newCart = await Cart.create({
                user: userId,
                product: productId,
                quantity,
            });

            res.json({ success: true, message: 'The product has been added to cart', cart: newCart });
        }

    }),

    // @route [GET] /api/cart
    // @desc Get all products in user's cart
    // @access Only role user
    getAll: asyncHandle(async (req, res, next) => {
        const userId = req.userId;

        const carts = await Cart.find({ user: userId }).populate('product');

        res.json({ success: true, carts });
    }),

    getCount: asyncHandle(async (req, res, next) => {
        const userId = req.userId;

        const carts = await Cart.find({ user: userId });

        res.json({ success: true, count: carts.length });
    }),

    // @route [DELETE] /api/cart/:productId
    // @desc Delete product in user's cart
    // @access Only role user
    delete: asyncHandle(async (req, res, next) => {
        const userId = req.userId;
        const id = req.params.id;

        const deletedCart = await Cart.findOneAndDelete({ user: userId, _id: id});

        // Check for existing product in user's cart
        if(!deletedCart) {
            return next(new ErrorResponse(404, "Not found product in user's cart"));
        }

        res.json({ success: true, message: 'The product has been deleted by user', cart: deletedCart });
    }),

    // @route [PUT] /api/cart
    // @@desc Update quantity for product in user's cart
    // @access Only role user
    update: asyncHandle(async (req, res, next) => {
        const userId = req.userId;
        const { productId, quantity } = req.body;

        // Simple validation
        if(!(productId && quantity)) {
            return next(new ErrorResponse(400, 'Lack of information'));
        }

        const updatedCart = await Cart.findOneAndUpdate({ user: userId, product: productId }, { quantity }, { new: true }).populate('product');

        // Check for existing product in user's cart
        if(!updatedCart) {
            return next(new ErrorResponse(404, "Not found product in user's cart"));
        };

        res.json({ success: true, message: "The product has been updated", cart: updatedCart });
    }),

    // @route [PUT] /api/cart
    // @desc Update many cart
    // @access private
    updateMany: asyncHandle(async (req, res, next) => {
        const { newCarts } = req.body;
        const userId = req.userId;

        const carts = await Promise.all(newCarts.map(async (cart) => {
            if(cart.quantity === 0) {
                await Cart.findByIdAndDelete(cart._id);
                return null;
            } else {
                const newCart = await Cart.findByIdAndUpdate(cart._id, { quantity: cart.quantity});
                return newCart;
            };
        }));

        res.json({ success: true, message: "Carts has been updated"});
    })
};
