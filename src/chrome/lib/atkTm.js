/* eslint-disable no-restricted-globals */
import tm from "./modules/tm";
import {PAYMENT_TYPE} from "./modules/constants";

const configParam = {
    // todo : 프로모션 페이지 url 변경 필요
    scheduleTime: new Date('2020-05-04 00:55:00'),
    // keyword: '케이블',
    // price: 1900,
    // 상품 검색을 위한 키워드
    keyword: '닌텐도스위치',
    // 검색된 것중에 채택할 상품명
    adoptKeyword: '닌텐도,닌텐도스위치,닌텐도 스위치,스위치',
    // 필터링할 가격 정보
    price: 335500,
    optionPriority: ['라이언','white','WHITE','흰색','블랙', 'BLK', 'BLACK', 100, 'L', '트로이'],

    // Optional Parameters
    // 타임아웃 초
    timeoutSecond: 1,
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

// 티몬은 미리 쿠폰을 받아두면 결제시 적합한 쿠폰이 자동으로 선택된다.
const tmatk = tm(configParam, personalConfig)
const loc = location.href
if (loc.indexOf('search.tmon.co.kr') > -1 || loc.indexOf('search.ticketmonster.co.kr') > -1) {
    tmatk.moveToProductPage()
} else if (loc.indexOf('tmon.co.kr/deal') > -1) {
    tmatk.moveToPayPage()
} else {
    console.log(' 티몬 티몬 ~ ')
}
