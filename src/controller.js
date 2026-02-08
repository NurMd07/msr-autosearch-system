import moment from "moment-timezone";
import { spawn } from 'child_process';
import path from 'path';
import axios from "axios";
import argvParser from 'minimist';
const argv = argvParser(process.argv.slice(2));
import fs, { read } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import logger from './logger.js';
import { log } from "console";


console.log = logger;

const isBrowser = 'browser' in argv;
const isMobile = "mobile" in argv;

const __dirname = import.meta.dirname;
const schedulerPath = path.join(__dirname, 'scheduler.js');

const HOST = process.env.HOST || 'localhost';
const ENV = process.env.ENV || 'production';
const DEBUG = process.env.DEBUG === 'true' || false;


if (isBrowser) {

    const child = spawn('node', [schedulerPath, ...(isBrowser ? ["--browser", isMobile ? "--mobile" : "--desktop"] : [])], { stdio: 'inherit' });

    child.on('exit', (code) => {
        console.log(`scheduler.js exited with code ${code}`);
    });
   
}else{



if (ENV === "development") {
    console.log("\n🚀 Development mode is ON\n");
    console.log("  ➖ Running in Development mode. Searches will start immediately and short delays.\n");
} else {
    console.log("\n✅ Production mode is ON\n");
}

if (DEBUG === true && ENV !== "production") {
    console.log("⚒️  DEBUG mode is ON\n");
    console.log("  ➖ Production Verbose logging enabled.\n")
}

async function runTimes(ENV, DEBUG) {

    const tz = "America/New_York";

    const currentTime = moment().tz(tz).valueOf();

    // Today 4 AM
    let next4AM = moment().tz(tz).startOf('day').add(4, 'hours').valueOf();

    if (currentTime >= next4AM) {
        next4AM = moment(next4AM).add(1, 'day').valueOf();
    }
    if (ENV === "production" || DEBUG === true) {
        console.log("\n=== Controller Scheduler Details ===\n");
        console.log("Current Time: ", moment(currentTime).tz(tz).format("dddd, h:mm A"));
        console.log("Next 4 AM: ", moment(next4AM).tz(tz).format("dddd, h:mm A"));
        console.log("Time until initial Iteration: ", Math.ceil((next4AM - currentTime) / 1000 / 60 / 60), "hours");
        console.log("\n================================\n");
        await axios.post(`http://${HOST}:8000/data`, { status: { firstRun: true, firstRunTime: next4AM } }).catch((err) => {
            console.error("Error sending first run data to app:", err.message);
        });
    }
    return { currentTime, next4AM };
}

const logFilePath = path.join(__dirname, '..', 'app.log');

async function startScheduler(ENV, DEBUG) {
    let initialTimes;
    if (ENV === "production" || DEBUG === true) {
        initialTimes = await runTimes(ENV, DEBUG);
    }
    let iteration = 0;
    let fileSize1 = 0;
    let fileSize2 = 0;

    setTimeout(() => {
        if (ENV === "production" || DEBUG === true) {
            console.log("Starting searches at: ", moment().tz("America/New_York").format("dddd, h:mm A"), "\n");
        }
        console.log("first start");
        const child = spawn('node', [schedulerPath], { stdio: 'inherit' });

        child.on('exit', async (code) => {
            console.log(`scheduler.js exited with code ${code}`);
            await axios.post(`http://${HOST}:8000/data`, { status: { firstRun: false, firstRunTime: null } }).catch((err) => {
                console.error("Error sending first run data to app:", err.message);

            });
            iteration++;

            fileSize1 = fs.statSync(logFilePath).size;

        });

        setInterval(async () => {

            const child = spawn('node', [schedulerPath], { stdio: 'inherit' });
            console.log("interval start");
            child.on('exit', async (code) => {
                console.log(`scheduler.js exited with code ${code}`);
                if (iteration === 2) {

                    let currentFileSize = fs.statSync(logFilePath).size;
                
                    const readStream = fs.createReadStream(logFilePath, {
                        start: fileSize1,
                        end: currentFileSize - 1
                    });
                    const chunks = [];
                    readStream.on('data', (chunk) => {
                        chunks.push(chunk);
                    });
                    readStream.on('end', () => {
                        const buffer = Buffer.concat(chunks);
                        const writeStream = fs.createWriteStream(logFilePath, {
                            flags: 'w' // default, but explicit is good
                        });

                        writeStream.write(buffer);
                        writeStream.end();
                        writeStream.on('finish', () => {

                            fileSize1 = fileSize2;
                            fileSize2 = fs.statSync(logFilePath).size - fileSize1;
                        });
                    });

                } else {
                    iteration++;

                    fileSize2 = fs.statSync(logFilePath).size - fileSize1;

                }
            });
        }, ENV === "development" ? 1000 * 60 * 7 : 24 * 60 * 60 * 1000);

    }, ENV === "development" ? 1000 : initialTimes.next4AM - initialTimes.currentTime);

}

startScheduler(ENV, DEBUG);

}