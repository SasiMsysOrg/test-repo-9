const express = require('express');
const cors = require('cors');
const path = require('path');
const SmeeClient = require('smee-client');
const { hookRouter } = require('./routes/index');
const { Logger, DB } = require('./helpers/index');
const { Environment } = require('./config/index');
const { hooksJob } = require('./scheduler/index');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');

const app = express();
app.use(cors());
app.options('*', cors());

app.use(express.json({ limit: '50mb', type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));

app.use('/', async (req, res, next) => {
  // middleware to validate the correct origin
  res.header('Access-Control-Allow-Private-Network', true);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST');
  Logger.log('info', `Middleware running: ${req.hostname}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/rest/status', async (req, res) => {
  // heartbeat API to return the server status
  res.send({
    status: 'success',
    statusCode: '200',
    message: `App is running at ${app.get('host')}:${app.get('port')}`
  });
});

/** assign db connection object to the global object */
global.dbConnection = DB.GetDatabaseConnection();

/** trigger redelivery timeout calls */
// hooksJob.CheckHooksRedeliveryTask();

app.use(hookRouter);

app.set('host', Environment.host);
app.set('port', Environment.port);

app.listen(app.get('port'), () => {
  const smee = new SmeeClient({
    source: 'https://smee.io/KW1Zdfe7G3nWogH',
    target: 'http://localhost:9092/rest/hooks/callback',
    logger: console
  });

  smee.start();
  console.log('info', `App is running at ${app.get('host')}:${app.get('port')}`);
});

process.on('uncaughtException', err => {
  console.log('error', `There was an uncaught error ${path.basename(__filename)}: ${JSON.stringify(err)}`);
  process.exit(1);
});

module.exports = app;
