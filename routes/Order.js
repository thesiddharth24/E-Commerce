const express = require('express');
const { fetchOrderByUser , CreateOrder , updateOrder , deleteOrder , fetchAllOrders} = require('../controllers/Order');

const router = express.Router();

router.post('/',CreateOrder)
      .get('/user/:userId',fetchOrderByUser)
      .delete('/:id',deleteOrder)
      .patch('/:id',updateOrder)
      .get('/',fetchAllOrders)


exports.router = router;