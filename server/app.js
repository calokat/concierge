require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const csrf = require('csurf');
const redis = require('redis');

const port = process.env.PORT || process.env.NODE_ENV || 3000;

const dbURL = process.env.MONGODB_URI || 'mongodb://localhost/Proj3';

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose.connect(dbURL, mongooseOptions, (err) => {
  if (err) {
    console.log('Could not connect to database');
    throw err;
  }
});

const redisURL = {
  hostname: `${process.env.REDIS_HOST}`,
  port: `${process.env.REDIS_PORT}`,
};

const redisPASS = `${process.env.REDIS_PASS}`;

const redisClient = redis.createClient({
  host: redisURL.hostname,
  port: redisURL.port,
  password: redisPASS,
});
const app = express();
// Thank you https://stackoverflow.com/questions/6096492/node-js-and-express-session-handling-back-button-problem
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const socketManager = require('./socket');

const router = require('./router');

app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted`)));
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(session({
  key: 'sessionId',
  store: new RedisStore({
    client: redisClient,
  }),
  secret: 'Open Sesame',
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
  },
}));
app.engine('handlebars', expressHandlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', `${__dirname}/../views`);
app.use(cookieParser());
app.use(csrf());
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  console.log(`Missing CSRF token ${req.url}`);
  return false;
});
// Thanks https://expressjs.com/en/guide/writing-middleware.html
app.use('/chat', (req, res, appNext) => {
  // Thanks https://socket.io/docs/server-api/#namespace-use-fn
  io.use((socket, next) => {
    const { handshake } = socket;
    handshake.query.clientUsername = req.session.account.username;
    handshake.query.roomToJoin = req.params.conversationId;
    next();
  });
  appNext();
});
socketManager(io);
router(app);

http.listen(port, (err) => {
  if (err) {
    throw err;
  }
  console.log(`Listening on port ${port}`);
});
