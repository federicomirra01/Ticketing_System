'use strict';

const express = require('express');
const morgan = require('morgan')
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const { check, validationResult } = require("express-validator");

const Categories = {
  INQUIRY: 'inquiry',
  MAINTENANCE: 'maintenance',
  NEW_FEATURE: 'new feature',
  ADMINISTRATIVE: 'administrative',
  PAYMENT: 'payment'
};

const jwt_secret = '08e768dc855236dd76764f751ce84ff37b35f349c495afa24c3b874c211fff24'; // 256 bits secret
// init express
const app = new express();
const port = 3002;

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(jwt({
  secret: jwt_secret,
  algorithms: ["HS256"]
}));

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError')
    res.status(401).json({ errors: [{ 'param': 'Server', 'msg': 'Authorization error', 'path': err.code }] });
  else
    next();
});

const computeNormalEstimation = (ticket) => {
  const max = 240;
  const min = 1;

  let estimation = 0;
  const T = ticket.title.split(' ').join('').length;
  const C = ticket.category.split(' ').join('').length;
  estimation = ((T + C) * 10) + Math.floor(Math.random() * (max - min + 1)) + min;
  const days = Math.floor(estimation / 24);
  const normalEstimation = { estimation: `${days} days` };
  return normalEstimation;
}

const computeAdminEstimation = (ticket) => {

  const max = 240;
  const min = 1;

  let estimation = 0;
  const T = ticket.title.split(' ').join('').length;
  const C = ticket.category.split(' ').join('').length;
  estimation = ((T + C) * 10) + Math.floor(Math.random() * (max - min + 1)) + min;
  const days = Math.floor(estimation / 24);
  const adminEstimation = { estimation: `${days} days and ${estimation % 24} hours` };

  return adminEstimation;

}

app.post('/api/estimation', [
  check('title').trim().isString().notEmpty(),
  check('category').isIn(Object.values(Categories))
], (req, res) => {
  //console.log('DEBUG: req.auth: ', req.auth);
  const authLevel = req.auth.access;

  const err = validationResult(req);
  const errList = [];
  if (!err.isEmpty) {
    errList.push(...err.errors.map(e => e.msg));
    return res.status(400).json({ errors: errList });
  }
  const ticket = {
    title: req.body.title,
    category: req.body.category
  }

  if (authLevel === 'admin')
    res.json(Object.assign({}, computeAdminEstimation(ticket)));
  else if (authLevel === 'normal')
    res.json(Object.assign({}, computeNormalEstimation(ticket)));
  else
    res.status(401).json({ error: 'Invalid Token' });
});


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
