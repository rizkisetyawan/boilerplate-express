const { camera } = require('./modules');

const routes = (app) => {
  app.use('/camera', camera);
};

module.exports = routes;
