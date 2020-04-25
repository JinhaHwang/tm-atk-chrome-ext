var loadScript = function(scriptUrl) {
    var s = document.createElement('script');
// add "myCall.js" to web_accessible_resources in manifest.json
    s.src = chrome.extension.getURL(scriptUrl);
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}

loadScript('lib/lodash.js')
loadScript('lib/moment.min.js')
loadScript('lib/myCall.js')
// if (location.href.indexOf('192.168.200.233/swagger-ui.html')>-1) {
//     loadScript("lib/swagger-auto-authorize.js")
// }
