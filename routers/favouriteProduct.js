const express = require("express");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const favouriteProductController = require("../controllers/favouriteProductController");
const permission = require("../middlewares/permission");

const router = express.Router({ mergeParams: true });
router
  .route("/")
  .get(verifyAccessToken, permission("user"), favouriteProductController.index)
  .post(
    verifyAccessToken,
    permission("user"),
    favouriteProductController.create
  );

router
  .route("/:id")
  .put(verifyAccessToken, permission("user"), favouriteProductController.update)
  .delete(
    verifyAccessToken,
    permission("user"),
    favouriteProductController.delete
  );

module.exports = router;
