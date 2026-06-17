const errorHandler = (err, _req, res, _next) => {
  console.error('API error:', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export default errorHandler;
