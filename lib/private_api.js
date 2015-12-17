var _ = require('underscore');

module.exports = {
	depk: depk,
	mapd: mapd,
	isSpecialKey: isSpecialKey,
	isQueueKey: isQueueKey,
	isFn: isFn,
	parseVarietyKey: parseVarietyKey,
	buildVarietyKey: buildVarietyKey,
	isOrdinaryKey: isOrdinaryKey,
	isLiteralObject: isLiteralObject,
	queue: queue,
	compile: compile,
	genObjColl: genObjColl,
	callFn: callFn,
	addVariety: addVariety,
	addProperty: addProperty,
	addConstant: addConstant,
	clean: clean,
	postBuild: postBuild,
	build: build,
	stripDep: stripDep,
	stripDepsMap: stripDepsMap
};

/*
 * Get iteratee for sort template props by dependency on each other.
 * 
 * @param depsMap		Dependency map. See mapd function for format details.
 * @return 				Iteratee with depsMap in its closure.
 */
function depk(depsMap){
	/*
	 * @param key	Element of unsorted keys and keys pairs queue. Example: [ 'a', 'b', [ 'c'. 'd' ]]
	 * @return		Dependency depth for sortBy underscore method.
	 */
	return function(key){
		return (function step(_key, k){
			if (k && key == _key) {
				var error = new Error('Cyclic dependency at ');
				error.code = 'cyclic_deps';
				error.key = _key;
				throw error;
			}
			var deps = depsMap[_key];
			if (_.isArray(deps)) {
				return _.max(_.map(deps, function(e){ return step(e, k + 1) }));
			} else if(deps) {
				return k;
			} else {
				var error = new Error('Key is not found: ');
				error.code = 'key_not_found';
				error.key = _key;
				throw error;
			}
		})(_.isArray(key) ? key[0] : key, 0);
	}
}

/*
 * Get dependency map from template.
 * 
 * @param template	Template object.
 * @return			Dependency map. Format:
 * 					{
 * 						<key>: <array of keys the key depends on> OR <truthy value> if the key is a constant OR <falsey value> if the key is nested T instance or simply not present
 * 					}
 */
function mapd(template){
	var obj = { $parent: true, $root: true };
	var pair;
	var q = template['->'];
	
	if (q && _.isArray(q) && q.length > 0) {
		if (q.length > 1) {
			for (var i=q.length-1; i>0; i--) {
				var e0 = q[i];
				var e1 = q[i-1];
				obj[e0] = [ e1 ];
				obj[e1] = true;
			}
		} else {
			obj[q[0]] = true;
		}
	}
	
	_.each(template, function(e, i){
		if (i == '->' || i == '-->') return;
			
		var keys;
		if (isOrdinaryKey(i) || isSpecialKey(i)) {
			keys = [i];
		} else {
			keys = parseVarietyKey(i);
			if (!keys) {
				var error = new Error('Invalid key format: ');
				error.code = 'invalid_key_format';
				error.key = i;
				throw error;
			}
		}

		if (isFn(e) && _.isArray(e) && e.length > 1) {
			var fnDeps = _.initial(e);

			function setDeps(key){
				var preDeps = obj[key];
				if (_.isArray(preDeps)) {
					obj[key] = fnDeps.concat(preDeps);
				} else {
					obj[key] = fnDeps;
				}
				obj[key] = _.uniq(obj[key]);
			}
					
			for (var j=0; j<keys.length; j++) {
				setDeps(stripDep(keys[j]));
			}
		}
		else {
			for (var j=0; j<keys.length; j++) {
				var k = keys[j];
				if (!_.isArray(obj[k])) obj[k] = true;
			}
		}
	});

	return stripDepsMap(obj);
}

/*
 * Check if key is special (not used for template properties mapping)
 * 
 * @param key	key to check.
 * @return		true if key is special or false if not.
 */
function isSpecialKey(key){ return key == '$return' || key == '?' || key == ':'; }

/*
 * Check if key is used to store queue or prequeue
 * 
 * @param key	key to check.
 * @return		true if key is for queue or false if not.
 */
function isQueueKey(key){ return key == '->' || key == '-->'; }

/*
 * Check if value is dependencies packed function.
 * 
 * @param value	Value to check.
 * @return		true if value is dependencies packed function, false if isn't.
 */
