const express = require("express");
const { verifyAccessToken } = require("../middlewares/verifyToken");
const feedbackController = require("../controllers/feedbackController");
const permission = require("../middlewares/permission");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(verifyAccessToken, permission("user"), feedbackController.create);

router.route("/:order_detail_id").get(feedbackController.show);

router
  .route("/:id")
  .put(verifyAccessToken, permission("user"), feedbackController.update)
  .delete(verifyAccessToken, permission("user"), feedbackController.delete);

module.exports = router;
