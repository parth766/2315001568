const morgan = require('morgan');

// Custom format to log: HTTP method, requested URL, response status code, content size, and processing response time
const customFormat = ':method :url :status :res[content-length] - :response-time ms';

const loggingMiddleware = morgan(customFormat);

module.exports = loggingMiddleware;