function isFn(value){
	if (_.isArray(value)) {
		if (value.length > 1) {
			var fn = _.last(value);
			if (!_.isFunction(fn)) return false
			var deps = _.initial(value);
			for (var i=0; i<deps.length; i++) {
				if (!_.isString(deps[i])) return false;
			}
			return true;
		} else if (value.length == 1) {
			return _.isFunction(value[0]);
		}
		return false;
	}
	
	return _.isFunction(value);
}

/*
 * Get variety key parsed. Examples:
 * '{value}' -> ['value']
 * '{value, key}' -> ['value', 'key']
 * '{value, key, index}' -> ['value', 'key', 'index']
 * 
 * @param key	Template key in variety notation: '{<value>, <key>, <index>}'. <key> and <index> are optional.
 * 				It's used later as:
 * 				<value> - value of maped collection (variety) element,
 * 				<key> - key of maped collection (variety) element,
 * 				<index> - final index of destination collection.
 * @return		Array: ['<value>', '<key>'] OR ['<value'] OR null on syntax error.
 */
function parseVarietyKey(key){
	var arr = key.replace(/\s/g, '').match(/^\s*{([\w\s,\.\x24]+)}\s*$/);
	
	if (arr && (keys = arr[1].split(',')) &&
		keys.length > 0 &&
		keys.length < 4) {
		
		if (_.contains(keys, '')) {
			return null;
		}
		return keys;
	}
	
	return null;
}

/*
 * Get string representation of variety key.
 * 
 * @param arr	Array representation of variety key.
 * @return		String representation of variety key.
 */
function buildVarietyKey(arr){
	var str = '{' + arr[0];
	if (arr.length > 1) {
		for (var i=1; i<arr.length; i++) {
			str += ',' + arr[i];
		}
	}
	str += '}';
	
	return str;
}


/*
 * Check if key contains only word symbols, `.` and `-`
 * 
 * @param key	key to check.
 * @return		true if key is ordinary (not variety key) or false if not.
 */
function isOrdinaryKey(key){ return !!key.match(/^[\w\.\x24]+$/) }

/*
 * Get template keys queue sorted by dependency on each other. 
 * Variety keys will be parsed and present in sub array. Example '{a, b}' => [ 'a', 'b' ], '{a}' => [ a ].
 * 
 * @param template	Template.
 * @return			Sorted array of template keys.
 */
function queue(template){
	
	var depsMap = mapd(template);
	
	return 	_.sortBy(
			_.map(
			_.sortBy(
			_.filter(
			_.keys(template), function(e){
				return !isQueueKey(e);
			}), function(e) {
				return e;
			}), function(i){
				if (isOrdinaryKey(i) || isSpecialKey(i)) {
					return i;
				} else {
					var value = template[i];
					if (_.isObject(value) || value == ':external') {
						return parseVarietyKey(i);
					} else {
						var error = new Error('Misplaced variety key: ');
						error.code = 'misplaced_variety_key';
						error.key = i;
						throw error;
					}
				}
			}),
			depk(depsMap));
}

/*
 * Check if object defined like this:
 * {
 * 		prop1: 'val1',
 * 		prop2: 'val2',
 * 		...
 * 		propN: 'valN'
 * }
 * 
 * @param value	Object.
 * @return		true if on object is literal object or false.
 */
function isLiteralObject(value){
	if (!Object.getPrototypeOf(Object.getPrototypeOf(value))) return true;
	return false;
}

/*
 * Set props queue for all nested templates.
 * All props of compiled template object are links to corresponding source template propreties.
 * Template flag (or prequeue in some cases) '->' is replaced with final queue '-->'.
 * 
 * @param template	Source template.
 * @param tpath		Path to this subtemplate
 * @return			Prepared for build template object.
 */
