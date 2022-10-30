const express = require("express");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const productController = require("../controllers/productController");
const permission = require("../middlewares/permission");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(productController.index)
  .post(verifyAccessToken, permission("admin"), productController.create);

router
  .route("/:id")
  .get(productController.show)
  .put(verifyAccessToken, permission("admin"), productController.update)
  .delete(verifyAccessToken, permission("admin"), productController.delete);

module.exports = router;
