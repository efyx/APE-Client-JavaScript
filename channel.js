var APEChannel = function(pipe, ape) {
	this.properties = pipe.properties;
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.users = {};
}
APEChannel.prototype.addUser = function(u) {
	this.users[u.properties.pubid] = u;
}

APEChannel.prototype.send = function(cmd, args) {
	this.ape.send(cmd, args, this);
}
