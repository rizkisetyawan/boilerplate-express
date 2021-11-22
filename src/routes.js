const camera = require('./camera');

const routes = (app) => {
  app.use('/camera', camera);
};

module.exports = routes;
