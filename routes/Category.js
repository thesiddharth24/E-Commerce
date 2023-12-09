const express = require('express');
const { fetchCategories , createCategory } = require('../controllers/Category');

const router = express.Router();
//  /categories is already added in base path
router.get('/', fetchCategories)
      .post('/',createCategory);

exports.router = router;