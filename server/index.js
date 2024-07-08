/*** Importing required modules ***/
const dayjs = require('dayjs');
const express = require('express');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const ticketDao = require('./dao_ticket');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const jsonwebtoken = require('jsonwebtoken');
const jwt_secret = '08e768dc855236dd76764f751ce84ff37b35f349c495afa24c3b874c211fff24'; // 256 bits secret
const expireTime = 300; // for debugging

// init express and middlewares' set-up
const app = new express();
app.use(express.json());

/*** Set up and enable Cross-Origin Resource Sharing (CORS) ***/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));


/*** Passport ***/

/** Set up authentication strategy to look up in the DB seeking for a user with a matching salted password **/
passport.use(new LocalStrategy((email, password, done) => {
  ticketDao.getUser(email, password).then((user) => {
    if (!user)
      return done(null, false, { error: 'Incorrect username or password' });
    return done(null, user);
  });
}
));

/** Serializing in the session the user object given from LocalStrategy(verify) **/
passport.serializeUser((user, callback) => {
  callback(null, user.id);
});

/** Deserializing the user from the session **/
passport.deserializeUser((id, callback) => {
  ticketDao.getUserById(id).then(user => {
    callback(null, user);
  }).catch(err => {
    callback(err, null);
  });
});

/** Creating the session **/
app.use(session({
  secret: 'e378bab631ca73cdf88279a654389055', //128 bits randomly generated
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false }
}));

//app.use(passport.authenticate('session'));
app.use(passport.initialize());
app.use(passport.session());

/*** Authentication verification middleware ***/
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated())
    return next();
  return res.status(401).json({ error: 'Not Authenticated' });
}

/*** Constant values used in database ***/
const States = {
  OPEN: 1,
  CLOSED: 0
};

const Categories = {
  INQUIRY: 'Inquiry',
  MAINTENANCE: 'Maintenance',
  NEW_FEATURE: 'New feature',
  ADMINISTRATIVE: 'Administrative',
  PAYMENT: 'Payment'
};

/** Utility functions **/
// Values' limits to avoid malicious requests resulting in a waste of space in DB
const maxTitleLength = 80;
const maxBlockDescriptionLength = 1024;

/** TICKETS APIs **/
// 1. Retrieve the list of tickets for the generic user
app.get('/api/tickets', (req, res) => {
  ticketDao.listTickets()
    .then(tickets => res.json(tickets))
    .catch((err) => res.status(500).json(err));
});