function compile(template, tpath){
	var obj = {};

	if (_.isUndefined(tpath)) tpath = '';
	
	try {
		if (template['->']) obj['-->'] = queue(template);
	} catch (err) {
		if (!err.key) throw err;
		var path = tpath + err.key;
		error = new Error(err.message + '"' + path + '"');
		error.code = 'compile_error';
		error.path = path;
		throw error;
	}
	
	for (var i in template) {
		var e = template[i];
		if (_.isObject(e) && isLiteralObject(e)) {
			var o = compile(e, tpath + i + '.');
			var subQ = o['-->'];
			if (subQ) {
				// nested template forwarding
				var q = obj['-->'];
				if (!q) {
					obj['-->'] = [ i ];
				} else if (q && !_.contains(q, i)) {
					q.push(i);
				}
			}
			obj[i] = o;
		} else if (i != '->'){
			if (i.search('{') >= 0) {
				obj[i.replace(/\s/g, '')] = e;
			} else {
				obj[i] = e;
			}
		}
	}
	return obj;
}

/*
 * Generate objects collection.
 * 
 * @param obj		Initial object.
 * @param keyval	2 or 1 elements array of names for key and value or only for key. Example: [ 'val', 'key' ] or [ 'val' ]
 * @param coll		Input collection (array or object).
 * @return			Array of objects extended with `obj` and  value and/or key mapped by names in keyval array.
 */
function genObjColl(obj, keyval, coll){
	return _.map(coll, function(e, i){
		var o = _.extend({}, obj);
		var val = keyval[0];
		var key = keyval[1];
		o[val] = e;
		if (key) o[key] = i;
		return o;
	});
} 

/*
 * Call function with dependencies in specified context.
 * 
 * @param context	Object with all function dependencies.
 * @param depsfn	Function definition in form [ 'dep1', 'dep2', ... 'depN', function(dep1, dep2, ... depN){ ... }].
 * @return			Called function return value.
 */
function callFn(context, depsfn){
	
	if (_.isFunction(depsfn)) {
		// case 1
		return depsfn.call(context);
	} else if (depsfn.length == 1) {
		// case 2
		return depsfn[0].call(context);
	} else {
		// case 3
		var fn = _.last(depsfn);
		var deps = _.initial(depsfn);

		var margs = [], cargs = [], args = [];
		 _.each(deps, function(e){
			var arg = stripDep(e);
			args.push(arg);
			if (isMandatory(e)) {
				margs.push(arg);
			} else if (isCritical(e)) {
				cargs.push(arg);
			}
		});
		
		if (_.some(margs, function(e){ return _.isUndefined(context[e]) })) return undefined;
		
		var undefDep = _.find(cargs, function(e){ return _.isUndefined(context[e]) });
		if (undefDep) {
			var error = new Error('Undefined critical dependency "' + undefDep + '" for key: ');
			error.code = 'callfn_cdepundef';
			error.dep = undefDep;
			throw error;
		}

		return fn.apply(context, _.map(args, function(e){ return context[e] }));
	}
	
	function isMandatory(dep){
		return !!dep.match(/^[^\*]+\*$/);
	}
	
	function isCritical(dep){
		return !!dep.match(/^[^\*]+\*\*$/);
	}
}

/*
 * Strip tokens from dependency name.
 * 
 * @param dep	Dependency name.
 * @return		Stripped dependency name.
 */	
function stripDep(dep){
	return dep.match(/^[^\*]+/)[0];
}

/*
 * Strip tokens from dependencies map .
 * 
 * @param depsMap	Dependencies map.
 * @return			Stripped depsMap object.
 */	
function stripDepsMap(depsMap){
	var _depsMap = {};
	_.each(depsMap, function(e, i){
		var deps;
		if (_.isArray(e)) {
			deps = _.map(e, function(_e){ return stripDep(_e) });
		} else {
			deps = e;
		}
		_depsMap[i] = deps;
	});
	
	return _depsMap;
}

/*
 * Expand collection or single object with variety key.
 * 
 * @param obj			Instanciated template (object) or collection of instanciated templates (array).
 * @param keyval		Array: [ <val>, <key>, <inx> ]  or [ <val>, <key> ] or [ <val> ]. See also `genObjColl`.
 * @param constructor	Values collection constructor or a constant array or object
 * @return				New collection. Size of new collection is `n*m`.
 * 						Where `n` is `coll` size and 'm' is size of collection returned by `constructor`.
 */
