
async function pdf({ roi, page, params }) {
    const { width, height } = await roi.boxModel();
    const buffer = await page.pdf({
        // format: params.paper || 'A4',
        width: `${width || 1920}px`,
        height: `${height || 1080}px`,
        printBackground:
            params.printBackground === undefined ||
                params.printBackground === null
                ? true
                : params.printBackground,
    });
    return buffer;
}

async function screenshot({ roi, page, params }) {
    const format = params.format || "jpeg";
    const quality = format !== "png" ? params.quality || 70 : undefined;

    let buffer
    if (roi.node) {
        const options = {
            type: format,
            quality,

            optimizeForSpeed: true,
        }

        if (params.height || params.width) {
            const vp = await page.viewport()
            options.clip = {
                x: 0,
                y: 0,
                width: vp.width,
                height: vp.height,
            }

            if (params.height) {
                options.clip.height = Math.min(parseInt(params.height), options.clip.height)
            }
            if (params.width) {
                options.clip.width = Math.min(parseInt(params.width), options.clip.width)
            }
        }


        buffer = await roi.node.screenshot(options);

    } else if (roi.region) {
        buffer = await page.screenshot({
            type: format,
            quality,
            clip: roi.region,
            fullPage: params.full_page ?? false,
            omitBackground: false
        });
    }

    return buffer;
}

module.exports = {
    pdf,
    screenshot,
};
