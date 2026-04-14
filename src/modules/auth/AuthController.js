
// Description : Controller AUTH

const service = require('./AuthService');
const logger = require('../../config/logger');

const login = async (req, res) => {
  try {
    const result = await service.login(req.body, req.ip);

    res.json(result);
  } catch (error) {
    logger.error('Controller login error', { error: error.message });

    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

const register = async (req, res) => {
  try {
    const result = await service.register(req.body, req.user);

    res.status(201).json(result);
  } catch (error) {
    logger.error('Controller register error', { error: error.message });

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const verify = async (req, res) => {
  res.json({
    success: true,
    message: 'Token valide',
    user: req.user
  });
};

const refresh = async (req, res) => {
  try {
    const result = await service.refresh(req.user);

    res.json(result);
  } catch (error) {
    logger.error('Controller refresh error', { error: error.message });

    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  register,
  verify,
  refresh
};