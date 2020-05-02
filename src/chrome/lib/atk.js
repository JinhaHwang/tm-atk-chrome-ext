/* eslint-disable no-restricted-globals */
/* global GV */
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
        const { keyword, promotionUrl, scheduleTime, timeoutSecond, price } = config

        const keywordFilter = item => {
            const keywords = keyword.split(',')
            return keywords.some(k => {
                return item.dispNm.toLowerCase().indexOf(k.toLowerCase()) > -1
            })
        }
        const priceFilter = item => item.salePrice === price || item.discountPrice === price

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
                        const { dealList } = parseResult.classificationInfo.data
                        dealList.filter(keywordFilter)
                            .filter(priceFilter)
                            .forEach(val => {
                                goodsInfo = {
                                    linkInfo: val.linkInfo,
                                    linkType: val.linkType
                                }
                            })
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
        const { optionPriority, isCouponGet } = config
        const { email } = personalConfig
        const includedOptionIndex = $options => {
            let arr = [];
            $options.each((i, el) => arr.push($(el).text()))
            const foundedIndex = arr.findIndex(s => optionPriority.find(o => s.indexOf(o) > -1))
            return foundedIndex > -1 ? foundedIndex : 0
        }

        // 쿠폰 받을거면 아래 코드
        if (isCouponGet && $('#_infoAreaCoupon > a').length) {
            $('#_infoAreaCoupon > a')[0].click()
            while(!$('#_infoAreaCoupon > div > div > a.btns_sys.redline_sml_s').length) {
                await delay(50)
            }
            $('#_infoAreaCoupon > div > div > a.btns_sys.redline_sml_s')[0].click()
        }

        try {
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
                const { prodSimpleList, option } = GV.get('initialData')
                if (prodSimpleList === undefined && option && option.sel) {
                    // 첫번째 옵션 선택
                    $('#_optionSelbox .ui_option_list').each((i, el) => {
                        // let arr = [];
                        // $(el).find('.opt_text').each((i, el) => arr.push($(el).text()))
                        // const foundedIndex = arr.findIndex(s => optionPriority.find(o => s.indexOf(o) > -1))
                        // const selectIndex = foundedIndex > -1 ? foundedIndex : 0
                        const selectIndex = includedOptionIndex($(el).find('.opt_text'))
                        $(el).find('a')[selectIndex].click()
                    })

                    // 결제페이지로 이동
                    $('a.buy')[0] && $('a.buy')[0].click()
                } else if (prodSimpleList === undefined) {
                    $('a.buy')[0] && $('a.buy')[0].click()
                } else if (prodSimpleList && prodSimpleList.length) {
                    const foundedIndex = prodSimpleList.map(p => p.prodNm).findIndex(s => optionPriority.find(o => s.indexOf(o) > -1))
                    const selectIndex = foundedIndex > -1 ? foundedIndex : 0

                    if (prodSimpleList[0].optTextList && prodSimpleList[0].optTextList.length) {
                        console.log('여기?1')
                        $(`#_itemSelbox .item_option a:eq(${selectIndex})`).length && $('#_itemSelbox .item_option a')[selectIndex].click()
                        while(!$('#_optionSelbox > div > div > div.op_conts').length) {
                            await delay(50)
                        }
                        $('#_optionSelbox > div > div > div.op_conts > dl > dd').each((i, el) => {
                            const selectIndex = includedOptionIndex($(el).find('.opt_text'))
                            $(el).find('a')[selectIndex].click()
                        })
                    } else {
                        // 첫번째 옵션 선택
                        $(`#_itemSelbox .item_option a:eq(${selectIndex})`).length && $('#_itemSelbox .item_option a')[selectIndex].click()
                        while(!$('#_optionSelectList > li').length) {
                            await delay(50)
                        }
                        $('#_optionSelbox .ui_option_list').each((i, el) => {
                            const selectIndex = includedOptionIndex($(el).find('.opt_text'))
                            $(el).find('a')[selectIndex].click()
                        })

                    }
                    if ($('#_optionTxtArea a[data-option-btn=infoEnter]').length) {
                        $('#_optionTxtArea input[data-option=textOption]').val(email)
                        $('#_optionTxtArea a[data-option-btn=infoEnter]')[0].click()
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
        const { isCouponGet } = config
        const { paymentType, deliveryRequest } = personalConfig
        // 통관입력
        $('#personalOverseaNo').val('P160020983918')

        // 배송시 요청사항
        $(`#selectShipMsg > li a[data-shipmsg="직접 입력"]`)[0].click()
        $('#directShipMsg').trigger('focus')
        $('#directShipMsg').val(deliveryRequest)
        $('#directShipMsg').trigger('keyup')
        $('#directShipMsg').trigger('blur')
        // await delay(100)

        // 해외통관 동의
        $('#isPersonalOverseaNoChk')[0] && $('#isPersonalOverseaNoChk')[0].click()

        if (isCouponGet) {
            if ($('input[name="cartDirect"]').length) $('input[name="cartDirect"]')[0].click()
        }
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
    // todo : 프로모션 페이지 url 변경 필요
    promotionUrl: 'https://front.wemakeprice.com/promotion/group/all_wmpday',
    scheduleTime: new Date('2020-05-01 22:00:00'),
    // keyword: '케이블',
    // price: 1900,
    keyword: '닥터키친,닥터 키친,밥솥',
    price: 119900,
    optionPriority: ['라이언','white','WHITE','흰색','블랙', 'BLK', 'BLACK', 100, 'L', '트로이'],

    // Optional Parameters
    // 타임아웃 초
    timeoutSecond: 3,
    // 쿠폰 받을거면 아래 true, 안받을거면 false
    isCouponGet: true,
}

const personalConfig = {
    // todo : PAYCO 또는 SHINHAN_CARD 만 현재 가능 (PAYMENT_TYPE.PAYCO, PAYMENT_TYPE.SHINHAN_CARD)
    paymentType: PAYMENT_TYPE.PAYCO,

    // Optional Parameters
    // 통관 고유 번호
    personalOverseaNo: 'P160020983918',

    email: 'gojinha@naver.com',

    // 배송시 요청사항
    deliveryRequest: '문 앞에 놔주세요'
}

const tmatk = atk(configParam, personalConfig)

if (loc.indexOf('front.wemakeprice.com/promotion') > -1) {
    tmatk.moveToProductPage()

} else if (
    loc.indexOf('front.wemakeprice.com/deal') > -1 ||
    loc.indexOf('front.wemakeprice.com/adeal') > -1 ||
    loc.indexOf('front.wemakeprice.com/product') > -1
) {
    tmatk.moveToPayPage()
} else if (loc.indexOf('escrow.wemakeprice.com/order') > -1) {
    tmatk.moveToPay()
}
