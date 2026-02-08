import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

import words from './words.json' with { type: 'json' };
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

console.log = logger;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, '../.env'),
  override: true
});
const ENV = process.env.ENV || 'production';

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

const MIN_SEARCH_DELAY_SEC = Number(process.env.MIN_SEARCH_DELAY_SEC) || 16;
const MAX_SEARCH_DELAY_SEC = Number(process.env.MAX_SEARCH_DELAY_SEC) || 21;
const MAX_POINTS_PER_ITERATION = Number(process.env.MAX_POINTS_PER_ITERATION) || 15;
const POINTS_PER_SEARCH = Number(process.env.POINTS_PER_SEARCH) || 5;
const RANDOM_MAX_SEARCHES_OFFSET = Number(process.env.RANDOM_MAX_SEARCHES_OFFSET) || 1;
const SEARCH_WAIT_SEC_DEV = Number(process.env.SEARCH_WAIT_SEC_DEV) || 1;

const onePlusNord4 = {
    name: 'OnePlus Nord 4',
    userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    viewport: { width: 355, height: 793, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, isLandscape: false },
    vendor: 'Google Inc.',
    platform: 'Linux armv8l',
    appVersion: '5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
    maxTouchPoints: 5,
    hardwareConcurrency: 8,
    deviceMemory: 8,
    gpuVendor: 'Qualcomm',
    gpuModel: 'Adreno (TM) 732',
}

async function setupPage(page) {
    try {

        // fallback: set UA + viewport + CDP touch emulation

        await page.setUserAgent(onePlusNord4.userAgent);
        await page.setViewport(onePlusNord4.viewport);
        const client = await page.target().createCDPSession();
        await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: onePlusNord4.maxTouchPoints });


        // Always set Network UA override too (CDP-level)
        try {
            const client = await page.target().createCDPSession();
            await client.send('Network.setUserAgentOverride', { userAgent: onePlusNord4.userAgent });
            // ensure touch emulation present too
            await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: onePlusNord4.maxTouchPoints });
        } catch (e) {
            // ignore if not possible
        }

        await page.evaluateOnNewDocument((onePlusNord4) => {
            try {
                // identity & UA
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => onePlusNord4.userAgent,
                    configurable: true
                });
                Object.defineProperty(navigator, 'platform', { get: () => onePlusNord4.platform, configurable: true });
                Object.defineProperty(navigator, 'vendor', { get: () => onePlusNord4.vendor, configurable: true });
                Object.defineProperty(navigator, 'appVersion', { get: () => onePlusNord4.appVersion, configurable: true });
                // touch & hardware
                Object.defineProperty(navigator, 'maxTouchPoints', { get: () => onePlusNord4.maxTouchPoints, configurable: true });
                Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => onePlusNord4.hardwareConcurrency, configurable: true });
                Object.defineProperty(navigator, 'deviceMemory', { get: () => onePlusNord4.deviceMemory, configurable: true });
                // webdriver
                try { Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true }); } catch (e) { }

                // WebGL getParameter override for unmasked vendor/renderer
                try {
                    const proto = WebGLRenderingContext && WebGLRenderingContext.prototype;
                    if (proto && proto.getParameter) {
                        const original = proto.getParameter;
                        proto.getParameter = function (p) {
                            if (p === 37445) return onePlusNord4.gpuVendor;
                            if (p === 37446) return onePlusNord4.gpuModel;

                            return original.call(this, p);
                        };
                    }
                } catch (e) { }
            } catch (err) {
                // swallow
            }
        }, onePlusNord4);

        // Optional: intercept new windows opened from this page and ensure they get set up as well
        page.on('popup', async popup => {
            try { await setupPage(popup); } catch (e) { }
        });

    } catch (err) {
        console.warn('setupPage failed:', err.message || err);
    }
}


export default async (isMobile = true, iterationCount, maxIteration, isBrowser = false) => {
    const browser = await puppeteer.launch({
        executablePath: `${CHROMIUM_PATH}`,
        headless: false,
        userDataDir: './puppeteer-data', // persistent profile
        args: ['--no-sandbox', '--disable-dev-shm-usage', `--window-size=${isMobile ? onePlusNord4.viewport.width : 600},${isMobile ? onePlusNord4.viewport.height : 400}`],
    });

    // Apply to already-open pages (startup)
    const pages = await browser.pages();

    if (isMobile) {
        for (const page of pages) {
            await setupPage(page);
        }

        // Apply to any new page/tab that gets created later
        browser.on('targetcreated', async target => {
            if (target.type() !== 'page') return;
            try {
                // target.page() may be null for a short time; retry briefly
                let page = null;
                for (let i = 0; i < 10 && !page; i++) {
                    page = await target.page();
                    if (!page) await new Promise(r => setTimeout(r, 50));
                }
                if (page) await setupPage(page);
            } catch (e) {
                // ignore
            }
        });
    }
   
    if (isBrowser){

 return
    };

    async function startSearch(initialSearchNo, maxSearchNo, minDelay, MaxDelay) {

        if (initialSearchNo === maxSearchNo) {
            return;
        }

        console.log(`\n 🔎 Search No.${initialSearchNo + 1}`);

        const page = await browser.newPage();   // open new tab/page
        if (isMobile) {
            await setupPage(page);                  // apply your mobile setup
        }

        const random_word = words[Math.floor(Math.random() * words.length)];

        await page.goto(`https://www.bing.com/search?q=${random_word}&form=QBLH&sp=-1&lq=0&pq=ssd&sc=12-3&qs=n`, { waitUntil: 'domcontentloaded' });
        let random_wait;
        if (ENV === "production") {
            random_wait = Math.round((Math.random() * (MAX_SEARCH_DELAY_SEC - MIN_SEARCH_DELAY_SEC)) + MIN_SEARCH_DELAY_SEC); // in seconds
        } else {
            random_wait = SEARCH_WAIT_SEC_DEV; // in seconds for faster testing
        }
        console.log(`   ⌛ Waiting for ${Math.trunc(random_wait)} seconds before closing the tab...`);

        await new Promise(resolve => setTimeout(resolve, random_wait * 1000));

        await page.close();

        console.log('   ☑️  Search Completed - tab closed.');

        if (initialSearchNo + 1 < maxSearchNo) {
            console.log('\nWaiting a bit before next search...');
            await new Promise(resolve => setTimeout(resolve, ((Math.random() * 3 + 1) * 1000)));
        } else {
            console.log('\nAll searches completed. Exiting...\n');
        }

        initialSearchNo++;

        await startSearch(initialSearchNo, maxSearchNo, minDelay, MaxDelay);                     // repeat

    }
    if (iterationCount && iterationCount <= 1) {
        console.log(`\nPlatform - ${isMobile ? "Mobile" : "Desktop"} Browser\n`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    const maxSearches = Math.floor(MAX_POINTS_PER_ITERATION / POINTS_PER_SEARCH) + RANDOM_MAX_SEARCHES_OFFSET;
    const minSearches = Math.floor(MAX_POINTS_PER_ITERATION / POINTS_PER_SEARCH);
    const maxSearchesRandom = Math.round((Math.random() * (maxSearches - minSearches)) + minSearches);

    console.log(`✅ Starting searches ♾️  Iteration - ${iterationCount} of ${maxIteration} (Max Searches: ${maxSearchesRandom})`);

    await startSearch(0, maxSearchesRandom, MIN_SEARCH_DELAY_SEC, MAX_SEARCH_DELAY_SEC, iterationCount); // initial search

    browser.close();

};
