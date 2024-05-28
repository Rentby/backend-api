const apiKey = process.env.API_KEY

function checkApiKey(req, res, next) {
  const userApiKey = req.headers['api-key'];
  if (userApiKey === apiKey) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

module.exports = checkApiKey;
