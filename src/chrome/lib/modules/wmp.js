/* eslint-disable no-restricted-globals */
/* global GV */
import $ from 'jquery'
import axios from 'axios'
import {CancelToken,
    delay,
    getServerTime,
    delayScheduleTime,
} from "./common";
import {PAYMENT_TYPE} from "./constants";

const cancelTokenSource = CancelToken.source()

const wmp = (config, personalConfig) => {

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
        if ($(`#selectShipMsg > li a[data-shipmsg="직접 입력"]`).length) {
            $(`#selectShipMsg > li a[data-shipmsg="직접 입력"]`)[0].click()
            $('#directShipMsg').trigger('focus')
            $('#directShipMsg').val(deliveryRequest)
            $('#directShipMsg').trigger('keyup')
            $('#directShipMsg').trigger('blur')
        }

        // 해외통관 동의
        $('#isPersonalOverseaNoChk')[0] && $('#isPersonalOverseaNoChk')[0].click()

        if (isCouponGet) {
            if ($('input[name="cartDirect"]').length) $('input[name="cartDirect"]')[0].click()
        }

        const selectShinhanCard = () => {
            $('#CARD a')[0] && $('#CARD a')[0].click()
            // 신한카드 선택
            $('#cardSelect li a').each((i, el) => {
                $(el).text() === '신한카드' && $(el)[0].click()
            })
            // 일시불
            $('#installmentList li a')[0] && $('#installmentList li a')[0].click()
        }

        const selectPayco = () => {
            // 간편결제
            $('#EASY a')[0] && $('#EASY a')[0].click()
            // 페이코
            $('#easySelect li a').each((i, el) => {
                $(el).text() === '페이코' && $(el)[0].click()
            })
        }

        switch (paymentType) {
            case PAYMENT_TYPE.SHINHAN_CARD:
                selectShinhanCard()
                break;
            case PAYMENT_TYPE.PAYCO:
                if ($('#EASY a').length > 0 && $('#EASY').is(':visible')) {
                    selectPayco()
                } else {
                    selectShinhanCard()
                }
                break;
            default:
                selectPayco()
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

export default wmp
