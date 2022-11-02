const express = require("express");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const permission = require("../middlewares/permission");

const asyncHandle = require("../middlewares/asyncHandle");
const sendResponse = require('../helpers/SendResponse');

const Product= require("../models/Product")
const Order= require("../models/Order")
const User= require("../models/User")

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(verifyAccessToken, permission("admin"), asyncHandle(async(req, res, next)=>{
    let total_product= await Product.countDocuments()
    let total_order= await Order.countDocuments()
    let total_user= await User.countDocuments()
    return res.status(200).json({
      total_product: total_product,
      total_order: total_order,
      total_user: total_user
    })
  }))

module.exports = router;
