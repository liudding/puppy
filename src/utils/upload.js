const OSS = require('ali-oss');
const config = require("../configs");

async function uploadOss(params, buffer) {
    let client = new OSS({
        internal: true,
        region: config.storage[params["upload:type"]].region,
        accessKeyId: config.storage[params["upload:type"]].key,
        accessKeySecret: config.storage[params["upload:type"]].secret,
        bucket: config.storage[params["upload:type"]].bucket
    });

    return client.put(params["upload:path"], buffer);
}


module.exports = {
    uploadOss,
};
