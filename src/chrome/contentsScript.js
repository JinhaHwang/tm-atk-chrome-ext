/* eslint-disable no-restricted-globals */
/* global chrome */
var loadScript = function(scriptUrl) {
    var s = document.createElement('script');
// add "myCall.js" to web_accessible_resources in manifest.json
    s.src = chrome.extension.getURL(scriptUrl);
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

if (location.href.indexOf('wemakeprice.com') > -1) {
    loadScript('lib/atkWmp.min.js')
} else if (location.href.indexOf('gmarket.co.kr')) {
    loadScript('lib/atkGmk.min.js')
} else {
    loadScript('lib/atkTm.min.js')
}
// if (location.href.indexOf('192.168.200.233/swagger-ui.html')>-1) {
//     loadScript("lib/swagger-auto-authorize.js")
// }
