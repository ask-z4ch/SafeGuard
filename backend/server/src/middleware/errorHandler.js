const errorHandler = (err, _req, res, _next) => {
  console.error('API error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: 'Something went wrong' });
};

export default errorHandler;
