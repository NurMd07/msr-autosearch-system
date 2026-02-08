import search from './search.js';
import moment from 'moment-timezone';


import axios from "axios";
import argvParser from 'minimist';
const argv = argvParser(process.argv.slice(2));
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
const isBrowser = 'browser' in argv;
const isMobile = 'mobile' in argv;

const HOST = process.env.HOST || 'localhost';


if (isBrowser) {
    console.log(`\n🚀 Running in Browser Mode - ${isMobile ? "Mobile" : "Desktop"}\n`);
    console.log(isBrowser, isMobile);
    await search(isMobile, 0, 0, isBrowser);
}else{

console.log(`Environment: ${process.env.ENV}`);



// Env variables
const ENV = process.env.ENV || 'production';
const DEBUG = process.env.DEBUG === 'true' || false;

const TOTAL_ITERATION_DEV = Number(process.env.TOTAL_ITERATION_DEV) || null;
const MAX_MOBILE_POINTS = Number(process.env.MAX_MOBILE_POINTS) || 200;
const MAX_PC_POINTS = Number(process.env.MAX_PC_POINTS) || 300;
const DELAY_MIN = Number(process.env.DELAY_MIN) || 17;
const DELAY_MAX = Number(process.env.DELAY_MAX) || 21;
const MAX_SEARCH_DELAY_SEC = Number(process.env.MAX_SEARCH_DELAY_SEC) || 21;
const MAX_POINTS_PER_ITERATION = Number(process.env.MAX_POINTS_PER_ITERATION) || 15;
const POINTS_PER_SEARCH = Number(process.env.POINTS_PER_SEARCH) || 5;
const RANDOM_MAX_SEARCHES_OFFSET = Number(process.env.RANDOM_MAX_SEARCHES_OFFSET) || 1;
const RANDOM_TOTAL_ITERATIONS_OFFSET = Number(process.env.RANDOM_TOTAL_ITERATIONS_OFFSET) || 2;
const MAX_DELAY_BEFORE_NEXT_SEARCH_SEC = Number(process.env.MAX_DELAY_BEFORE_NEXT_SEARCH_SEC) || 3;

const tz = "America/New_York";
const currentTime = moment().tz(tz).valueOf();

// Today 4 AM
let next4AM = moment().tz(tz).startOf('day').add(4, 'hours').valueOf();

// If current time is already past 4 AM, move to tomorrow 4 AM
if (currentTime >= next4AM) {
    next4AM = moment(next4AM).add(1, 'day').valueOf();
}

const resetTime = next4AM;

const maxIterationsPC = (Math.floor(MAX_PC_POINTS / MAX_POINTS_PER_ITERATION)) + RANDOM_TOTAL_ITERATIONS_OFFSET;
const maxIterationsMobile = (Math.floor(MAX_MOBILE_POINTS / MAX_POINTS_PER_ITERATION)) + RANDOM_TOTAL_ITERATIONS_OFFSET;
const maxSearches = Math.floor(MAX_POINTS_PER_ITERATION / POINTS_PER_SEARCH) + RANDOM_MAX_SEARCHES_OFFSET;
const completionTime = maxIterationsPC * DELAY_MAX * (((MAX_SEARCH_DELAY_SEC + MAX_DELAY_BEFORE_NEXT_SEARCH_SEC) * maxSearches) / 60)
    * 60 * 1000; // in milliseconds


let randomTime1;
let randomTime2;

function calTotalIterations(isMobile) {
    if (isMobile) {
        return Math.round((Math.random() * ((maxIterationsMobile + RANDOM_TOTAL_ITERATIONS_OFFSET) - maxIterationsMobile)) + maxIterationsMobile);
    }
    return Math.round((Math.random() * ((maxIterationsPC + RANDOM_TOTAL_ITERATIONS_OFFSET) - maxIterationsPC)) + maxIterationsPC);
}

const devices = ['mobile', 'desktop'];

async function startSearches(randomTime1, randomTime2) {
    const isFirstMobile = devices[Math.floor(Math.random() * devices.length)] === 'mobile';
    const runSearches = async (isMobile, totalIteration, isRandomTime1) => {
        for (let i = 0; i < totalIteration; i++) {
            await search(isMobile, i + 1, totalIteration);
            let delay;
            if (ENV === "development") {
                delay = 1 // in minutes
            } else {
                delay = Math.floor(Math.random() * (DELAY_MAX - DELAY_MIN) + DELAY_MIN) // in minutes
            }
            if (i !== totalIteration - 1) {
                console.log(`\n⏳ Waiting for ${delay} minutes before next iteration...\n`);
            } else {
                console.log(`\n✅ All iterations completed for ${isMobile ? "Mobile" : "Desktop"} searches.\n`);
            }
            await new Promise(resolve => setTimeout(resolve, delay * 60 * 1000));
        }
        let data = {};
        if (isRandomTime1) {
            data = { progress1: { randomTime1Running: false, randomTime1Completed: true, randomTime1IsMobile: isMobile } };
        } else {
            data = { progress2: { randomTime2Running: false, randomTime2Completed: true, randomTime2IsMobile: isMobile } };
        }
        await axios.post(`http://${HOST}:8000/data`, data).catch((err) => {
            console.error("Error sending first run data to app:", err.message);
        });
    };



    if (ENV === "production" || DEBUG === true) {

        console.log("\n=== Search Schedule Details ===\n");

        console.log("Current Time:", moment(currentTime).tz("America/New_York").format("dddd, h:mm A"));
        console.log("Reset Time:", moment(resetTime).tz("America/New_York").format("dddd, h:mm A"));
        console.log("\nCompletion Time:", completionTime / (60 * 1000), "minutes\n");
        console.log("Random Search Time 1:", moment(randomTime1).tz("America/New_York").format("dddd, h:mm A"));
        console.log("Random Search Time 2:", moment(randomTime2).tz("America/New_York").format("dddd, h:mm A"), "\n");
        console.log("Time left for Random Search 1:", Math.ceil((randomTime1 - currentTime) / 1000 / 60 / 60), "hours from now");
        console.log("Time left for Random Search 2:", Math.ceil((randomTime2 - currentTime) / 1000 / 60 / 60), "hours from now\n");
        console.log("Time left until reset:", Math.ceil((resetTime - currentTime) / 1000 / 60 / 60), "hours from now");
        console.log("\n================================");

        await axios.post(`http://${HOST}:8000/data`, { schedule: { resetTime: resetTime, completionTime: completionTime, randomTime1: randomTime1, randomTime2: randomTime2 } }).catch((err) => {
            console.error("Error sending first run data to app:", err.message);
        });
    }

    if (ENV === "development") {
        const totalIteration1 = TOTAL_ITERATION_DEV || calTotalIterations(isFirstMobile);
        await axios.post(`http://${HOST}:8000/data`, { progress1: { randomTime1Running: true, randomTime1Completed: false, randomTime1IsMobile: isFirstMobile } }).catch((err) => {
            console.error("Error sending first run data to app:", err.message);
        });
        await runSearches(isFirstMobile, totalIteration1, true);

        const totalIteration2 = TOTAL_ITERATION_DEV || calTotalIterations(!isFirstMobile);
        await axios.post(`http://${HOST}:8000/data`, { progress2: { randomTime2Running: true, randomTime2Completed: false, randomTime2IsMobile: !isFirstMobile } }).catch((err) => {
            console.error("Error sending first run data to app:", err.message);
        });
        await runSearches(!isFirstMobile, totalIteration2, false);


    } else {
        if (randomTime1) {
            setTimeout(async () => {
                const totalIteration = calTotalIterations(isFirstMobile);
                await axios.post(`http://${HOST}:8000/data`, { progress1: { randomTime1Running: true, randomTime1Completed: false, randomTime1IsMobile: isFirstMobile } }).catch((err) => {
                    console.error("Error sending first run data to app:", err.message);
                });
                runSearches(isFirstMobile, totalIteration, true);
            }, randomTime1 - currentTime);
        }

        if (randomTime2) {
            setTimeout(async () => {
                const totalIteration = calTotalIterations(!isFirstMobile);
                await axios.post(`http://${HOST}:8000/data`, { progress2: { randomTime2Running: true, randomTime2Completed: false, randomTime2IsMobile: !isFirstMobile } }).catch((err) => {
                    console.error("Error sending first run data to app:", err.message);
                });
                runSearches(!isFirstMobile, totalIteration, false);
            }, randomTime2 - currentTime);
        }
    }
}

if (resetTime - completionTime >= currentTime) {
    randomTime1 = Math.floor(Math.random() * ((resetTime - completionTime) - currentTime) + currentTime);
    if (randomTime1 + completionTime <= resetTime - completionTime) {
        randomTime2 = Math.floor(Math.random() * ((resetTime - completionTime) - (randomTime1 + completionTime)) + (randomTime1 + completionTime));
    } else if (randomTime1 - completionTime >= currentTime) {
        randomTime2 = Math.floor(Math.random() * ((randomTime1 - completionTime) - currentTime) + currentTime);
    }
  
    startSearches(randomTime1, randomTime2)
} else {
    console.log("Not enough time to complete before reset.");
}

}