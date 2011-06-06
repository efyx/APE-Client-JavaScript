var APETransport = function(server, callback, options) {
	this.state = 0;//0 = Not initialized, 1 = Initialized and ready to exchange data, 2 = Request is running
	this.stack = [];
	this.callback = callback;

	if ('WebSocket' in window) {
		this.id = 6;
		var ws = new WebSocket('ws://' + server + '/6/');
		APETransport.prototype.send = function(str) {
			if (this.state > 0) ws.send(str);
			else this.stack.push(str);
		}.bind(this);

		ws.onopen = APETransport.prototype.onLoad.bind(this);

		ws.onmessage = function(ev) {
			callback.onmessage(ev.data);
		}
	} else {
		this.id = 0;
		var frame = document.createElement('iframe');
		this.frame = frame;

		with (frame.style) { 
			position = 'absolute';
			left = top = '-10px';
			width = height = '1px';
		}

		//frame.setAttribute('src', 'http://' + server + '/?[{"cmd":"script", "params": {"domain":"efyx.io", "scripts": ["http://ape.home.efyx.io/v2/frame.js"]}}]');
		frame.setAttribute('src', 'http://' + server + '/?[{"cmd":"frame", "params":{}}]');

		if ('addEventListener' in window) {
			window.addEventListener('message', this.frameMessage.bind(this), 0);
			frame.addEventListener('load', this.onLoad.bind(this), 0); 
		} else {
			window.attachEvent('onmessage', this.frameMessage.bind(this));
		}

		document.body.appendChild(frame);

		APETransport.prototype.send = APETransport.prototype.postMessage;
	}
}
APETransport.prototype.postMessage = function(str) {
	if (this.state > 0) {
		this.frame.contentWindow.postMessage(str, '*');
		this.state = 2;
	} else this.stack.push(str);
}
APETransport.prototype.frameMessage = function(ev) {
	this.state = 1;
	this.callback.onmessage(ev.data);
}
APETransport.prototype.onLoad = function() {
	if (this.id == 6) this.state = 2;
	else this.state = 1;

	for (var i = 0; i < this.stack.length; i++) this.send(this.stack[i]);
	this.stack = [];
}