// 2. Create a new ticket, providing all relevant information
// POST /api/tickets
app.post('/api/tickets', isLoggedIn, [
  check('state').isIn(Object.values(States)).withMessage('Invalid state value'),
  check('category').isIn(Object.values(Categories)).withMessage('Invalid category value'),
  check('title').isLength({ min: 1, max: maxTitleLength }).withMessage(`Title length must be between 1 and ${maxTitleLength}`),
  check('initialTextBlock').trim().isLength({ min: 1, max: maxBlockDescriptionLength }).withMessage(`InitialTextBlock length must be between 1 and ${maxBlockDescriptionLength}`),
  check('timestamp').isLength({ min: 20, max: 26 }).withMessage('Invalid timestamp'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({error: errors.errors});

  // creating the ticket to submit to the database from the req.body  
  const ticket = {
    state: req.body.state,
    category: req.body.category,
    id_owner: req.user.id, // user retrived from the session
    title: req.body.title,
    timestamp: dayjs(req.body.timestamp).format('YYYY-MM-DD hh:mm:ss A'),
  };

  const ticketBlock = {
    description: req.body.initialTextBlock,
    timestamp: ticket.timestamp,
    ownerId: req.user.id
  }

  try {
    
    const result = await ticketDao.createTicket(ticket, ticketBlock); /** single transaction to ensure integrity of the database in case of failure */
    res.end();
  } catch (err) {
    res.status(500).json({ error: `Database error during the creation of new ticket: ${err}` });
  }
}
);

// 3. Update an existing ticket
// PUT /api/tickets/<id>
app.put('/api/tickets/:id', isLoggedIn, [
  check('id').isInt({ min: 1 }).withMessage('ID not valid'),
  check('state').isIn(Object.values(States)).withMessage('Invalid state value').optional(),
  check('category').isIn(Object.values(Categories)).withMessage('Invalid category').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json(errors.errors);

  let ticket = undefined;
  try {
    ticket = await ticketDao.getTicket(req.params.id); // retrieve ticket from the database
    if ((ticket.ownerID !== req.user.id) && req.user.level !== 'admin')
      return res.status(401).json({ error: 'Not Authorized' })

    if (req.body.id && req.body.id !== Number(req.params.id)) // ticket ID coherence check
      return res.status(422).json({ error: 'URL and body id mismatch' });

    if(ticket.state === States.CLOSED && req.user.level !== 'admin') 
      return res.status(400).json({error: 'Ticket closed can not be re-opened if not admin'});

    
  } catch (err) {
    return res.status(404).json({ error: err });
  }
  try { // the same route is used to update state or category, consequently this check is required
    ticket.state = req.body.state !== undefined ? req.body.state : ticket.state;
    ticket.category = req.body.category || ticket.category;

    const result = await ticketDao.updateTicket(ticket); // returns the number of rows affected by the change (1 expected in normal behavior)
    res.end();
  } catch (err) {
    res.status(500).json({ error: `Database error during the update of film ${req.params.id}` });
  }
});

app.get('/api/textBlocks/:ticketId', isLoggedIn, [
  check('ticketId').isInt({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json(errors.errors);
  try{
    const ticketId = await ticketDao.getTicket(req.params.ticketId);
  } catch(err){
    res.status(404).json({error: 'Invalid request'})
  }

  try {
    const result = await ticketDao.getTextBlocksFromTicket(req.params.ticketId);
    if (result.error)
      res.status(500).json({error: `${result.error}`});
    else
      res.json(result);
  } catch (err) {
    res.status(500).json({error: `${err}`});
  }
});

app.post('/api/textBlocks', isLoggedIn, [
  check('ticketId').isInt({ min: 1 }).withMessage('Invalid ticket'),
  check('description').trim().isLength({ min: 1, max: maxBlockDescriptionLength }).withMessage(`Description length must be between 1 and ${maxBlockDescriptionLength}`),
  check('timestamp').isLength({ min: 20, max: 26 }).withMessage('Invalid timestamp')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json(errors.errors);

  try {
    const ticket = await ticketDao.getTicket(req.body.ticketId);
    if(ticket.state === States.CLOSED) // avoid multi-user logic issues
      return res.status(400).json({error: 'Cannot add text blocks to a closed ticket, try reloading the content by closing the alert'}); 
  } catch (err) {
   res.status(404).json({error: 'Invalid ticketId' }) 
  }
  try {
    const text_block = {
      ticketId: req.body.ticketId,
      ownerId: req.user.id, //retrieved from session
      description: req.body.description,
      timestamp: req.body.timestamp
    }
   
    const result = await ticketDao.createTicketTextBlock(text_block) // return the new created ID
    res.end();
  } catch (err) {
    res.status(500).json({ error: `Internal Server Error during the creation of new textBlock: ${err}` });
  }
})


// authenticate user
app.post('/api/sessions', [
  check('email').isEmail(),
  check('password').isString().notEmpty()
], function (req, res, next) {
  // Check if validation is ok
  const err = validationResult(req);
  const errList = [];
  if (!err.isEmpty) {
    errList.push(...err.errors.map(e => e.msg));
    return res.status(400).json({ errors: errList });
  }

  //Perform authentication
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user)
      return res.status(401).json({ error: info });
    req.login(user, (err) => {
      if (err)
        return next(err);
      return res.json({ email: req.user.email, username: req.user.username, level: req.user.level });
    });
  })(req, res, next);
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.end());
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated())
    res.status(200).json({ email: req.user.email, username: req.user.username, leve: req.user.level });
  else
    res.status(401).json({ error: 'Not Authenticated user' });
});

app.get('/api/auth-token', isLoggedIn, (req, res) => {
  const authLevel = req.user.level;
  const userId = req.user.id;
  const payloadToSign = { access: authLevel, id: userId };
  const jwtToken = jsonwebtoken.sign(payloadToSign, jwt_secret, { expiresIn: expireTime });

  res.json({ token: jwtToken, authLevel: authLevel });
});

const port = 3001;

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
