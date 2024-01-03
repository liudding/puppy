
const http = require('http');


function errorHandler(err, req, res, next) {
    let message = err.message;
    const status = err.status ? err.status : 500;

    if (status != 500) {
        message = http.STATUS_CODES[status];
    }

    res.status(status).send({ message, errors: err.errors });
}


module.exports = errorHandler;