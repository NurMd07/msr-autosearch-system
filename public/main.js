
const resetTime = document.querySelector('.schedule .reset-time-value');
const randomTime1 = document.querySelector('.schedule .random-time1-value');
const randomTime2 = document.querySelector('.schedule .random-time2-value');
const completionTime = document.querySelector('.schedule .completion-time-value');
const randomTime1Platform = document.querySelector('.schedule .random-time1-platform');
const randomTime2Platform = document.querySelector('.schedule .random-time2-platform');
const mobileRunning = document.querySelector('.mobile-content-running');
const mobileCompleted = document.querySelector('.mobile-content-completed');
const mobileSchedule = document.querySelector('.mobile-content-schedule');
const pcRunning = document.querySelector('.pc-content-running');
const pcCompleted = document.querySelector('.pc-content-completed');
const pcSchedule = document.querySelector('.pc-content-schedule');
const msrId = document.querySelector('.header .msr-id');
const currentTimeValue = document.querySelector('.current-time-value');
// 1. Activate the plugins
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

// 2. Use it!
const nyTime = dayjs().tz("America/New_York").format('YYYY-MM-DD HH:mm');
const istTime = dayjs().tz("Asia/Kolkata").format('YYYY-MM-DD HH:mm');
currentTimeValue.innerText = nyTime;

setInterval(() => {
    const nyTime = dayjs().tz("America/New_York").format('D MMM h:mm A');
    currentTimeValue.innerText = nyTime;
}, 60000); // Update every minute


function timeLeft(targetTime) {
    const now = dayjs();
    const target = dayjs(targetTime);
    const diffInHours = target.diff(now, 'hour');
    return diffInHours > 0 ? diffInHours : 0;
}

