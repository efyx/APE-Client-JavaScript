function APE(server, options, events) {
	this.options = {
		'poll': 25000,
	}
	this.version = 'ng-draft-0.2';
	this.state = 0;
	this.ev = {};
	this.chl = 0;
	this.user = {};
	this.pipes = {};

	for (var i in events) {
		if (events.hasOwnProperty(i)) this.addEvent(i, events[i]);
	}

	var cb = {
		'onmessage': this.onMessage.bind(this)
	}

	this.transport = new APETransport(server, cb, options);
}

APE.prototype.fireEvent = function(ev, args) {
	ev = ev.toLowerCase();
	if (!(args instanceof Array)) args = [args];
	for (var i in this.ev[ev]) if (this.ev[ev].hasOwnProperty(i)) this.ev[ev][i].apply(null, args);
}

APE.prototype.addEvent = function(ev, fn) {
	ev = ev.toLowerCase();
	if (!this.ev[ev]) this.ev[ev] = [];
	this.ev[ev].push(fn);
}

APE.prototype.poll = function() {
	this.poller = setTimeout((function() { this.check() }).bind(this), this.options.poll);
}

APE.prototype.onMessage = function(data) {

	try { data = JSON.parse(data) }
	catch(e) { this.send('CHECK') }

	console.log('<=', data);

	var cmd, args, pipe;
	for (var i = 0; i < data.length; i++) {
		cmd = data[i].raw;
		args = data[i].data;
		pipe = null;
		clearTimeout(this.poller);

		switch (cmd) {
			case 'LOGIN':
				this.state = 1;
				this.user.sessid = args.sessid;
				this.fireEvent('onready');
				this.poll();
			break;
			case 'CHANNEL':
				if (typeof APEChannel != 'undefined') {
					pipe = new APEChannel(args.pipe, this);
					this.pipes[pipe.pubid] = pipe;
					this.fireEvent('mkChan', pipe);
				}

				if (typeof APEUser != 'undefined') {
					var u = args.users;
					var user;
					for (var i = 0; i < u.length; i++) {
						user = this.pipes[u[i].pubid]
						if (!user) {
							user = new APEUser(u[i], this);
							this.pipes[user.pubid] = user;
						}

						user.channels[pipe.pubid] = pipe;
						pipe.users[user.pubid] = user;

						this.fireEvent('join', [user, pipe]);
					}
				}
			break;
			case 'JOIN':
				var user = this.pipes[args.user.pubid];
				pipe = this.pipes[args.pipe.pubid];

				if (!user) {
					user = new APEUser(args.user);
					this.pipes[user.pubid] = user;
				} 
				user.channels[pipe.pubid] = user;
				this.fireEvent('join', [user, pipe]);
			break;
			case 'LEFT':
				pipe = this.pipes[args.pipe.pubid];
				var u = this.pipes[args.user.pubid];
				delete u.channels[pipe.pubid];
				for (var i in u.channels) {
					if (u.channels.hasOwnProperty(i)) delete this.pipes[args.user.pubid];
					break;
				}
				this.fireEvent('left', [u, pipe]);
			break;
			case 'IDENT':
				this.user.pubid = args.pubid;
			break;
			case 'ERR' :
				if (this.transport.id == 0 && cmd == 'ERR' && (args.code > 100 || args.code == "001")) this.send('CHECK');
				else if (cmd == 'ERR' && args.code < 100) clearTimeout(this.poller);
			break;
		}

		if (this.transport.id == 0 && cmd != 'ERR' && this.transport.state == 1) this.send('CHECK');

		this.fireEvent('onmessage', [cmd, args, pipe]);
	}
}

APE.prototype.getPipe = function(user) {
	if (typeof user == 'string') {
		return this.pipes[user];
	} else {
		return this.pipes[user.getPubid()];
	}
}

APE.prototype.send = function(cmd, args, pipe, callback) {
	if (this.state == 1 || cmd == 'CONNECT') {

		var tmp = {
			'cmd': cmd,
			'chl': this.chl,
		};

		if (args) tmp.params = args;
		if (pipe) tmp.params.pipe = typeof pipe == 'string' ? pipe : pipe.pubid; 
		if (this.user.sessid) tmp.sessid = this.user.sessid;

		console.log('=> ', tmp);

		this.transport.send(JSON.stringify([tmp]));
		if (cmd != 'CONNECT') {
			clearTimeout(this.poller);
			this.poll();
		}
		this.chl++;
	} else {
		this.addEvent('onready', this.send.bind(this, cmd, args));
	}
}

APE.prototype.check = function() {
	this.send('CHECK');
}

APE.prototype.connect = function(args) {
	this.send('CONNECT', args);
}

APE.prototype.join = function(channel) {
	this.send('JOIN', {'channels': channel});
}

if (Function.prototype.bind == null) {
	//Bind function by webreflection.blogspot.com - MIT Style License 
    Function.prototype.bind = (function (slice){
		function bind(context) {
			var self = this; 
			if (1 < arguments.length) {
				var $arguments = slice.call(arguments, 1);
				return function () {
					return self.apply(context, arguments.length ? $arguments.concat(slice.call(arguments)) : $arguments);
				};
			}
			return function () {
				return arguments.length ? self.apply(context, arguments) : self.call(context);
				};
		}
		return bind;
	}(Array.prototype.slice));
}
