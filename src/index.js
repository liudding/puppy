require("dotenv").config();
var path = require("path");
global.appRoot = path.resolve(__dirname);

const createApp = require("./app");
const config = require("./configs");

const { checkSchema, validationResult } = require("express-validator");
const puppy = require("./puppy");
const { pool } = require("./puppy/browser-manager");
const { createLogger } = require("./utils/logger");
const logger = createLogger("web");
const systemLogger = createLogger("system");

// const sharp = require('sharp');
const { uploadOss } = require("./utils/upload");

const app = createApp();

app.get("/", (req, res) => {
    res.send("Woof, Woof, Go away! I am fine. ");
});

app.all(
    "/screenshot",
    checkSchema({
        url: { isString: true, trim: true, isURL: true },
    }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const params = Object.assign({}, req.body, req.query);

        try {
            const result = await puppy.process(params);
            let output = result;


            if (params.height || params.width) {
                // const image = await sharp(result)
                // const metadata = await image.metadata()

                // let w = metadata.width, h = metadata.height
                // if (params.height) {
                //     h = parseInt(params.height)
                // }
                // if (params.width) {
                //     w = parseInt(params.width)
                // }

                // w = Math.min(w, metadata.width)
                // h = Math.min(h, metadata.height)

                // if (w == metadata.width && h == metadata.height) {
                //     output = result
                // } else {
                //     const croped = await image.extract({
                //         top: 0,
                //         left: 0,
                //         width: w,
                //         height: h
                //     }).toBuffer()
                //     output = croped
                // }
            }

            if (params["upload:type"]) {
                await uploadOss(params, output)

                res.json({ path: params["upload:path"] });
            } else {
                res.set("Content-Type", "image/png").send(output)
            }
        } catch (err) {
            next(err);
        }
    }
);

app.all(
    "/pdf",
    checkSchema({
        url: { isString: true, trim: true, isURL: true },
    }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const params = Object.assign({}, req.body, req.query);
        params.handler = "pdf";

        try {
            const result = await puppy.process(params);

            // save your files here

            res.json({ filename: params.filename });
        } catch (err) {
            next(err);
        }
    }
);

app.all("/tracing", checkSchema({
    url: { in: ["query"], isString: true, trim: true, isURL: true },
}), async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const params = Object.assign({}, req.body, req.query);
    const timestamp = {
        start: Date.now(),
    }
    try {
        const result = await puppy.process(params, timestamp);
        res.json({ result });
    } catch (err) {
        next(err);
    }
});

app.get(
    "/metrics",
    checkSchema({
        url: { in: ["query"], isString: true, trim: true, isURL: true },
    }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const url = req.query.url;

        const page = await pool.acquire();
        await page.goto(url, { waitUntil: "networkidle0" });
        const metrics = await page.metrics();

        await pool.release(page);

        res.json(metrics);
    }
);

const server = app.listen(config.port, () => {
    systemLogger.info(`Puppy is listening on port ${config.port}`);
});

server.on("close", () => {
    systemLogger.info("Server closed");
    process.emit("cleanup");

    systemLogger.info("Giving 100ms time to cleanup..");
    setTimeout(process.exit, 100);
});

function closeServer(signal) {
    systemLogger.info(
        "%s signal received: Puppy is going to terminate",
        signal
    );
    server.close();
}

process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
});

process.on("SIGINT", closeServer.bind(this, "SIGINT(Ctrl-C)"));
process.on("SIGTERM", closeServer.bind(this, "SIGINT(Ctrl-C)"));
