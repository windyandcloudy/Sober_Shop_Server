/**
 * @package Controllers
 * @category productController
 *
 * @api index() Get all products
 * @api show() Show product by id
 * @api create() Create a product
 * @api update() Update a product
 * @api delete() Delete a product
 *
 * @author Huu Ngoc Developer huungoc1994hd@gmail.com
 * @date 25/05/2021
 */

const Product = require("../models/Product");
const asyncHandle = require("../middlewares/asyncHandle");
const sendResponse = require("../helpers/SendResponse");

module.exports = {
  index: asyncHandle(async (req, res) => {
    const conditions = {};

    /*== Find if category_id is not empty ==*/
    if (req.query.category_id) {
      conditions.category = req.query.category_id;
    }

    /*== Find if name is not empty with regex ==*/
    if (req.query.name) {
      conditions.name = new RegExp(req.query.name, "ig");
    }

    /*== Find with price between min_price and max_price ==*/
    if (req.query.min_price) {
      if (!conditions.price) {
        conditions.price = {};
      }

      conditions.price.$gte = req.query.min_price;
    }

    if (req.query.max_price) {
      if (!conditions.price) {
        conditions.price = {};
      }

      conditions.price.$lte = req.query.max_price;
    }

    const page = +req.query.page || 1;
    const limit = +req.query.limit || 10;
    const startIndex = (page - 1) * limit;
    const total = await Product.countDocuments(conditions);
    const totalPage = Math.ceil(total / limit);
    const pagination = {
      page,
      limit,
      total,
      totalPage,
    };

    const products = await Product.find(conditions)
      .skip(startIndex)
      .limit(limit);

    return sendResponse(res, "Get list successfully.", products, pagination);
  }),

  show: asyncHandle(async (req, res) => {
    const product = await Product.findById(req.params.id);

    return sendResponse(res, "Show successfully.", product);
  }),

  create: asyncHandle(async (req, res) => {
    const product = await Product.create(req.body);

    return sendResponse(res, "Create successfully.", product);
  }),

  update: asyncHandle(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body);

    return sendResponse(res, "Update successfully.", product);
  }),

  delete: asyncHandle(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    return sendResponse(res, "Delete successfully.", product);
  }),
};
