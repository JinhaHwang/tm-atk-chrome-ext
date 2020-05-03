/* eslint-disable no-restricted-globals */
import atkWmp from "./modules/atk-wmp";
import {PAYMENT_TYPE} from "./modules/constants";

const configParam = {
    // todo : 프로모션 페이지 url 변경 필요
    promotionUrl: 'https://front.wemakeprice.com/promotion/group/all_wmpday',
    scheduleTime: new Date('2020-05-02 22:00:00'),
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

const wmpatk = atkWmp(configParam, personalConfig)

const loc = location.href

if (loc.indexOf('front.wemakeprice.com/promotion') > -1) {
    wmpatk.moveToProductPage()

} else if (
    loc.indexOf('front.wemakeprice.com/deal') > -1 ||
    loc.indexOf('front.wemakeprice.com/adeal') > -1 ||
    loc.indexOf('front.wemakeprice.com/product') > -1
) {
    wmpatk.moveToPayPage()
} else if (loc.indexOf('escrow.wemakeprice.com/order') > -1) {
    wmpatk.moveToPay()
}

// 테스트 주석2