function addVariety(obj, keyval, constructor){

	function _expand(e){
		var arr;
		if (isFn(constructor)) {
			arr = callFn(e, constructor);
		} else {
			arr = constructor;
		}
		if (_.isUndefined(arr) || (_.isObject(arr) && _.size(arr) == 0)) return e;
		if (!_.isObject(arr) ||
			(!_.isArray(arr) && !isLiteralObject(arr))) {
			var error = new Error('Incorrect value for variety key: ');
			error.code = 'incorrect_value_for_variety_key';
			error.key = buildVarietyKey(keyval);
			throw error;
		}
		return genObjColl(e, keyval, arr);
	}
	
	function _addKeys(arr){
		if (keyval.length == 3) {
			_.each(arr, function(e, i){ e[keyval[2]] = i });
		}
		return arr;
	}
	
	try {
		if (isLiteralObject(obj)) {
			if (_.isUndefined(constructor) || (isFn(constructor) &&_.isUndefined(callFn(obj, constructor)))) {
				return obj;
			} else {
				return _addKeys(_expand(obj));
			}
		} else {
			return _addKeys(_.flatten(_.map(obj, _expand)));
		}
	} catch (err) {
		if (err.code != 'callfn_cdepundef') throw err;
		
		var error = new Error(err.message);
		error.code = 'adding_cdepundef';
		error.dep = err.dep;
		error.key = buildVarietyKey(keyval);
		throw error;
	}
}

/*
 * Add ordinary key in object or collection of objects.
 * 
 * @param obj			Instanciated template (object) or collection of instanciated templates (array).
 * @param key			Key.
 * @param constructor	Value constructor.
 * @return				`obj` with added property.
 */
function addProperty(obj, key, constructor){
	try {
		if (isLiteralObject(obj)) {
			var value = callFn(obj, constructor);
			if (!_.isUndefined(value)) obj[key] = value;
		} else {
			_.each(obj, function(e){
				var value = callFn(e, constructor);
				if (!_.isUndefined(value)) e[key] = value;
			});
		}
	} catch (err) {
		if (err.code != 'callfn_cdepundef') throw err;

		var error = new Error(err.message);
		error.code = 'adding_cdepundef';
		error.dep = err.dep;
		error.key = key;
		throw error;
	}
	
	return obj;
}

/*
 * Add constant key in object or collection of objects.
 * 
 * @param obj			Instanciated template (object) or collection of instanciated templates (array).
 * @param key			Key.
 * @param value			Constant value.
 * @return				`obj` with added property.
 */
function addConstant(obj, key, value){
	if (isLiteralObject(obj)) {
		if (!_.isUndefined(value)) obj[key] = value;
	} else {
		_.each(obj, function(e){
			if (!_.isUndefined(value)) e[key] = value;
		});
	}
	
	return obj;
}

/*
 * Build object against compiled template and (optionaly) some data.
 * 
 * @param tobj		Compiled template.
 * @param data		Data to refer with `:external` keyword (optional).
 * @param parent	Parent object.
 * @param root		Root object.
 * @param curKey	Key of building object in parent object (for errors processing)
 * @return			Built object.
 */
