/* eslint-disable no-restricted-globals */
/* global TMON */
import $ from 'jquery'
import axios from 'axios'
import {CancelToken,
    delay,
    getServerTime,
    delayScheduleTime,
} from "./common";
import {PAYMENT_TYPE} from "./constants";

const cancelTokenSource = CancelToken.source()

const gmk = (config, personalConfig) => {

    let goodsInfo = null;
    const moveStop = () => {
        goodsInfo = {}
    }

    const moveToProductPage = async () => {

    }

    const moveToEventProductPagee = async () => {
        const { keyword, adoptKeyword, scheduleTime, timeoutSecond, price } = config

        const keywordFilter = ({ searchDealResponse: { dealInfo } }) => {
            const keywords = adoptKeyword.split(',')
            return keywords.some(k => {
                return dealInfo.titleName.toLowerCase().indexOf(k.toLowerCase()) > -1
            })
        }

        const priceFilter = ({ searchDealResponse: { dealInfo: { priceInfo } } }) => {
            return priceInfo.price === price
        }

        try {
            await delayScheduleTime(scheduleTime);

            setTimeout(() => {
                cancelTokenSource.cancel('Operation canceled by the user')
            }, timeoutSecond * 1000 || 5 * 1000)

            while (!goodsInfo) {
                await delay(50);

                axios.get(location.href, {
                    cancelToken: cancelTokenSource.token
                }).then(async (res) => {

                    let body = res.data;
                    // const href = $('#comp_6702070 > div > div > div.sliderwrap > ul > li:nth-child(5) > div > div > div > div > div > div.btnbx > a').attr('href')
                    const href = $(body).find('#comp_6702072 a.btn_buy').attr('href')

                    if (href) {
                        goodsInfo = {
                            linkInfo: href,
                        }
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

        if (goodsInfo.linkInfo) {
            window.open(goodsInfo.linkInfo)
            // location.href = goodsInfo.linkInfo
        }
    }



    const moveToPayPage = async () => {
        const { optionPriority } = config
        const includedOptionIndex = $options => {
            let arr = [];
            $options.each((i, el) => arr.push($(el).text()))
            const foundedIndex = arr.findIndex(s => optionPriority.find(o => s.indexOf(o) > -1))
            return foundedIndex > -1 ? foundedIndex : 0
        }

        try {

            $('.item-topinfo div.select-item>div.item_options ul').each((i, el) => {
                const selectIndex = includedOptionIndex($(el).find('a'))
                $(el).find('a')[selectIndex].click()
            })

            // 선택된 옵션이 있는지 확인
            while(!$('ul.selected-list:eq(0) li').length) {
                await delay(50)
            }
            // 바록 구매 클릭
            $('#coreInsOrderBtn')[0].click()

        } catch (e) {
            console.error(e)
        }
        // while(!$('#_optionScroll > div > ul.prod:eq(0) > li').length) {
        //     await delay(50)
        // }

    }

    const moveToPay = async () => {
        $('a.im_btn.submit').length > 0 && $('a.im_btn.submit')[0].click()
    }

    return {
        delay,
        getServerTime,
        delayScheduleTime,
        moveToProductPage,
        moveToEventProductPagee,
        moveToPayPage,
        // todo
        moveToPay,
        moveStop,
    }
}

export default gmk
