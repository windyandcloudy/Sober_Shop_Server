const express = require("express");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const productController = require("../controllers/productController");
const permission = require("../middlewares/permission");

const router = express.Router({ mergeParams: true });

const multer= require("multer")
const upload = multer({ dest: "uploads" })

router
  .route("/")
  .get(productController.index)
  .post(
    verifyAccessToken, permission("admin"), 
    upload.fields([{ name: 'thumb', maxCount: 5 }, { name: 'listImage', maxCount: 8 }]),
    productController.create
  );

router
  .route("/:id")
  .get(productController.show)
  .put(verifyAccessToken, permission("admin"), productController.update)
  .delete(verifyAccessToken, permission("admin"), productController.delete);

module.exports = router;