function build(tobj, data, parent, root, curKey){
	
	function qq(o){
		var _q = o['?'];
		return _.isUndefined(_q) || _q;
	}

	try {
		var obj = { '->': true }
		var q = tobj['-->'];
		if (!root) root = obj;
		obj.$root = root;
		if (parent) obj.$parent = parent;
	
		for (var i=0; i<q.length; i++) {
			var e = q[i];
			
			if (_.isArray(e)) {
				// Variety 
				var key = buildVarietyKey(e);
				var value = tobj[key];
				
				if (isFn(value)) {
					// constructor
					// case 1
					obj = addVariety(obj, e, value);
				} else if (value == ':external') {
					// external constant
					// case 1_1
					obj = addVariety(obj, e, data[key]);
				} else {
					// constant
					// case 1_2
					obj = addVariety(obj, e, value);
				}
			} else {
				// Not variety
				var key = e;
				var value = tobj[key];

				if (isFn(value)) {
					// constructor
					// case 2
					addProperty(obj, key, value);
				} else if (_.isObject(value)) {
					if (isLiteralObject(value) && value['-->']) {
						// Subtemplate property
						// case 3
						if (_.isArray(obj)) {
							// Already expanded by some variety keys
							// case 3_1
							for (var j=0; j<obj.length; j++) {
								var _e = obj[j];
								_e[key] = build(value, data, _e, root, key);
							}
						} else {
							// A single object
							// case 3_2
							obj[key] = build(value, data, obj, root, key);
						}
					} else {
						// constant
						// case 4
						addConstant(obj, key, value);
					}
				} else if (value == ':external') {
					// external constant
					// case 5
					obj = addConstant(obj, key, data[key]);
				} else {
					// constant
					// case 6
					addConstant(obj, key, value);
				}
			}
			if (e == '?') {
				// break queue processing if `?` condition is falsy
				if (_.isArray(obj)) {
					obj = _.filter(obj, function(_e){ return qq(_e) });
				} else {
					if (!qq(obj)) return undefined;
				}
			}
		}
		
		if (!curKey) return clean(postBuild(obj, tobj));
		else return postBuild(obj, tobj);
		
	} catch (err) {
		
		if (!err.key) throw err;
		
		var error = new Error();
		
		if (err.messageBase) error.messageBase = err.messageBase;
		else error.messageBase = err.message;
		
		var key;
		if (curKey) {
			key = curKey + '.' + err.key;
		} else {
			key = err.key;
		}
		
		error.code = 'build_error';
		error.key = key;
		error.message = error.messageBase + '"' + error.key + '"';
		if (err.dep) error.dep = err.dep
				
		throw error;
	}
}

/*
 * Processing of `:` and `$return` keys.
 * 
 * @param obj	Built object.
 * @param tobj	Template object.
 * @return		Fully built object.
 */
function postBuild(obj, tobj){
	if (isEmptyColl(obj)) {
		if (tobj[':']) return {};
		else return [];
	}
	
	if (tobj['$return']) {
		if (tobj[':']) {
			if (_.isArray(obj)) {
				// case 3
				// multiinstance object
				var _obj = {};
				_.each(obj, function(e){
					if (!_.isUndefined(e[':'])) { 
						_obj[e[':']] = e['$return'];
					}
				});
				return _obj;
			} else {
				// case 3_1
				// object
				var _obj = {};
				if (!_.isUndefined(obj[':'])) { 
					_obj[obj[':']] = obj['$return'];
				}
				return _obj;
			}
		} else {
			// array or object
			if (_.isArray(obj)) {
				// case 4
				return _.map(obj, function(e){ return e['$return'] });
			} else {
				// case 5
				return obj['$return'];
			}
		}
	} else {
		if (tobj[':']) {
			if (_.isArray(obj)) {
				// case 1
				// multiinstance object
				var _obj = {};
				_.each(obj, function(e){
					if (!_.isUndefined(e[':'])) { 
						_obj[e[':']] = e;
					}
				});
				return _obj;
			} else {
				// case 1_1
				// object
				var _obj = {};
				if (!_.isUndefined(obj[':'])) { 
					_obj[obj[':']] = obj;
				}
				return _obj;
			}
		} else {
			// case 2
			// array or object
			return obj;
		}
	}
	
	function isEmptyColl(obj){
		if (_.find(tobj['-->'], function(e){ return _.isArray(e) }) && !_.isArray(obj)) return true;
		else return false;
	}
}

/*
 * Clean service keys.
 * 
 * @param obj	Built object.
 * @return		Cleaned object.
 */
function clean(obj){

	function cln(obj, inx){
		var o = clean(obj[inx]);
		if (_.isNull(o) || _.isUndefined(o)) delete obj[inx];
		else obj[inx] = o;
	}
	
	if (_.isObject(obj) && isLiteralObject(obj)) {
		if (obj['->']) {
			if (!_.isUndefined(obj['?']) && !obj['?']) return undefined;
			delete obj['->'];
			delete obj['-->'];
			delete obj[':'];
			delete obj['?'];
			for (var i in obj) {
				if (i[0] == '$') {
					delete obj[i];
				} else {
					cln(obj, i);
				}
			}
		} else {
			for (var i in obj) {
				cln(obj, i);
			}
		}				
	} else if (_.isArray(obj)) {
		for (var i=0; i<obj.length; i++) {
			obj[i] = clean(obj[i]);
		}
		
		return _.filter(obj, function(e){ return !_.isNull(e) && !_.isUndefined(e) });
	}

	return obj;
}
