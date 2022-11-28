const ErrorResponse = require("../helpers/ErrorResponse");
const asyncHandle = require("../middlewares/asyncHandle");
const Order = require("../models/Order");
const OrderDetail = require("../models/OrderDetail");
const User = require("../models/User");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const sendResponse = require("../helpers/SendResponse");

module.exports = {
  // @route [POST] /api/order
  // @desc Add order and order detail
  // @access Only role user
  addOrder: asyncHandle(async (req, res, next) => {
    console.log(req.body);
    const userId = req.userId;
    const { address, phoneNumber, carts } = req.body;

    // Simple validation
    if (!(address && phoneNumber && carts)) {
      return next(new ErrorResponse(400, "Lack of information"));
    }

    // Create session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const options = { session };

      const user = await User.findOne({ _id: userId }, null, options);

      if (!user) {
        await session.abortTransaction();
        session.endSession();

        return next(new ErrorResponse(404, "User not found"));
      }

      // Check for existing product in user's cart and delete them
      const productsInCart = await Promise.all(
        carts.map(async (cartId) => {
          const cart = await Cart.findOneAndDelete(
            { _id: cartId, user: userId },
            options
          ).populate("product");

          const product = await Product.findById(
            cart.product._id,
            null,
            options
          );
          product.sold += cart.quantity;
          await product.save();

          return cart;
        })
      );

      const totalAmount = productsInCart.reduce((total, cart) => {
        const { quantity, product } = cart;
        const { price, discount } = product;

        return total + quantity * (price * ((100 - discount) / 100));
      }, 0);

      // Check user's account balance
      // if(user.accountBalance < totalAmount) {
      //     await session.abortTransaction();
      //     session.endSession();

      //     return next(new ErrorResponse(400, "User's account balance is not enough for payment"));
      // }

      const order = await Order.create(
        [
          {
            user: userId,
            address,
            phoneNumber,
            totalAmount,
          },
        ],
        options
      );

      const newOrder = order[0];

      // user.accountBalance -= totalAmount;
      await user.save();

      // Transfer money to recipient's account
      const receiver = await User.findOne(
        { username: "badong2001" },
        null,
        options
      );

      if (!receiver) {
        await session.abortTransaction();
        session.endSession();

        return next(new ErrorResponse(404, "Receiver not found"));
      }

      receiver.accountBalance += totalAmount;
      await receiver.save();

      // Create array detail of order
      const orderDetailArray = productsInCart.map((cart) => {
        return {
          order: newOrder._id,
          product: cart.product._id,
          quantity: cart.quantity,
          discount: cart.product.discount,
          price: cart.product.price,
        };
      });

      const orderDetails = await OrderDetail.insertMany(
        orderDetailArray,
        options
      );

      // End session
      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: "Add order successfully",
        order: newOrder,
        orderDetails,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      return next(new ErrorResponse(400, error.message));
    }
  }),

  // @route [GET] /api/order/user
  // @desc Get all order of user
  // @access Only role user
  getOrderUser: asyncHandle(async (req, res, next) => {
    const userId = req.userId;

    const orders = await Order.find({ user: userId })
      .populate({ path: "orderDetails", populate: "product" })
      .populate("user");

    res.json({ success: true, orders });
  }),

  // @route [GET] /api/order/admin
  // @desc Get all order in database
  // @access Only role admin
  getAllOrders: asyncHandle(async (req, res, next) => {
    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const total = await Order.countDocuments();
    const totalPage = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPage,
    };
    const orders = await Order.find({})
      .populate({ path: "orderDetails", populate: "product" })
      .populate("user")
      .skip(startIndex)
      .limit(limit);

    return sendResponse(
      res,
      "Get list order successfully.",
      orders,
      pagination
    );
    // res.json({ success: true, orders });
  }),

  // @route [GET] /api/order/:id
  // @desc Get order by id
  // @access Private
  getOrder: asyncHandle(async (req, res, next) => {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate({ path: "orderDetails", populate: "product" })
      .populate("user");

    if (!order) return next(new ErrorResponse(404, "Not found order"));

    res.json({ success: true, order });
  }),
  updateStatus: asyncHandle(async (req, res, next) => {
    let id = req.params.id;
    let { ...body } = req.body;
    let order = await Order.findByIdAndUpdate(id, body, { new: true });
    return res.status(200).json(order);
  }),
  deleteOrder: asyncHandle(async (req, res, next) => {
    let id = req.params.id;
    let order = await Order.findByIdAndDelete(id);
    return res.status(200).json(order);
  }),
};
