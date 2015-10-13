var private = require('./private_api');

module.exports = { T: T };

function T(template){
	if (!(this instanceof T)) return new T(template);
	
	var tobj = private.compile(template);
	
	this.build = function(data){
		return private.build(tobj, data);
	}
}
