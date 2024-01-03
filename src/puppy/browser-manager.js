// 浏览器管理器
// 负责管理浏览器以及标签页的创建、销毁
const genericPool = require("generic-pool");
const puppeteer = require("puppeteer");
const fs = require('fs');
const chromeConfig = require("../configs/chrome");
const { createLogger } = require("../utils/logger");
const logger = createLogger("browser");

const factory = {
    create: async function () {
        const browser = await getBrowser();
        const page = await browser.newPage();

        await page.setDefaultNavigationTimeout(60000);

        if (chromeConfig.blockedDomains.length > 0 || chromeConfig.blockedUrls.length > 0) {
            await page.setRequestInterception(true);
            page.on('request', request => {
                const url = request.url()
                if (chromeConfig.blockedDomains.some(domain => url.includes(domain))) {
                    request.abort();
                } else if (chromeConfig.blockedUrls.some(blockedUrl => url.includes(blockedUrl))) {
                    request.abort();
                } else {
                    request.continue();
                }
            });
        }

        return page;
    },
    destroy: async function (page) {
        return page.close();
    },
    validate: async function (page) {
        return !page.isClosed() && page.browser().isConnected();
    },
};

const pool = genericPool.createPool(factory, chromeConfig.pool);

pool.start();

const getBrowser = async () => {

    if (global.browser && global.browser.isConnected()) {
        return global.browser;
    }

    if (!global.browserWSEndpoint) {
        await openChromium();
        return global.browser;
    }

    try {
        logger.profile("connect chromium");
        global.browser = await puppeteer.connect({
            browserWSEndpoint: global.browserWSEndpoint,
            defaultViewport: chromeConfig.defaultViewport,
        });
        logger.profile("connect chromium");

        const existedPages = global.browser.pages();
        logger.info("%s pages exist", existedPages.length);

        if (existedPages.length > 0) {
            existedPages.forEach((page) => {
                page.close();
            });
        }
    } catch (err) {
        logger.info("connect chromium failed: %s", err);
        logger.info("trying reopen chromium...")
        await openChromium();
    }

    return global.browser;
};

const openChromium = async () => {
    if (chromeConfig.userDataDir) {
        fs.mkdir(chromeConfig.userDataDir, { recursive: true }, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log('Directory created successfully.');
            }
        });
    }

    try {
        logger.profile("launch chromium");
        global.browser = await puppeteer.launch({
            args: chromeConfig.args,
            defaultViewport: chromeConfig.defaultViewport,
            headless: "new",
            timeout: chromeConfig.timeout,
            userDataDir: chromeConfig.userDataDir,
            executablePath: chromeConfig.executablePath,
        });
        global.browserWSEndpoint = global.browser.wsEndpoint();
        global.browser.on("disconnected", function () {
            logger.info("chromium disconnected");
            pool.clear();
            logger.info("pool has been cleared");
        });
        logger.profile("launch chromium");
        logger.info("chromium launched");
    } catch (err) {
        logger.error("open chromium error: %s", err);
        throw err;
    }

    return global.browser;
};

module.exports = {
    pool,
};
