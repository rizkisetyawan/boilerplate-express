const router = require('express').Router();
const { streamCamera } = require('./service');

router.get(
  '/:camera/:index',
  async (req, res) => {
    const { camera, index } = req.params;
    const data = await streamCamera(camera, index);
    res.send(data);
  },
);

module.exports = router;
