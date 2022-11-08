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
 *
 * @date 25/05/2021
 */

const Product = require("../models/Product");
const asyncHandle = require("../middlewares/asyncHandle");
const sendResponse = require("../helpers/SendResponse");

const cloudinary= require("../config/cloudinary")

module.exports = {
  index: asyncHandle(async (req, res) => {
    let deleted= req.query.deleted || 0
    let conditions = {
      deleted: deleted
    };

    /*== Find if category_id is not empty ==*/
    if (req.query.category_id) {
      conditions.category = req.query.category_id;
    }

    /*== Find if name is not empty with regex ==*/
    if (req.query.name) {
      console.log(req.query.name.length)
      if (req.query.name.length>2)
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

    console.log(conditions)
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
      .populate("category")
      .sort("-updatedAt")
      .skip(startIndex)
      .limit(limit);
    // let pro= products.filter(v=> v.deleted!==1)  

    return sendResponse(res, "Get list successfully.", products, pagination);
  }),

  show: asyncHandle(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category");

    return sendResponse(res, "Show successfully.", product);
  }),

  create: asyncHandle(async (req, res) => {
    let {...body}= req.body
    //upload thumb
    let promThumb= req.files["thumb"].map(v=>{
      return cloudinary.uploader.upload(v.path)
    })

    let arrThumb= await Promise.all(promThumb)
    body.thumb= arrThumb.map(v=> v.secure_url)
    //upload listimage
    let promListImage= req.files["listImage"].map(v=>{
      return cloudinary.uploader.upload(v.path)
    })
    let arrListImage= await Promise.all(promListImage)
    body.listImage= arrListImage.map(v=> v.secure_url)

    const product = await Product.create(body);

    return sendResponse(res, "Create successfully.", product);
  }),

  update: asyncHandle(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {new: true});

    return sendResponse(res, "Update successfully.", product);
  }),

  delete: asyncHandle(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, {deleted: 1}, {new: true});

    return sendResponse(res, "Delete successfully.", product);
  }),
};
