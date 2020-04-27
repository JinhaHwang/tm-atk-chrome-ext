import $ from 'jquery'
console.info($)
const loc = location.href

const PAYMENT_TYPE = {
    PAYCO: '페이코',
}

const atk = (config, payment) => {
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
        const res = await fetch(loc)
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

    let goodsInfo = null;
    const moveStop = () => {
        goodsInfo = {}
    }

    const moveToProductPage = async () => {
        const { keyword, promotionUrl, scheduleTime } = config
        try {
            await delayScheduleTime(scheduleTime);

            while (!goodsInfo) {
                await delay(50);
                fetch(promotionUrl).then(async (res) => {
                    let body = await res.text();
                    let match = body.match(/'initialData',\sJSON.parse\('(.+)'\)/);
                    if (match && match.length === 2) {
                        const parseResult = JSON.parse(match[1]);
                        parseResult.classificationInfo.data.dealList.map(val => {
                            // if (val.dispNm.match(goodsName)) {
                            if (val.dispNm.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
                                // if (val.dispNm.match(goodsName) && val.saleStatus !== 'S') {
                                goodsInfo = {
                                    linkInfo: val.linkInfo,
                                    linkType: val.linkType
                                }
                            }
                        });

                    }
                })
            }
        } catch (err) {
            console.error(err)
            moveStop()
        }

        let url = '';
        if (goodsInfo.linkType === 'PROD') {
            url = `https://front.wemakeprice.com/product/${goodsInfo.linkInfo}`
        } else if (goodsInfo.linkType === 'DEAL') {
            url = `https://front.wemakeprice.com/deal/${goodsInfo.linkInfo}`
        } else if (goodsInfo.linkType === 'LIVE_DEAL') {
            url = `http://www.wemakeprice.com/deal/adeal/${goodsInfo.linkInfo}`
        }

        if (url) {
            location.href = url;
        }
    }

    return {
        delay,
        getServerTime,
        delayScheduleTime,
        moveToProductPage,
        moveStop,
    }
}


const configParam = {
    promotionUrl: 'https://front.wemakeprice.com/promotion/3693',
    scheduleTime: new Date('2020-04-26 14:14:30'),
    keyword: '닌텐도',
}

const paymentParam = {
    paymentType: PAYMENT_TYPE.PAYCO,
}

const tmatk = atk(configParam, paymentParam)

if (loc.indexOf('front.wemakeprice.com/promotion') > -1) {
    tmatk.moveToProductPage()
    const timeoutSecond = 1 * 1000
    setTimeout(() => {
        tmatk.moveStop()
    }, timeoutSecond)
}

