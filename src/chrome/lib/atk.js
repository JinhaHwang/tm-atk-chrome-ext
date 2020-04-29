import $ from 'jquery'
import axios from 'axios'

const CancelToken = axios.CancelToken
const cancelTokenSource = CancelToken.source()

const loc = location.href

const PAYMENT_TYPE = {
    PAYCO: 'PAYCO',
    SHINHAN_CARD: 'SHINHAN_CARD'
}

const atk = (config, personalConfig) => {
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
        const { keyword, promotionUrl, scheduleTime, timeoutSecond } = config
        try {
            await delayScheduleTime(scheduleTime);

            setTimeout(() => {
                cancelTokenSource.cancel('Operation canceled by the user')
            }, timeoutSecond * 1000 || 5 * 1000)

            while (!goodsInfo) {
                await delay(50);
                axios.get(promotionUrl, {
                    cancelToken: cancelTokenSource.token
                }).then(async (res) => {
                    let body = res.data;
                    let match = body.match(/'initialData',\sJSON.parse\('(.+)'\)/);
                    if (match && match.length === 2) {
                        const parseResult = JSON.parse(match[1].replace(/\\/gm, ''));
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
                }).catch(e => {
                    console.error(e)
                    if (axios.isCancel(e)) {
                        console.log('Request canceled', e.message);
                        moveStop()

                    } else {
                        // 오류 처리
                        moveStop()
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

    const moveToPayPage = async () => {
        try {
            console.log('타나?')
            if (location.pathname.indexOf('adeal') > -1) {
                while(!$('#dealOnecutOption .option-select-box').length) {
                    await delay(50);
                }
                // 첫번째 옵션 선택
                $('#dealOnecutOption .option-select-box').each((i, el) => {
                    $(el).find('li a')[0].click()
                })

                // length가 0이거나 window.ins_cart_selected_opt게 없으면 계속 대기
                while(!$('.dealOptionSelected').length) {
                    await delay(10);
                }

                $('a.btn_buy')[0] && $('a.btn_buy')[0].click();
            } else {
                const { useYn } = GV.get('initialData').detail
                console.log(useYn)
                if (GV.get('initialData').prodSimpleList === undefined &&
                    GV.get('initialData').option &&
                    GV.get('initialData').option.sel) {
                    // 첫번째 옵션 선택
                    $('#_optionSelbox .ui_option_list').each((i, el) => {
                        $(el).find('a')[0].click()
                    })

                    // 결제페이지로 이동
                    $('a.buy')[0] && $('a.buy')[0].click()
                } else if (GV.get('initialData').prodSimpleList === undefined) {
                    $('a.buy')[0] && $('a.buy')[0].click()
                } else if (GV.get('initialData').prodSimpleList && GV.get('initialData').prodSimpleList.length) {
                    if (GV.get('initialData').prodSimpleList[0].optTextList && GV.get('initialData').prodSimpleList[0].optTextList.length) {
                        console.log('여기?1')
                        $('#_itemSelbox .item_option a:eq(0)').length && $('#_itemSelbox .item_option a')[0].click()
                        while(!$('#_optionSelbox > div > div > div.op_conts').length) {
                            await delay(50)
                        }
                        $('#_optionSelbox > div > div > div.op_conts > dl > dd').each((i, el) => {
                            $(el).find('a')[0].click()
                        })
                    } else {
                        console.log('여기?2')
                        // 첫번째 옵션 선택
                        $('#_itemSelbox .item_option a:eq(0)').length && $('#_itemSelbox .item_option a')[0].click()
                        while(!$('#_optionSelectList > li').length) {
                            await delay(50)
                        }
                        $('#_optionSelbox .ui_option_list').each((i, el) => {
                            $(el).find('a')[0].click()
                        })
                    }

                    // 결제페이지로 이동
                    $('a.buy')[0] && $('a.buy')[0].click()
                }
            }

        } catch (e) {
            console.error(e)
        }
    }

    const moveToPay = async () => {
        // todo : 매크로 만들거면 간편결제 페이코 ㄱ  아니면.. 신한카드
        const { paymentType } = personalConfig
        $('#personalOverseaNo').val('P160020983918')
        // 해외통관 동의
        $('#isPersonalOverseaNoChk')[0] && $('#isPersonalOverseaNoChk')[0].click()

        switch (paymentType) {
            case PAYMENT_TYPE.SHINHAN_CARD:
                $('#CARD a')[0] && $('#CARD a')[0].click()
                // 신한카드 선택
                $('#cardSelect li a').each((i, el) => {
                    $(el).text() === '신한카드' && $(el)[0].click()
                })
                // 일시불
                $('#installmentList li a')[0] && $('#installmentList li a')[0].click()
                break;
            case PAYMENT_TYPE.PAYCO:
                // 간편결제
                $('#EASY a')[0] && $('#EASY a')[0].click()
                // 페이코
                $('#easySelect li a').each((i, el) => {
                    $(el).text() === '페이코' && $(el)[0].click()
                })
                break;
            default:
                // 간편결제
                $('#EASY a')[0] && $('#EASY a')[0].click()
                // 페이코
                $('#easySelect li a').each((i, el) => {
                    $(el).text() === '페이코' && $(el)[0].click()
                })
                break;
        }

        // 약관 동의
        if (!$('#orderConditions').is(':checked')) $('#orderConditions')[0].click()

        // 결제하기 버튼 클릭
        $('#btnPaymentSubmit')[0].click()
    }

    return {
        delay,
        getServerTime,
        delayScheduleTime,
        moveToProductPage,
        moveToPayPage,
        moveToPay,
        moveStop,
    }
}


const configParam = {
    promotionUrl: 'https://front.wemakeprice.com/promotion/3591',
    scheduleTime: new Date('2020-04-29 02:40:00'),
    keyword: '실바니안',

    // Optional Parameters
    // 타임아웃 초
    timeoutSecond: 3,
}

const personalConfig = {
    paymentType: PAYMENT_TYPE.PAYCO,

    // Optional Parameters
    // 통관 고유 번호
    personalOverseaNo: 'P160020983918'
}

const tmatk = atk(configParam, personalConfig)

if (loc.indexOf('front.wemakeprice.com/promotion') > -1) {
    tmatk.moveToProductPage()

} else if (
    loc.indexOf('front.wemakeprice.com/deal') > -1 ||
    loc.indexOf('front.wemakeprice.com/adeal') > -1 ||
    loc.indexOf('front.wemakeprice.com/product') > -1
) {
    console.log('시작하는건가?')
    tmatk.moveToPayPage()
} else if (loc.indexOf('escrow.wemakeprice.com') > -1) {
    tmatk.moveToPay()
}
