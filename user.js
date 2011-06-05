var APEUser = function(pipe, ape) {
	this.properties = pipe.properties;
	this.pubid = pipe.pubid;
	this.ape = ape;
	this.channels = {};
}
APEUser.prototype.send = function(cmd, args) {
	this.ape.send(cmd, args, this);
}
