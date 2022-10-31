/**
 * @package Controllers
 * @category categoryController
 *
 * @api index() get all category
 * @api show() show a category by id
 * @api create() create a new category
 * @api update() update a category
 * @api delete() delete a category
 */

const Category = require("../models/Category");
const asyncHandle = require("../middlewares/asyncHandle");
const sendResponse = require("../helpers/SendResponse");

const cloudinary= require("../config/cloudinary")

module.exports = {
  index: asyncHandle(async (req, res) => {
    const category = await Category.find();

    return sendResponse(res, "Get list category successfully", category);
  }),

  show: asyncHandle(async (req, res) => {
    const category = await Category.findById(req.params.id);

    return sendResponse(res, "Show successfully.", category);
  }),

  create: asyncHandle(async (req, res) => {
    let {...body}= req.body
    if (req.file){
      let avt= await cloudinary.uploader.upload(req.file.path)
      body.thumb= avt.secure_url
    }
    const category = await Category.create(body);

    return sendResponse(res, "Create category successfully", category);
  }),

  update: asyncHandle(async (req, res) => {
    let {...body}= req.body
    if (req.file){
      let avt= await cloudinary.uploader.upload(req.file.path)
      body.thumb= avt.secure_url
    }
    const category = await Category.findByIdAndUpdate(req.params.id, body);

    return sendResponse(res, "Update category successfully", category);
  }),

  delete: asyncHandle(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);

    return sendResponse(res, "Delete category successfully", category);
  }),
};
