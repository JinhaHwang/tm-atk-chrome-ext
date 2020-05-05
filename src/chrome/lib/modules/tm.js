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

const tm = (config, personalConfig) => {

    let goodsInfo = null;
    const moveStop = () => {
        goodsInfo = {}
    }

    const moveToProductPage = async () => {
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
                axios.get(`http://search.tmon.co.kr/api/search/v4/deals?_=${+new Date()}&keyword=${encodeURIComponent(keyword)}&thr=ts&mainDealOnly=true&page=1&useTypoCorrection=true&sortType=POPULAR`, {
                    cancelToken: cancelTokenSource.token
                }).then(async (res) => {
                    let body = res.data;
                    const { searchDeals } = body.data;
                    searchDeals.filter(keywordFilter)
                        .filter(priceFilter)
                        .forEach((item) => {
                            const { extraDealInfo } = item
                            goodsInfo = {
                                linkInfo: extraDealInfo.detailUrl,
                            }
                        })
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
            location.href = goodsInfo.linkInfo
        }
    }

    const moveToPayPage = async () => {
        const { optionPriority } = config
        const includedOptionIndex = options => {
            const foundedIndex = options.findIndex(option => optionPriority.find(op => option.title.indexOf(op) > -1))
            return foundedIndex > -1 ? foundedIndex : 0
        }
        try {

            const {optionTree} = TMON.oApp.htStorage
            const { childNodes } = optionTree.data.treeData

            console.log(childNodes)
            if (childNodes.length === 1) {
                // 옵션이 하나면 바로 선택되기 때문에 옵션선택 필요 없음
            } else {
                // 옵션 선택
                const selectIndex = includedOptionIndex(childNodes)
                // todo : 옵션 여러개 일 때 처리
                $('#_optionScroll > div > div > div > div > ul.purchase_selector > li:nth-child(1) > button')[selectIndex].click()
            }

            // 선택된 옵션이 있는지 확인
            while(!$('#_optionScroll > div > ul.prod:eq(0) > li').length) {
                await delay(50)
                console.log('나오나?')
            }
            console.log('옵션 선택 확인 됨~')
            // 바록 구매 클릭
            $('button[data-type="buyNow"]:eq(0)')[0].click()

        } catch (e) {
            console.error(e)
        }
        // while(!$('#_optionScroll > div > ul.prod:eq(0) > li').length) {
        //     await delay(50)
        // }

    }

    const moveToPay = async () => {
    }

    return {
        delay,
        getServerTime,
        delayScheduleTime,
        moveToProductPage,
        moveToPayPage,
        // todo
        moveToPay,
        moveStop,
    }
}

export default tm
