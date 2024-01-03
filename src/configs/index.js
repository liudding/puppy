const path = require('path');

module.exports = {
    env: process.env.NODE_ENV || 'production',

    port: Number(process.env.PORT) || 3000,
    debugMode: process.env.DEBUG_MODE === 'true',


    logDir: path.join(global.appRoot, '../logs'),

    // 临时文件目录    
    tmpDir: '/tmp/puppy',

    storage: {

    }

}