module.exports = {
    // https://peter.sh/experiments/chromium-command-line-switches/
    args: [
        "--autoplay-policy=user-gesture-required",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-component-update",
        '--disable-component-extensions-with-background-pages',
        "--disable-default-apps",
        "--disable-dev-shm-usage",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-notifications",
        "--disable-offer-store-unmasked-wallet-cards",
        "--disable-popup-blocking",
        "--disable-print-preview",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--disable-setuid-sandbox",
        "--disable-speech-api",
        "--disable-sync",
        "--hide-scrollbars",
        "--ignore-gpu-blacklist",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-first-run",
        "--no-pings",
        "--no-sandbox",
        "--no-zygote",
        "--password-store=basic",
        "--use-gl=swiftshader",
        "--use-mock-keychain",
        "--disabled-setupid-sandbox",

        "--disable-gpu",
        "--disable-web-security",
        "--allow-file-access-from-files",

        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disable-gpu-shader-disk-cache',
        "--disk-cache-size=0",
        '--media-cache-size=0',
    ],
    defaultViewport: { width: 1920, height: 1080 },
    timeout: 6000,

    // set UserDataDir to reuse js css cache
    // https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/user_data_dir.md
    userDataDir: global.appRoot + "/../runtime/chrome/userData",
    // executablePath: "/usr/local/data/chrome-linux/chrome",

    pool: {
        max: 10,
        min: 2,
        testOnBorrow: true,
    },

    // You may want to disable unnecessary requests, 3rd party scripts, ads / tracking etc.
    // A list of known tracking domains: https://github.com/notracking/hosts-blocklists
    blockedDomains: [

    ],
    blockedUrls: [

    ]
};