const express = require('express');
const accountController = require('../controllers/accountController');
const permission = require('../middlewares/permission');
const { verifyAccessToken } = require('../middlewares/verifyToken');
const router = express.Router();


router.get('/', verifyAccessToken, permission('admin'), accountController.getAll);

router.delete('/:id', verifyAccessToken, permission('admin'), accountController.delete);

module.exports = router;