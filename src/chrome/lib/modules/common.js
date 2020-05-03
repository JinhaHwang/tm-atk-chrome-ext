/* eslint-disable no-restricted-globals */
import axios from 'axios'

const CancelToken = axios.CancelToken

const delay = (timeout) => new Promise((resolve) => {
    setTimeout(resolve, timeout)
})

const getFormatDateString = (dateObject) => {
    const getFormatTimeNumber = number => number < 10 ? `0${number}` : number;

    const dt = dateObject || new Date()

    const year = dt.getFullYear()
    const month = getFormatTimeNumber(dt.getMonth()+1);
    const date = getFormatTimeNumber(dt.getDate());

    const hours = getFormatTimeNumber(dt.getHours())
    const minutes = getFormatTimeNumber(dt.getMinutes())
    const seconds = getFormatTimeNumber(dt.getSeconds())
    return `${year}.${month}.${date}. ${hours}:${minutes}:${seconds}`

}

const delayWithTimelog = ({scheduleTime, serverTime}) => new Promise((resolve) => {
    const timeout = scheduleTime - serverTime

    let second = Math.round(timeout / 1000)
    console.log(`${getFormatDateString(scheduleTime)}까지 ${second}초 전`)
    const timer = setInterval(() => {
        if (--second === 0) {
            clearInterval(timer)
        } else {
            console.log(`${getFormatDateString(scheduleTime)}까지 ${second}초 전`)
        }
    }, 1000)
    setTimeout(resolve, timeout)
})

const getServerTime = async () => {
    const res = await fetch(location.href)
    return new Date(res.headers.get('Date'))
}

const delayScheduleTime = async (scheduleTime) => {
    const serverTime = await getServerTime();
    console.log('서버시간: ', getFormatDateString(serverTime))
    if (scheduleTime.getTime() > serverTime.getTime()) {
        await delayWithTimelog({
            scheduleTime,
            serverTime
        });
    }
}

export {
    CancelToken,
    delay,
    getFormatDateString,
    delayWithTimelog,
    getServerTime,
    delayScheduleTime,
}
