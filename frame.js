var APE = function() {
	this.server = window.location.host;
	this.settings = {};
	this.stack = [];
	this.transport = this.getTransport();
	if (!this.transport) throw "No transport supported; Sorry.";

	var tmp = window.location.hash.substr(1).split('&');
	for (var i = 0; i < tmp.length; i++) {
		this.settings[i] = tmp[i];
	}

	if ('addEventListener' in window) {
		window.addEventListener('message', this.onMessage.bind(this), 0);
	} else {
		window.attachEvent('onmessage', this.onMessage);
	}
}

APE.prototype.error = function() {
	console.log('error');
}

APE.prototype.onMessage = function(ev) {
	this.request = new this.transport();
	this.request.onreadystatechange = this.onreadystatechange.bind(this);
	this.request.open('POST', 'http://' + this.server + '/0/?', true);
	this.request.send(ev.data);
}
APE.prototype.onreadystatechange = function() {
	if (this.request.readyState == 4) {
		this.postMessage(this.request.responseText);
	}
}
APE.prototype.getTransport = function() {
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

APE.prototype.postMessage = function(str) {
	window.parent.postMessage(str, '*');
}


new APE();
