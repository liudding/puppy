const express = require('express');
const errorHandler = require('./middleware/error-handler');
const logger = require("./utils/logger").createLogger(__filename);


function createApp() {
    const app = express()

    app.use(express.json());
    app.use(errorHandler);

    return app;
}

module.exports = createApp

