const scripts = require("../handlers/internal");
const { pool } = require("./browser-manager.js");
const { createLogger } = require("../utils/logger");
const logger = createLogger("puppy");

class Puppy {
    handlers = {
        pdf: scripts.pdf,
        screenshot: scripts.screenshot,
    };

    /**
     * 初始化
     */
    async init() { }

    /**
     * 加载指定 URL
     * @param {*} url
     * @param {*} params
     */
    async load(url, params) {
        try {
            const page = await this.acquirePage();

            logger.info("setup browser page");
            const userAgent = await browser.userAgent();
            await page.setUserAgent(params.userAgent ?? `${userAgent} Puppy`)
            await page.setCacheEnabled(params.cache ?? true)
            await page.setExtraHTTPHeaders(params.headers ?? {})

            logger.info("load url: %s", url);
            // 根据参数加载页面
            await page.goto(url, {
                waitUntil: "load",
                timeout: params.timeout,
            });

            // 在 delay 或者页面回调之后，返回页面数据
            if (params.wait_for) {
                if (Number.isInteger(+params.wait_for)) {
                    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
                    await sleep(params.wait_for)
                } else {
                    await page.waitForSelector(params.wait_for, {
                        timeout: params.timeout ?? 50000,
                    })
                }
            }

            return page;
        } catch (error) {
            logger.info(`load url ${params.url} failed: `, error);
            throw error;
        }

    }

    async process(params) {
        logger.profile("load webpage");
        const page = await this.load(params.url, params);
        logger.profile("load webpage");
        const roi = await this.findRoi(page, params.roi);

        if (!roi) {
            pool.destroy(page);
            throw new Error("Invalid roi provided");
        }

        params.handler = params.handler || "screenshot"
        const handler = await this.resolveInternalHandler(params.handler);

        const result = await this.handle({
            roi,
            page,
            params,
            handler
        });
        await pool.release(page);

        return result;
    }

    /**
     * 查找 ROI 区域
     * @param {*} page 
     * @param {*} roi 
     * @returns 
     */
    async findRoi(page, roi) {
        if (!roi) {
            return { node: page };
        }

        // logger.info("find roi: %s", roi);
        logger.profile("find roi");

        if (roi.startsWith("region:")) {
            let region = roi.replace("region:", "");
            const [x, y, width, height] = region.split(",").map((item) => {
                return Number(item);
            });
            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
                throw new Error("Invalid roi region provided");
            }
            region = { width, height, x, y };
            logger.profile("find roi");
            return { region };
        }

        if (roi.startsWith("selector:")) {
            const selector = roi.replace("selector:", "");
            if (!selector) {
                throw new Error("Invalid roi selector provided");
            }
            let node = await page.$(selector);
            if (!node) {
                logger.error("roi selector not found: %s", selector);
                return null;
            }


            logger.profile("find roi");
            return { node };
        }
    }

    async handle({ roi, page, params, handler }) {
        if (!handler) {
            throw new Error("Invalid handler provided");
        }

        logger.profile(`handle ${params.handler}`)
        const res = await handler({ roi, page, params });
        logger.profile(`handle ${params.handler}`)
        return res
    }

    /**
     * 在隔离环境中处理页面
     *
     * @param {*} page
     * @param {*} params
     * @param {*} handler
     */
    async processInSandbox(page, params, handler) { }

    /**
     * 解析内置脚本处理器
     * @param {*} name 名称
     */
    async resolveInternalHandler(name) {
        return this.handlers[name];
    }

    async acquirePage() {
        logger.info("acquire a page from pool");

        const page = await pool.acquire();
        if (!page.isClosed()) {
            return page;
        }

        logger.info("acquired page has been closed, acquire a new one");

        await pool.destroy(page);

        return await pool.acquire();
    }
}

module.exports = new Puppy();