async function getData() {
    try {
        const data = await axios.get('/data')
     
        resetTime.innerHTML = `${dayjs(data.data.schedule.resetTime).tz("America/New_York").format('D MMM h:mm A')}  ⌚`;
        randomTime1.innerHTML = `<span class="text-[0.65rem] text-gray-400 me-3">(${timeLeft(data.data.schedule.randomTime1)} Hours Left)</span> ${dayjs(data.data.schedule.randomTime1).tz("America/New_York").format('D MMM h:mm A')} `;
        randomTime2.innerHTML = `<span class="text-[0.65rem] text-gray-400 me-3">(${timeLeft(data.data.schedule.randomTime2)} Hours Left)</span> ${dayjs(data.data.schedule.randomTime2).tz("America/New_York").format('D MMM h:mm A')}`;
        completionTime.innerText = `🚀 ${data.data.schedule.completionTime / 1000 / 60} minutes`;
        msrId.innerText = `${data.data.id}`;
        if (data.data.progress1) {
            if (data.data.progress1.randomTime1IsMobile) {
                randomTime1Platform.innerText = `(Mobile)`;
                randomTime2Platform.innerText = `(PC)`;
                mobileRunning.innerText = data.data.progress1.randomTime1Running ? '✅' : '❌';
                mobileCompleted.innerText = data.data.progress1.randomTime1Completed ? '✅' : '❌';
              
                if (data.data.progress2) {
                    pcRunning.innerText = data.data.progress2.randomTime2Running ? '✅' : '❌';
                    pcCompleted.innerText = data.data.progress2.randomTime2Completed ? '✅' : '❌';
            
                } else {
                    pcRunning.innerText = '➖';
                    pcCompleted.innerText = '➖';
             
                }
                  mobileSchedule.innerText = `${dayjs(data.data.schedule.randomTime1).tz("America/New_York").format('D MMM h:mm A')}`;
                pcSchedule.innerText = `${dayjs(data.data.schedule.randomTime2).tz("America/New_York").format('D MMM h:mm A')}`;
            } else {
                randomTime1Platform.innerText = `(PC)`;
                randomTime2Platform.innerText = `(Mobile)`;
                if (data.data.progress2) {
                    mobileRunning.innerText = data.data.progress2.randomTime2Running ? '✅' : '❌';
                    mobileCompleted.innerText = data.data.progress2.randomTime2Completed ? '✅' : '❌';
              
                } else {
                    mobileRunning.innerText = '➖';
                    mobileCompleted.innerText = '➖';
              
                }
                pcRunning.innerText = data.data.progress1.randomTime1Running ? '✅' : '❌';
                pcCompleted.innerText = data.data.progress1.randomTime1Completed ? '✅' : '❌';
                mobileSchedule.innerText = `${dayjs(data.data.schedule.randomTime2).tz("America/New_York").format('D MMM h:mm A')}`;
                pcSchedule.innerText = `${dayjs(data.data.schedule.randomTime1).tz("America/New_York").format('D MMM h:mm A')}`;
            }
         
        } else if (data.data.progress2) {
            if (data.data.progress2.randomTime2IsMobile) {
                randomTime2Platform.innerText = `(Mobile)`;
                randomTime1Platform.innerText = `(PC)`;
                mobileRunning.innerText = data.data.progress2.randomTime1Running ? '✅' : '❌';
                mobileCompleted.innerText = data.data.progress2.randomTime1Completed ? '✅' : '❌';
                
                if (data.data.progress1) {
                    pcRunning.innerText = data.data.progress1.randomTime2Running ? '✅' : '❌';
                    pcCompleted.innerText = data.data.progress1.randomTime2Completed ? '✅' : '❌';
                    pcSchedule.innerText = '🕒';
                } else {
                    pcRunning.innerText = '➖';
                    pcCompleted.innerText = '➖';
 
                }
                    mobileSchedule.innerText = `${dayjs(data.data.schedule.randomTime2).tz("America/New_York").format('D MMM h:mm A')}`;
                pcSchedule.innerText = `${dayjs(data.data.schedule.randomTime1).tz("America/New_York").format('D MMM h:mm A')}`;
            } else {
                randomTime2Platform.innerText = `(PC)`;
                randomTime1Platform.innerText = `(Mobile)`;
                if (data.data.progress1) {
                    mobileRunning.innerText = data.data.progress1.randomTime2Running ? '✅' : '❌';
                    mobileCompleted.innerText = data.data.progress1.randomTime2Completed ? '✅' : '❌';
    
                } else {
                    mobileRunning.innerText = '➖';
                    mobileCompleted.innerText = '➖';
              
                }
                pcRunning.innerText = data.data.progress2.randomTime1Running ? '✅' : '❌';
                pcCompleted.innerText = data.data.progress2.randomTime1Completed ? '✅' : '❌';
              mobileSchedule.innerText = `${dayjs(data.data.schedule.randomTime1).tz("America/New_York").format('D MMM h:mm A')}`;
                pcSchedule.innerText = `${dayjs(data.data.schedule.randomTime2).tz("America/New_York").format('D MMM h:mm A')}`;
            }
        } else {
            mobileRunning.innerText = '➖';
            mobileCompleted.innerText = '➖';
       
            pcRunning.innerText = '➖';
            pcCompleted.innerText = '➖';
           
        }

    } catch (err) {
        console.error(err);
    }
}
const logContainer = document.querySelector('.log-content');
const eventSource = new EventSource(`${window.location.origin}/stream-logs`);

eventSource.onmessage = (event) => {
 
    const data = JSON.parse(event.data);
    const lineElement = document.createElement('div');
    const splitIndex = data.message.indexOf(']');
    if (splitIndex === -1) return;
    const timestamp = data.message.slice(0, splitIndex + 1);
    const message = data.message.slice(splitIndex + 2).trim();
    if(message === '') return;
    lineElement.innerHTML = `<span class="font-bold  pe-2 text-gray-500">${timestamp}</span><span> ${message}</span>`;
    logContainer.appendChild(lineElement);

    // Auto-scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
};

eventSource.onerror = (err) => {
    console.error("SSE failed:", err);
    eventSource.close();
};

getData();
setInterval(getData, 60000); // Refresh data every minute