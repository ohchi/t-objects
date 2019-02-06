var api = require('./private_api');

module.exports = { T: T };

function T(template){
	if (!(this instanceof T)) return new T(template);
	
	var tobj = api.compile(template);
	
	this.build = function(data){
		return api.build(tobj, data);
	}
}
