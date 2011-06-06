function getTransport() {
	if ('XMLHttpRequest' in window) return XMLHttpRequest;
    if ('ActiveXObject' in window) {
        var names = [
            "Msxml2.XMLHTTP.6.0",
            "Msxml2.XMLHTTP.3.0",
            "Msxml2.XMLHTTP",
            "Microsoft.XMLHTTP"
        ];
        for(var i in names)
        {
            try{ return ActiveXObject(names[i]); }
            catch(e){}
        }
    }
    return false; // non supporté
}
function onMessage(ev) {
	request = new transport();
	request.onreadystatechange = onreadystatechange;
	request.open('POST', 'http://' + server + '/0/?', true);
	request.send(ev.data);
}
function onreadystatechange() {
	if (request.readyState == 4) postMessage(request.responseText);
}
function postMessage(str) {
	window.parent.postMessage(str, '*');
}


var request;
var server = window.location.host;
var transport = getTransport();
if (!transport) throw "No transport supported; Sorry."

if ('addEventListener' in window) {
	window.addEventListener('message', onMessage, 0);
} else {
	window.attachEvent('onmessage', onMessage);
}
