const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/verifyToken');
const permission = require('../middlewares/permission');
const orderController = require('../controllers/orderController');

router.post('/', verifyAccessToken, permission('user'), orderController.addOrder);

router.get('/user', verifyAccessToken, permission('user'), orderController.getOrderUser);

router.get('/admin', verifyAccessToken, permission('admin'), orderController.getAllOrders);

router.patch('/admin/:id', verifyAccessToken, permission('admin'), orderController.updateStatus);

router.get('/:id', verifyAccessToken, orderController.getOrder);

module.exports = router;