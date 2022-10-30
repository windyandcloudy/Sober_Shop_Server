const express = require('express');
const cartController = require('../controllers/cartController');
const permission = require('../middlewares/permission');
const { verifyAccessToken } = require('../middlewares/verifyToken');
const router = express.Router();

router.post('/', verifyAccessToken, permission('user'), cartController.add);

router.get('/', verifyAccessToken, permission('user'), cartController.getAll);

router.get('/count', verifyAccessToken, permission('user'), cartController.getCount);

router.put('/', verifyAccessToken, permission('user'), cartController.updateMany);

router.delete('/:id', verifyAccessToken, permission('user'), cartController.delete);

module.exports = router;
