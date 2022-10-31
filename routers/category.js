const express = require("express");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const categoryController = require("../controllers/categoryController");
const permission = require("../middlewares/permission");

const router = express.Router({ mergeParams: true });

const multer= require("multer")
const upload = multer({ dest: "uploads" })

router
  .route("/")
  .get(categoryController.index)
  .post(
    verifyAccessToken, 
    upload.single("thumb"),
    permission("admin"), categoryController.create
  );

router
  .route("/:id")
  .get(categoryController.show)
  .put(verifyAccessToken, permission("admin"), upload.single("thumb"), categoryController.update)
  .delete(verifyAccessToken, permission("admin"), categoryController.delete);

module.exports = router;