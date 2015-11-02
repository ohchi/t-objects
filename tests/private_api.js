var private = require('../lib/private_api.js')
  ,	expect = require('chai').expect
  ,	assert = require('chai').assert;
  
describe('private API:', function(){

	
	describe('stripDep:', function(){
		
		var stripDep = private.stripDep;
		
		it('a single test', function(done){
			expect(stripDep('dep**')).to.equal('dep');
			
			done();
		});
	});

	describe('stripDepsMap', function(){

		var stripDepsMap = private.stripDepsMap;
		
		it('a single test', function(done){
			expect(stripDepsMap({
				a: true,
				b: [ 'a*' ],
				c: [ 'b**' ]
			})).to.deep.equal({
				a: true,
				b: [ 'a' ],
				c: [ 'b' ]
			});
			
			done();
		});
	});
	
	describe('depk:', function(){
		
		it('correct deps map:', function(done){
		
			var depk = private.depk({
			    d: [ '?', ':', 'c' ],
			    '?': [ 'e', 'f' ],
			    g: [ 'e', 'f' ],
			    f: [ ':' ],
			    e: true,
			    ':': [ 'e' ],
			    c: true
			});
			
			expect(depk('d')).to.equal(4);
			expect(depk([ '?', 'g' ])).to.equal(3);
			expect(depk('f')).to.equal(2);
			expect(depk(':')).to.equal(1);
			expect(depk('e')).to.equal(0);
			expect(depk('c')).to.equal(0);
			
			done();
		});
/*		
		it('deps map with mandatory and critical keys:', function(done){
		
			var depk = private.depk({
			    d: [ '?', ':', 'c' ],
			    '?': [ 'e', 'f' ],
			    g: [ 'e', 'f' ],
			    f: [ ':' ],
			    e: true,
			    ':': [ 'e' ],
			    c: true
			});
			
			expect(depk('d**')).to.equal(4);
			expect(depk([ '?', 'g*' ])).to.equal(3);
			expect(depk('f')).to.equal(2);
			expect(depk(':')).to.equal(1);
			expect(depk('e')).to.equal(0);
			expect(depk('c')).to.equal(0);
			
			done();
		});
*/		
		it('cyclic deps map', function(done){
		
			var depk = private.depk({
			    d: [ 'a', 'b', 'c' ],
			    a: [ 'e', 'f' ],
			    g: [ 'e', 'f' ],
			    f: [ 'b' ],
			    e: true,
			    b: [ 'e', 'd' ],
			    c: true
			});
			
			try {
				depk('d');
				assert.ok(false);
			} catch (e) {
				expect(e.code).to.equal('cyclic_deps');
				expect(e.key).to.equal('d');
			}
			
			done();
		});
		
		it('unexisting key', function(done){
		
			var depk = private.depk({
			    d: [ 'a', 'b', 'c' ],
			    a: [ 'e', 'f' ],
			    g: [ 'e', 'f' ],
			    f: [ 'b' ],
			    b: [ 'e', 'd' ],
			    c: true
			});
			
			try {
				depk('d');
				assert.ok(false);
			} catch (e) {
				expect(e.code).to.equal('key_not_found');
				expect(e.key).to.equal('e');
			}
			
			done();
		});
	});
	
	describe('isSpecialKey:', function(){
		
		var isSpecialKey = private.isSpecialKey;

		it('all tests in one', function(done){
			expect(isSpecialKey('?')).to.be.true;
			expect(isSpecialKey(':')).to.be.true;
			expect(isSpecialKey('$return')).to.be.true;
			expect(isSpecialKey('->')).to.be.false;
			expect(isSpecialKey('-->')).to.be.false;
			expect(isSpecialKey('->:?')).to.be.false;
			expect(isSpecialKey('{->:?}')).to.be.false;
			expect(isSpecialKey('a')).to.be.false;
			expect(isSpecialKey('a*')).to.be.false;
			done();
		});
	});
	
	describe('isQueueKey:', function(){
		
		var isQueueKey = private.isQueueKey;

		it('all tests in one', function(done){
			expect(isQueueKey('?')).to.be.false;
			expect(isQueueKey(':')).to.be.false;
			expect(isQueueKey('$return')).to.be.false;
			expect(isQueueKey('->')).to.be.true;
			expect(isQueueKey('-->')).to.be.true;
			expect(isQueueKey('->:?')).to.be.false;
			expect(isQueueKey('{->:?}')).to.be.false;
			expect(isQueueKey('a')).to.be.false;
			expect(isQueueKey('a*')).to.be.false;
			done();
		});
	});
		
	describe('isFn:', function(){
		
		var isFn = private.isFn;
		
		it('correct arg', function(done){
			expect(isFn(['a', 'b', 'c', function(a, b, c){}])).to.be.true;
			expect(isFn([function(){}])).to.be.true;
			expect(isFn(function(){})).to.be.true;
			done();
		});
		
		it('just array', function(done){
			expect(isFn(['a', 'b', 'c'])).to.be.false;
			expect(isFn(['a'])).to.be.false;
			expect(isFn([])).to.be.false;
			done();
		});
		
		it('not strings as dependencies', function(done){
			expect(isFn(['a', 'b', 1, function(a, b, c){}])).to.be.false;
			expect(isFn(['a', 'b', function(a, b, c){}, 'c'])).to.be.false;
			expect(isFn(['a', 'b', function(a, b, c){}, function(){}])).to.be.false;
			done();
		});
		
		it('last element is not function', function(done){
			expect(isFn(['a', 'b', 'c', {}])).to.be.false;
			expect(isFn(['a', 'b', 'c'])).to.be.false;
			done();
		});
		
		it('other wrong args', function(done){
			expect(isFn('a')).to.be.false;
			expect(isFn()).to.be.false;
			expect(isFn({})).to.be.false;
			expect(isFn(true)).to.be.false;
			expect(isFn(false)).to.be.false;
			done();
		});
	});
	
	describe('parseVarietyKey:', function(){
		
		var parseVarietyKey = private.parseVarietyKey;
		
		it('correct args', function(done){
			expect(parseVarietyKey('{$a,b}')).to.deep.equal([ '$a', 'b' ]);
			expect(parseVarietyKey('{a.s,b,c}')).to.deep.equal([ 'a.s', 'b', 'c' ]);
			expect(parseVarietyKey(' { a , b } ')).to.deep.equal([ 'a', 'b' ]);
			expect(parseVarietyKey(' 	 { 	 a 	 ,	 b	 }	 ')).to.deep.equal([ 'a', 'b' ]);
			expect(parseVarietyKey('{a}')).to.deep.equal(['a']);
			expect(parseVarietyKey(' { a } ' )).to.deep.equal(['a']);
			expect(parseVarietyKey('	 {	 	a	 	}	 	' )).to.deep.equal(['a']);
			done();
		});

		it('incorrect args', function(done){
			expect(parseVarietyKey('{a,b,c,d}')).to.be.null;
			expect(parseVarietyKey(' { a , b, } ')).to.be.null;
			expect(parseVarietyKey(' 	  	 a 	 ,	 b	 }	 ')).to.be.null;
			expect(parseVarietyKey('{a]}')).to.be.null;
			expect(parseVarietyKey(' { "a" } ' )).to.be.null;
			expect(parseVarietyKey('{a*}')).to.be.null;
			done();
		});
	});
	
	describe('buildVarietyKey:', function(){
		
		var buildVarietyKey = private.buildVarietyKey;
		
		it('all tests in one', function(done){
			expect(buildVarietyKey([ 'a', 'b', 'c' ])).to.deep.equal('{a,b,c}');
			expect(buildVarietyKey([ 'a', 'b' ])).to.deep.equal('{a,b}');
			expect(buildVarietyKey([ 'a' ])).to.deep.equal('{a}');
			
			done();
		});
	});
	
	describe('mapd:', function(){
		
		var mapd = private.mapd;
		
		var template = {
			'->': [ 'c', 'h', 'l', 'g' ], // predefined deps should affect result
			'-->': 'A!!!!!!!',	// should ignore this 
			':': [ '$a', function(){} ], 
			'?': true, // should be rejected
		    d: [ 'a', 'b.', 'c', function(){} ],
		    '{$a, g, m}': [ 'e', 'f', function(){} ], // predefined deps should affect 'a' and 'g' independently 
		    '{f}': [ 'b', function(){} ],
		    e: [ 1, 2, 3 ],
		    'b.': [ 'e', function(){} ],
		    '{c, x, z}': function(){},
		    h: {},
		    l: [ 'h', 'd', function(){} ] // resulting deps should deduplicated
		};
	
		it('test on correct template', function(done){
			expect(mapd(template)).to.deep.equal({
				$parent: true,	// should be added implicitly
				$root: true,	// should be added implicitly
				':': [ '$a' ],
				'?': true,
				d: [ 'a', 'b.', 'c' ],
				$a: [ 'e', 'f' ],
				g: [ 'e', 'f', 'l' ],
				m: [ 'e', 'f' ],
				f: [ 'b' ],
				e: true,
				'b.': [ 'e' ],
				c: true,
				x: true,
				z: true,
				h: [ 'c' ],
				l: [ 'h', 'd' ]
			});
			done();
		});

		it('should through `invalid_key_format` exception on invalid key', function(done){
			try {
				expect(mapd({
					',d': [ 'a', 'b', 'c', function(){} ]
				})).to.deep.equal({
					',d': [ 'a', 'b', 'c' ]
				});
				assert.ok(false);
			} catch (e) {
				expect(e.code).to.equal('invalid_key_format');
				expect(e.key).to.equal(',d');
			}
			done();
		});
	});

	describe('isOrdinaryKey:', function(){
		
		var isOrdinaryKey = private.isOrdinaryKey;
		
		it('all tests in one', function(done){
			expect(isOrdinaryKey('a.$')).to.be.true;
			expect(isOrdinaryKey('{a.$}')).to.be.false;
			expect(isOrdinaryKey('[a.$]')).to.be.false;
			expect(isOrdinaryKey('(a.$)')).to.be.false;
			expect(isOrdinaryKey('-a.$')).to.be.false;
			expect(isOrdinaryKey('"a.$-"')).to.be.false;
			expect(isOrdinaryKey('{a.$-,b.$-}')).to.be.false;
			done();
		});
	});

	describe('queue:', function(){
		
		var queue = private.queue;
		
		it('correct template without ->', function(done){
			var template = {
			    ':': [ 'a', 'b', 'c', function(){} ],
			    g: [ 'e', 'f', function(){} ],
			    a: [ 'e', 'f', function(){} ],
			    f: [ 'b', function(){} ],
			    e: [ 1, 2, 3 ],
			    b: [ 'e', function(){} ],
			    c: 'C',
			    t: {}
			};
			expect(queue(template)).to.deep.equal([ 'c', 'e', 't', 'b', 'f', 'a', 'g', ':' ]);

			done();
		});
		
		it('correct template with ->', function(done){
			var template = {
				'->': [ 't', 'c', 'e' ],
			    d: [ 'a', 'b', 'c', function(){} ],
			    g: [ 'e', 'f', function(){} ],
			    a: [ 'e', 'f', function(){} ],
			    f: [ 'b', function(){} ],
			    e: [ 1, 2, 3 ],
			    b: [ 'e', function(){} ],
			    c: 'C',
			    t: {}
			};

			expect(queue(template)).to.deep.equal([ 't', 'c', 'e', 'b', 'f', 'a', 'g', 'd' ]);

			done();
		});

		it('correct template with variety keys', function(done){
			var template = {
			    d: [ 'a', 'b', 'c', function(){} ],
			    '{a, h}': [ 'e', 'f', function(){} ],
			    g: [ 'e', 'f', function(){} ],
			    f: [ 'b', function(){} ],
			    e: [ 1, 2, 3 ],
			    '{b}': [ 'e', function(){} ],
			    c: 'C',
			    t: {}
			};

			expect(queue(template)).to.deep.equal([ 'c', 'e', 't', ['b'], 'f', 'g', ['a', 'h'], 'd' ]);

			done();
		});
		
		it('misplaced variety key error', function(done){
			try {
				queue({ '{a}': 'A' })
				assert.ok(false);
			} catch (e) {
				assert.ok(e.code == 'misplaced_variety_key' && e.key == '{a}');
			}
			done();
		});

	});

	describe('typeOfObject', function(){
		
		var typeOfObject = private.typeOfObject;
		
		it('should return "String" for String object', function(done){
			
			expect(typeOfObject(new String('my string'))).to.equal('String');
			done();
		});
		
		it('should return "Number" for Number object', function(done){
			
			expect(typeOfObject(new Number(1))).to.equal('Number');
			done();
		});
		
		it('should return "RegExp" for RegExp object', function(done){
			
			expect(typeOfObject(new RegExp(/.*/))).to.equal('RegExp');
			done();
		});
		
		it('should return "Date" for Date object', function(done){
			
			expect(typeOfObject(new Date())).to.equal('Date');
			done();
		});
		
		it('should return "Function" for Function object', function(done){
			
			expect(typeOfObject(function(){})).to.equal('Function');
			done();
		});
		
		it('should return "Boolean" for Boolean object', function(done){
			
			expect(typeOfObject(new Boolean(true))).to.equal('Boolean');
			done();
		});
		
		it('should return "MyClass" for MyClass object', function(done){
			
			function MyClass(){};
			
			expect(typeOfObject(new MyClass())).to.equal('MyClass');
			done();
		});
		
		it('should return "Object" for singleton object', function(done){
			
			expect(typeOfObject({})).to.equal('Object');
			done();
		});
	});

	describe('compile:', function(){
		
		var compile = private.compile;

		function dummy(){}

		it('all tests in one', function(done){
			expect(compile({
				'->': [ 'c', 'd' ],
				a: [ 'b', dummy ],
				'{ b, f }': [ 'c', dummy ],
				c: {
					'->': true,
					a: [ 'b', dummy ],
					b: 'B'
				},
				d: {
					a: 'A',
					b: 'B',
					c: {
						'->': true,
						a: [ 'b', dummy ],
						b: new RegExp(/.*/)
					}
				}
			})).to.deep.equal({
				'-->': [ 'c', 'd', [ 'b', 'f' ], 'a' ],
				a: [ 'b', dummy ],
				'{b,f}': [ 'c', dummy ],
				c: {
					'-->': [ 'b', 'a' ],
					a: [ 'b', dummy ],
					b: 'B'
				},
				d: {
					'-->': [ 'c' ],
					a: 'A',
					b: 'B',
					c: {
						'-->': [ 'b', 'a' ],
						a: [ 'b', dummy ],
						b: new RegExp(/.*/)
					}
				}
			});

			done();
		});

		it('subqueue forwarding', function(done){
			expect(compile({
				L2: {
					L3: {
						'->': true,
						a: 'A',
						b: [ 'a', dummy],
						L4: {
							L5: {
								L6: {
									'->': true,
									a: 'A',
									b: [ 'a', dummy]
								}
							},
							LL5: {
								LL6: {
									'->': true,
									a: 'A',
									b: [ 'a', dummy]
								}
							}
						}
					},
					LL3: {
						LL4: {
							a: 'A'
						}
					}
				}
			})).to.deep.equal({
				'-->': [ 'L2' ],
				L2: {
					'-->': [ 'L3' ],
					L3: {
						'-->': [ 'L4', 'a', 'b' ],
						a: 'A',
						b: [ 'a', dummy],
						L4: {
							'-->': [ 'L5', 'LL5' ],
							L5: {
								'-->': [ 'L6' ],
								L6: {
									'-->': [ 'a', 'b' ],
									a: 'A',
									b: [ 'a', dummy]
								}
							},
							LL5: {
								'-->': [ 'LL6' ],
								LL6: {
									'-->': [ 'a', 'b' ],
									a: 'A',
									b: [ 'a', dummy]
								}
							}
						}
					},
					LL3: {
						LL4: {
							a: 'A'
						}
					}
				}
			});

			done();
		});
		
		describe('error processing', function(){
			it('cyclic_deps', function(done){
				var dummy = function(){};
	
				try {
					compile({
						'->': true,
						a: [ 'c', dummy ],
						b: [ 'a', dummy ],
						c: [ 'b', dummy ]
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Cyclic dependency at "a"');
				}
	
				try {
					compile({
						'->': true,
						L2: {
							L3: {
								L4: {
									'->': true,
									aa: [ 'cc', dummy ],
									bb: [ 'aa', dummy ],
									cc: [ 'bb', dummy ]
								}
							}
						}
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Cyclic dependency at "L2.L3.L4.aa"');
				}
		
				done();
			});

			it('key_not_found', function(done){
				var dummy = function(){};
	
				try {
					compile({
						'->': true,
						a: [ 'c', dummy ]
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Key is not found: "c"');
				}
	
				try {
					compile({
						'->': true,
						L2: {
							L3: {
								L4: {
									'->': true,
									aa: [ 'cc', dummy ]
								}
							}
						}
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Key is not found: "L2.L3.L4.cc"');
				}
		
				done();
			});

			it('invalid_key_format', function(done){
				var dummy = function(){};
	
				try {
					compile({
						'->': true,
						'a,': true
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Invalid key format: "a,"');
				}
	
				try {
					compile({
						'->': true,
						L2: {
							L3: {
								L4: {
									'->': true,
									'aa,': true
								}
							}
						}
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Invalid key format: "L2.L3.L4.aa,"');
				}
		
				done();
			});

			it('misplaced_variety_key', function(done){
				var dummy = function(){};
	
				try {
					compile({
						'->': true,
						'{a}': true
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Misplaced variety key: "{a}"');
				}
	
				try {
					compile({
						'->': true,
						L2: {
							L3: {
								L4: {
									'->': true,
									'{aa}': true
								}
							}
						}
					});
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('compile_error');
					expect(e.message).to.equal('Misplaced variety key: "L2.L3.L4.{aa}"');
				}
		
				done();
			});
		});
	});

	describe('genObjColl:', function(){
		
		var genObjColl = private.genObjColl;

		it('generate collection from object', function(done){
			
			expect(genObjColl({
				a: 'A',
				f: {
					a: 'A',
					b: 'B',
					c: 'C'
				}
			}, [ 'val', 'key' ], {
				key0: 'val0',
				key1: 'val1',
				key2: 'val2'
			})).to.deep.equal([
				{
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val0',
					key: 'key0'
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val1',
					key: 'key1'
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val2',
					key: 'key2'
				}
			]);
			
			done();
		});

		it('generate collection from array', function(done){
			
			expect(genObjColl({
				a: 'A',
				f: {
					a: 'A',
					b: 'B',
					c: 'C'
				}
			}, [ 'val', 'inx' ], [ 'val0', 'val1', 'val2' ])).to.deep.equal([
				{
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val0',
					inx: 0
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val1',
					inx: 1
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val2',
					inx: 2
				}
			]);
			
			done();
		});

		it('generate collection from array without index mapping', function(done){
			
			expect(genObjColl({
				a: 'A',
				f: {
					a: 'A',
					b: 'B',
					c: 'C'
				}
			}, [ 'val' ], [ 'val0', 'val1', 'val2' ])).to.deep.equal([
				{
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val0'
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val1'
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val2'
				}
			]);
			
			done();
		});

		it('generate collection from object without key mapping', function(done){
			
			expect(genObjColl({
				a: 'A',
				f: {
					a: 'A',
					b: 'B',
					c: 'C'
				}
			}, [ 'val' ], {
				key0: 'val0',
				key1: 'val1',
				key2: 'val2'
			})).to.deep.equal([
				{
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val0'
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val1'
				}, {
					a: 'A',
					f: {
						a: 'A',
						b: 'B',
						c: 'C'
					},
					val: 'val2'
				}
			]);
			
			done();
		});
	});

	describe('callFn:', function(){
		
		var callFn = private.callFn;

		it('case 1', function(done){
			expect(callFn({
				a: 1,
				b: 2,
				c: 3,
				d: 4
			}, function(){
				return this.a + this.b + this.c + this.d;
			})).to.equal(10);
			
			done();
		});
		
		it('case 2', function(done){
			expect(callFn({
				a: 1,
				b: 2,
				c: 3,
				d: 4
			},[ function(){
				return this.a + this.b + this.c + this.d;
			}])).to.equal(10);
			
			done();
		});
		
		it('case 3', function(done){
			expect(callFn({
				a: 1,
				b: 2,
				c: 3,
				d: 4
			},[ 'a', 'b', 'c', function(a, b, c){
				return a + b + c + this.d;
			}])).to.equal(10);
			
			done();
		});
		
		it('should properly strip asterisks from dependencies', function(done){
			expect(callFn({
				a: 'A',
				b: 'B',
				c: 'C'
			},[ 'a*', 'b**', 'c*', function(a, b, c){
				return a + b + c;
			}])).to.equal('ABC');
			
			done();
		});
		
		it('should call callback on undefined optional dependency', function(done){
			expect(callFn({
				a: 'A',
				c: 'C'
			},[ 'a', 'b', 'c', function(a, b, c){
				return a + b + c;
			}])).to.equal('AundefinedC');
			
			done();
		});
		
		it('should return undefined on undefined mandatory dependency', function(done){
			expect(callFn({
				a: 'A',
				c: 'C'
			},[ 'a', 'b*', 'c', function(a, b, c){
				return a + b + c;
			}])).to.be.undefined;
			
			done();
		});
		
		it('should through exception on undefined critical dependency', function(done){
			try {
				callFn({
					a: 'A',
					c: 'C'
				},[ 'a', 'b**', 'c', function(a, b, c){
					return a + b + c;
				}]);
				assert.ok(false);
			} catch (e) {
				expect(e.code).to.equal('callfn_cdepundef');
				expect(e.dep).to.equal('b');
				expect(e.message).to.equal('Undefined critical dependency "b" for key: ');
			}
			
			done();
		});
	});
	
	describe('addVariety:', function(){
		
		var addVariety = private.addVariety;

		describe('collection of objects', function(){
			
			it('should be expanded by array of elements (key `c`)', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c' ], [ 'a', 'b', function(a, b){
					return [ a + b, a - b, a*b ];
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3 },
					{ a: 1, b: 2, c: -1 },
					{ a: 1, b: 2, c: 2 },
					{ a: 2, b: 3, c: 5 },
					{ a: 2, b: 3, c: -1 },
					{ a: 2, b: 3, c: 6 },
					{ a: 3, b: 4, c: 7 },
					{ a: 3, b: 4, c: -1 },
					{ a: 3, b: 4, c: 12 }
				]);
				
				done();
			});
			
			it('should be expanded by object as a collection of values)', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c' ], [ 'a', 'b', function(a, b){
					return { 'a+b': a + b, 'a-b': a - b, 'a*b': a*b };
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3 },
					{ a: 1, b: 2, c: -1 },
					{ a: 1, b: 2, c: 2 },
					{ a: 2, b: 3, c: 5 },
					{ a: 2, b: 3, c: -1 },
					{ a: 2, b: 3, c: 6 },
					{ a: 3, b: 4, c: 7 },
					{ a: 3, b: 4, c: -1 },
					{ a: 3, b: 4, c: 12 }
				]);
				
				done();
			});
			
			it('should be expanded by array of elements (key `c` as value, key `d` as index)', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c', 'd' ], [ 'a', 'b', function(a, b){
					return [ a + b, a - b, a*b ];
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 0 },
					{ a: 1, b: 2, c: -1, d: 1 },
					{ a: 1, b: 2, c: 2, d: 2 },
					{ a: 2, b: 3, c: 5, d: 0 },
					{ a: 2, b: 3, c: -1, d: 1 },
					{ a: 2, b: 3, c: 6, d: 2 },
					{ a: 3, b: 4, c: 7, d: 0 },
					{ a: 3, b: 4, c: -1, d: 1 },
					{ a: 3, b: 4, c: 12, d: 2 }
				]);
				
				done();
			});
			
			it('should be expanded by object as a collection of key/value pairs', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c', 'd' ], [ 'a', 'b', function(a, b){
					return { 'a+b': a + b, 'a-b': a - b, 'a*b': a*b };
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 'a+b' },
					{ a: 1, b: 2, c: -1, d: 'a-b' },
					{ a: 1, b: 2, c: 2, d: 'a*b' },
					{ a: 2, b: 3, c: 5, d: 'a+b' },
					{ a: 2, b: 3, c: -1, d: 'a-b' },
					{ a: 2, b: 3, c: 6, d: 'a*b' },
					{ a: 3, b: 4, c: 7, d: 'a+b' },
					{ a: 3, b: 4, c: -1, d: 'a-b' },
					{ a: 3, b: 4, c: 12, d: 'a*b' }
				]);
				
				done();
			});
			
			it('should be expanded by array of elements (key `c` as value, key `d` as index, key `e` as total index)', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c', 'd', 'e' ], [ 'a', 'b', function(a, b){
					return [ a + b, a - b, a*b ];
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 0, e: 0 },
					{ a: 1, b: 2, c: -1, d: 1, e: 1 },
					{ a: 1, b: 2, c: 2, d: 2, e: 2 },
					{ a: 2, b: 3, c: 5, d: 0, e: 3 },
					{ a: 2, b: 3, c: -1, d: 1, e: 4 },
					{ a: 2, b: 3, c: 6, d: 2, e: 5 },
					{ a: 3, b: 4, c: 7, d: 0, e: 6 },
					{ a: 3, b: 4, c: -1, d: 1, e: 7 },
					{ a: 3, b: 4, c: 12, d: 2, e: 8 }
				]);
				
				done();
			});
			
			it('should be expanded by object as a collection of key/value pairs + total index', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c', 'd', 'e' ], [ 'a', 'b', function(a, b){
					return { 'a+b': a + b, 'a-b': a - b, 'a*b': a*b };
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 'a+b', e: 0 },
					{ a: 1, b: 2, c: -1, d: 'a-b', e: 1 },
					{ a: 1, b: 2, c: 2, d: 'a*b', e: 2 },
					{ a: 2, b: 3, c: 5, d: 'a+b', e: 3 },
					{ a: 2, b: 3, c: -1, d: 'a-b', e: 4 },
					{ a: 2, b: 3, c: 6, d: 'a*b', e: 5 },
					{ a: 3, b: 4, c: 7, d: 'a+b', e: 6 },
					{ a: 3, b: 4, c: -1, d: 'a-b', e: 7 },
					{ a: 3, b: 4, c: 12, d: 'a*b', e: 8 }
				]);
				
				done();
			});
	
			it('should through `incorrect_value_for_variety_key` exception on incorrect return value', function(done){
				try {
					addVariety([
						{ a: 1, b: 2 },
						{ a: 2, b: 3 },
						{ a: 3, b: 4 }
					], [ 'c' ], [ 'a', 'b', function(a, b){
						return a + b;
					}]);
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('incorrect_value_for_variety_key');
					expect(e.key).to.deep.equal('{c}');
				}
				
				done();
			});
	
			it('should do nothing if return value is not defined', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c' ], function(){
					return undefined;
				})).to.deep.equal([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				]);
				
				done();
			});
	
			it('should do nothing if return value is empty array', function(done){
				expect(addVariety([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				], [ 'c' ], function(){
					return [];
				})).to.deep.equal([
					{ a: 1, b: 2 },
					{ a: 2, b: 3 },
					{ a: 3, b: 4 }
				]);
				
				done();
			});			
		
			it('should rethrough exception on undefined critical dependency with additional key property', function(done){
				try {
					addVariety([
						{ a: 1, b: 2 },
						{ a: 2, b: 3 },
						{ a: 3, b: 4 }
					], [ 'c' ], [ 'd**', function(d){
						return d;
					}]);
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('adding_cdepundef');
					expect(e.dep).to.equal('d');
					expect(e.message).to.equal('Undefined critical dependency "d" for key: ');
					expect(e.key).to.equal('{c}');
				}
				
				done();
			});
			
		});
		
		describe('object', function(){

			it('should be transformed into collection by expanding with array (key `c` as element of array returned by constructor)', function(done){
				expect(addVariety({ a: 1, b: 2 }, [ 'c' ], [ 'a', 'b', function(a, b){
					return [ a + b, a - b, a*b ];
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3},
					{ a: 1, b: 2, c: -1 },
					{ a: 1, b: 2, c: 2 }
				]);
				
				done();
			});

			it('should be transformed into collection by expanding with object (key `c` as element of array returned by constructor)', function(done){
				expect(addVariety({ a: 1, b: 2 }, [ 'c' ], [ 'a', 'b', function(a, b){
					return { 'a+b': a + b, 'a-b': a - b, 'a*b': a*b };
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3},
					{ a: 1, b: 2, c: -1 },
					{ a: 1, b: 2, c: 2 }
				]);
				
				done();
			});

			it('should be transformed into collection by expanding with array (key `c` as element, key `d` as index of array returned by constructor)', function(done){
				expect(addVariety({ a: 1, b: 2 }, [ 'c', 'd' ], [ 'a', 'b', function(a, b){
					return [ a + b, a - b, a*b ];
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 0 },
					{ a: 1, b: 2, c: -1, d: 1 },
					{ a: 1, b: 2, c: 2, d: 2 }
				]);
				
				done();
			});

			it('should be transformed into collection by expanding with object (key `c` as element, key `d` as index of array returned by constructor)', function(done){
				expect(addVariety({ a: 1, b: 2 }, [ 'c', 'd' ], [ 'a', 'b', function(a, b){
					return { 'a+b': a + b, 'a-b': a - b, 'a*b': a*b };
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 'a+b' },
					{ a: 1, b: 2, c: -1, d: 'a-b' },
					{ a: 1, b: 2, c: 2, d: 'a*b' }
				]);
				
				done();
			});

			it('should be transformed into collection by expanding with array (key `c` as element, key `d` as index of array returned by constructor, key `e` as total index)', function(done){
				expect(addVariety({ a: 1, b: 2 }, [ 'c', 'd', 'e' ], [ 'a', 'b', function(a, b){
					return [ a + b, a - b, a*b ];
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 0, e: 0 },
					{ a: 1, b: 2, c: -1, d: 1, e: 1 },
					{ a: 1, b: 2, c: 2, d: 2, e: 2 }
				]);
				
				done();
			});

			it('should be transformed into collection by expanding with object (key `c` as element, key `d` as index of array returned by constructor, key `e` as total index)', function(done){
				expect(addVariety({ a: 1, b: 2 }, [ 'c', 'd', 'e' ], [ 'a', 'b', function(a, b){
					return { 'a+b': a + b, 'a-b': a - b, 'a*b': a*b };
				}])).to.deep.equal([
					{ a: 1, b: 2, c: 3, d: 'a+b', e: 0 },
					{ a: 1, b: 2, c: -1, d: 'a-b', e: 1 },
					{ a: 1, b: 2, c: 2, d: 'a*b', e: 2 }
				]);
				
				done();
			});
		});
	});	
	
	describe('addProperty:', function(){
		
		var addProperty = private.addProperty;
		
		it('collection of objects as first arg', function(done){
			expect(addProperty([
				{ a: 1 },
				{ a: 2 },
				{ a: 3 }
			], 'b', [ 'a', function(a){
				return a + 1;
			}])).to.deep.equal([
				{ a: 1, b: 2 },
				{ a: 2, b: 3 },
				{ a: 3, b: 4 }
			]);
			
			expect(addProperty([
				{ a: 1 },
				{ a: 2 },
				{ a: 3 }
			], 'b', function(){
				return undefined;
			})).to.deep.equal([
				{ a: 1 },
				{ a: 2 },
				{ a: 3 }
			]);

			done();
		});
		
		it('object as first arg. function should edit arg object rather than return new one', function(done){
			var obj = { a: 1 };

			expect(addProperty(obj, 'b', [ 'a', function(a){
				return a + 1;
			}])).to.deep.equal({ a: 1, b: 2 });

			expect(obj).to.deep.equal({ a: 1, b: 2 });

			expect(addProperty(obj, 'b', function(){
				return undefined;
			})).to.deep.equal({ a: 1, b: 2 });
			
			done();
		});
		
		it('should rethrough exception on undefined critical dependency with additional key property', function(done){
			try {
				addProperty({ a: 1 }, 'b', [ 'a', 'c**', function(a, c){ return a + c	}]);
				assert.ok(false);
			} catch (e) {
				expect(e.code).to.equal('adding_cdepundef');
				expect(e.dep).to.equal('c');
				expect(e.message).to.equal('Undefined critical dependency "c" for key: ');
				expect(e.key).to.equal('b');
			}
			
			done();
		});
	});
	
	describe('addConstant:', function(){
		
		var addConstant = private.addConstant;
		
		it('collection of objects as first arg', function(done){
			expect(addConstant([
				{ a: 1 },
				{ a: 2 },
				{ a: 3 }
			], 'b', 10)).to.deep.equal([
				{ a: 1, b: 10 },
				{ a: 2, b: 10 },
				{ a: 3, b: 10 }
			]);
			
			expect(addConstant([
				{ a: 1 },
				{ a: 2 },
				{ a: 3 }
			], 'b', undefined)).to.deep.equal([
				{ a: 1 },
				{ a: 2 },
				{ a: 3 }
			]);

			done();
		});
		
		it('object as first arg. function should edit arg object rather than return new one', function(done){
			var obj = { a: 1 };
			expect(addConstant(obj, 'b', 10)).to.deep.equal({ a: 1, b: 10 });
			expect(obj).to.deep.equal({ a: 1, b: 10 });
			
			done();
		});
	});

	describe('clean:', function(){
		
		var clean = private.clean;

		it('should clean all special and auxiliary keys in plain object', function(done){
			expect(clean({
				'->': true,
				'-->': true,
				':': 1,
				'?': true,
				'$a': '$A',
				'$b': '$B',
				a: 'A',
				b: 'B'
			})).to.deep.equal({
				a: 'A',
				b: 'B'
			});
			
			done();
		});
		
		it('should return null on plain object with falsy `?`', function(done){
			expect(clean({
				'->': true,
				'?': false,
			})).to.be.null;
			
			done();
		});

		it('should not clean object without truthy `->`', function(done){
			expect(clean({
				'-->': true,
				'?': false,
				'$a': '$A',
				'$b': '$B',
				'a': 'A',
				'b': 'B'
			})).to.deep.equal({
				'-->': true,
				'?': false,
				'$a': '$A',
				'$b': '$B',
				'a': 'A',
				'b': 'B'
			});
			
			done();
		});
		
		it('should reject array template elements with falsy `?`', function(done){
			expect(clean([
				{
					'->': true,
					i: 0
				},
				{
					'->': true,
					'?': false,
					i: 1
				},
				{
					'->': true,
					i: 2
				}
			])).to.deep.equal([
				{
					i: 0
				},
				{
					i: 2
				}
			]);

			done();
		});

		it('Interleaving template/not template objects hierarchy', function(done){
			expect(clean({
				$a: '$A',
				a: 'A',
				l2: {
					'->': true,
					$a: '$A',
					a: 'A',
					l3: {
						$a: '$A',
						a: 'A',
						l4: {
							'->': true,
							$a: '$A',
							a: 'A',
							l5: {
								$a: '$A',
								a: 'A'
							}
						}
					}
				}
			})).to.deep.equal({
				$a: '$A',
				a: 'A',
				l2: {
					a: 'A',
					l3: {
						$a: '$A',
						a: 'A',
						l4: {
							a: 'A',
							l5: {
								$a: '$A',
								a: 'A'
							}
						}
					}
				}
			});
						
			done();
		});

		it('Interleaving template/not template arrays hierarchy', function(done){
			expect(clean([{
				$a: '$A',
				a: 'A',
				l2: [{
					'->': true,
					$a: '$A',
					a: 'A',
					l3: [{
						$a: '$A',
						a: 'A',
						l4: [{
							'->': true,
							$a: '$A',
							a: 'A',
							l5: [{
								$a: '$A',
								a: 'A'
							}]
						}]
					}]
				}]
			}])).to.deep.equal([{
				$a: '$A',
				a: 'A',
				l2: [{
					a: 'A',
					l3: [{
						$a: '$A',
						a: 'A',
						l4: [{
							a: 'A',
							l5: [{
								$a: '$A',
								a: 'A'
							}]
						}]
					}]
				}]
			}]);
						
			done();
		});

		it('Interleaving template/not template arrays/objects hierarchy', function(done){
			expect(clean([{
				$a: '$A',
				a: 'A',
				l2: {
					'->': true,
					$a: '$A',
					a: 'A',
					l3: [{
						$a: '$A',
						a: 'A',
						l4: {
							'->': true,
							$a: '$A',
							a: 'A',
							l5: [{
								$a: '$A',
								a: 'A'
							}]
						}
					}]
				}
			}])).to.deep.equal([{
				$a: '$A',
				a: 'A',
				l2: {
					a: 'A',
					l3: [{
						$a: '$A',
						a: 'A',
						l4: {
							a: 'A',
							l5: [{
								$a: '$A',
								a: 'A'
							}]
						}
					}]
				}
			}]);
						
			done();
		});

		it('Interleaving template/not template arrays/objects hierarchy with falsy `?` on one template level', function(done){
			expect(clean([{
				$a: '$A',
				a: 'A',
				'?': false,	// doesn't matter
				l2: {
					'->': true,
					$a: '$A',
					a: 'A',
					l3: [{
						$a: '$A',
						a: 'A',
						l4: {
							'->': true,
							'?': false,
							$a: '$A',
							a: 'A',
							l5: [{
								$a: '$A',
								a: 'A'
							}]
						}
					}]
				}
			}])).to.deep.equal([{
				$a: '$A',
				a: 'A',
				'?': false,
				l2: {
					a: 'A',
					l3: [{
						$a: '$A',
						a: 'A'
					}]
				}
			}]);
						
			done();
		});
				
		it('complex test', function(done){
			expect(clean({
				'->': true,
				$a: true,
				$: true,
				b: {
					$b: {
						'->': true,
						$c: true,
						$: true,
						d: true
					},
					e: [
						{
							'->': true,
							$f: true
						},
						{
							$f: true
						}
					],
					g: [
						{
							'->': true,
							'?': false,
							h: true
						},
						{
							'->': true,
							'?': true,
							i: true
						},
						{
							'?': false
						},
						true,
						false,
						[
							1,
							2,
							3,
							{
								'->': true,
								'-->': [ 'a', 'b', 'c' ],
								a: true
							}
						]
					]
				}
			})).to.deep.equal({
				b: {
					$b: {
						d: true
					},
					e: [
						{},
						{
							$f: true
						}
					],
					g: [
						{
							i: true
						},
						{
							'?': false
						},
						true,
						false,
						[
							1,
							2,
							3,
							{
								a: true
							}
						]
					]
				}
			});
			
			done();
		});
	});
	
	describe('postBuild:', function(){
		
		var postBuild = private.postBuild;
		var clean = private.clean;
		
		describe('empty collections:', function(){

			it('template with variety key which has not expanded because of abscenсe input data should return []', function(done){
				expect(clean(postBuild({
					'->': true
				}, { '-->': [[ 'a' ]]}))).to.deep.equal([]);
				
				done();
			}); 
	
			it('template with variety key and `:` key which has not expanded because of abscenсe input data should return {}', function(done){
				expect(clean(postBuild({
					'->': true
				}, { '-->': [[ 'a' ]], ':': 'b' }))).to.deep.equal({});
				
				done();
			});
		});
				
		it('case 1', function(done){
			expect(clean(postBuild([
				{
					'->': true,
					':': 'a',
					'A': 'A'
				},
				{
					'->': true,
					':': undefined,
					'B': 'B'
				},
				{
					'->': true,
					':': 'c',
					'C': 'C'
				}
			], { ':': true }))).to.deep.equal({
				a: { 'A': 'A' },
				c: { 'C': 'C' }
			});
			
			done();
		}); 
		
		it('case 1_1', function(done){
			expect(clean(postBuild({
				'->': true,
				':': 'a',
				'A': 'A'
			},
			{ ':': true }))).to.deep.equal({
				a: {
					'A': 'A'
				}
			});
			
			expect(clean(postBuild({
				'->': true,
				':': undefined,
				'A': 'A'
			},
			{ ':': true }))).to.deep.equal({});
			
			done();
		}); 
		
		it('case 2', function(done){
			expect(clean(postBuild([
				{
					'->': true,
					'A': 'A'
				},
				{
					'->': true,
					'B': 'B'
				}
			], {}))).to.deep.equal([
				{ 'A': 'A' },
				{ 'B': 'B' }
			]);
			
			done();
		}); 
		
		it('case 3', function(done){
			expect(clean(postBuild([
				{
					'->': true,
					':': 'a',
					'$return': 'A'
				},
				{
					'->': true,
					':': undefined,
					'$return': 'B'
				},
				{
					'->': true,
					':': 'c',
					'$return': 'C'
				}
			], { ':': true, $return: true }))).to.deep.equal({
				a: 'A',
				c: 'C'
			});
			
			done();
		}); 
		
		it('case 3_1', function(done){
			expect(clean(postBuild({
				'->': true,
				':': 'a',
				'$return': 'A'
			}, { ':': true, $return: true }))).to.deep.equal({ a: 'A' });
			
			expect(clean(postBuild({
				'->': true,
				':': undefined,
				'$return': 'A'
			}, { ':': true, $return: true }))).to.deep.equal({});
			
			done();
		}); 
		
		it('case 4', function(done){
			expect(clean(postBuild([
				{
					'->': true,
					'$return': 'A'
				},
				{
					'->': true,
					'$return': 'B'
				}
			], { $return: true }))).to.deep.equal([ 'A', 'B'	]);
			
			done();
		}); 
		
		it('case 5', function(done){
			expect(clean(postBuild({
				'->': true,
				'$return': 'A'
			}, {
				$return: true
			}))).to.equal('A');
			
			done();
		}); 

	});

	describe('build:', function(){
		
		var build = private.build;
		var compile = private.compile;

		describe('stupid if-else branches tests', function(){
			
			var l21 = [
				{ id: 11 },
				{ id: 12 }
			];
			
			var l22 = [
				{ id: 21 },
				{ id: 22 }
			];
			
			var levels = [
				{
					id: 1,
					l2: l21
				},
				{
					id: 2,
					l2: l22
				}
			];
	
			it('case 1 & case 5', function(done){
				var tobj = compile({
					'->': true,
					$levels: ':external',
					'{l1}': [ '$levels', function(l){ return l }],
					'{l2}': [ 'l1', function(l){ return l.l2 }],
				});
				
				expect(build(tobj, {
					$levels: levels,
				})).to.deep.equal([
					{
						l1: { id: 1, l2: l21 },
						l2: { id: 11 }
					},
					{
						l1: { id: 1, l2: l21 },
						l2: { id: 12 }
					},
					{
						l1: { id: 2, l2: l22 },
						l2: { id: 21 }
					},
					{
						l1: { id: 2, l2: l22 },
						l2: { id: 22 }
					}
				]);
				
				done();
			});
	
			it('case 2 & case 5', function(done){
				var tobj = compile({
					'->': true,
					$levels: ':external',
					'{$l1}': [ '$levels', function(l){ return l }],
					'{$l2}': [ '$l1', function(l){ return l.l2 }],
					id: [ '$l2', function(l){ return l.id }]
				});
				
				expect(build(tobj, {
					$levels: levels,
				})).to.deep.equal([
					{
						id: 11
					},
					{
						id: 12
					},
					{
						id: 21
					},
					{
						id: 22
					}
				]);
				
				done();
			});
	
			it('case 3_1 & case 5', function(done){
				var tobj = compile({
					'->': true,
					$levels: ':external',
					'{$l1}': [ '$levels', function(l){ return l }],
					'{$l2}': [ '$l1', function(l){ return l.l2 }],
					sub: {
						'->': true,
						id: function(){ return 123 }
					}
				});
				
				expect(build(tobj, {
					$levels: levels
				})).to.deep.equal([
					{
						sub: { id: 123 }
					},
					{
						sub: { id: 123 }
					},
					{
						sub: { id: 123 }
					},
					{
						sub: { id: 123 }
					}
				]);
				
				done();
			});
	
			it('case 3_2 & case 5', function(done){
				var tobj = compile({
					'->': true,
					a: function(){ return 'A' },
					sub: {
						'->': true,
						$levels: ':external',
						'{$l1}': [ '$levels', function(l){ return l }],
						'{$l2}': [ '$l1', function(l){ return l.l2 }],
						'id': [ '$l2', function(l){ return l.id }]
					}
				});
				expect(build(tobj, {
					$levels: levels,
				})).to.deep.equal({
					a: 'A',
					sub: [
						{ id: 11 },
						{ id: 12 },
						{ id: 21 },
						{ id: 22 },
					]
				});
				
				done();
			});
	
			it('case 4 & case 6', function(done){
				var r = new RegExp(/.*/);
				var tobj = compile({
					'->': true,
					a: function(){ return 'A' },
					r: r,
				});
				expect(build(tobj, {
					$levels: levels,
				})).to.deep.equal({
					a: 'A',
					r: r
				});
				
				done();
			});
		});

		describe('parent and root templates availability. prequeueing', function(){
			
			it('parent of parent (and so on) should be available', function(done){
				var tobj = compile({
					'->': [ 'L', 'child' ],
					L: function(){ return 'L1' },
					child: {
						'->': true,
						L: [ '$parent', 'child', function(p, c){ return p.L + c.L }],
						child: {
							'->': true,
							L: [ '$parent', function(p){ return p.$parent.L + 'L3' }],
						}
					}
				});

	
				expect(build(tobj, {})).to.deep.equal({
					L: 'L1',
					child: {
						L: 'L1L1L3',
						child: {
							L: 'L1L3'
						}
					}
				});
				
				done();
			});
			
			it('no parent should be available through a root except root itself', function(done){
				var tobj = compile({
					'->': true,
					child: {
						'->': [ 'multi', 'child' ],
						'{$multi}': function(){ return [ 0 ]},
						child: {
							'->': true,
							P: function(){ return !!this.$root.child }
						}
					}
				});

				expect(build(tobj, {})).to.deep.equal({
					child: [{
						child: {
							P: false
						}
					}]
				});
				
				done();
			});
			
			it('any root children (except parent) should be available through a root if the root doesn`t contain a variety key', function(done){
				var tobj = compile({
					'->': [ '$child', 'child' ],
					$child: {
						'->': true,
						L: function(){ return 'L1' }
					},
					child: {
						'->': true,
						child: {
							'->': true,
							L: function(){ return this.$root.$child.L }
						}
					}
				});

				expect(build(tobj, {})).to.deep.equal({
					child: {
						child: {
							L: 'L1'
						}
					}
				});
				
				done();
			});
			
			it('root children should not be available through a root if a queue doesn`t allow it', function(done){
				var tobj = compile({
					'->': [ 'child', '$child' ],
					$child: {
						'->': true,
					},
					child: {
						'->': true,
						child: {
							'->': true,
							L: function(){ return !!this.$root.$child }
						}
					}
				});

				expect(build(tobj, {})).to.deep.equal({
					child: {
						child: {
							L: false
						}
					}
				});
				
				done();
			});
			
			it('all root children (even service keys) should be available through a root if a queue does allow it', function(done){
				var tobj = compile({
					'->': [ '$child', 'child' ],
					$child: {
						'->': true,
					},
					child: {
						'->': true,
						child: {
							'->': true,
							L: function(){ return !!this.$root.$child }
						}
					}
				});

				expect(build(tobj, {})).to.deep.equal({
					child: {
						child: {
							L: true
						}
					}
				});
				
				done();
			});
		});

		describe('conditional templates', function(){
			
			it('constant condition in root template', function(done){
				var tobj = compile({
					'->': true,
					'?': false
				});

				expect(build(tobj, {})).to.be.null;
				
				done();
			});
			
			it('constant condition in sub template', function(done){
				var tobj = compile({
					'->': true,
					sub1: {
						'->': true,
						'?': false
					},
					sub2: {
						'->': true,
						'?': true
					}
				});


				expect(build(tobj, {})).to.deep.equal({
					sub2: {}
				});
				
				done();
			});
			
			it('dependent condition in root template', function(done){
				var tobj = compile({
					'->': true,
					$a: ':external',
					b: [ '$a', function(a){ return a + 1 }],
					'?': [ 'b', function(b){ return b > 2 }]
				});

				expect(build(tobj, { $a: 1 })).to.be.null;
				expect(build(tobj, { $a: 2 })).to.deep.equal({ b: 3 });
				
				done();
			});
			
			it('dependent condition in root template with variety key', function(done){
				var tobj = compile({
					'->': true,
					'{$multi}': function(){ return [ 0 ] },
					$a: ':external',
					b: [ '$a', function(a){ return a + 1 }],
					'?': [ 'b', function(b){ return b > 2 }]
				});

				expect(build(tobj, { $a: 1 })).to.deep.equal([]);
				expect(build(tobj, { $a: 2 })).to.deep.equal([{ b: 3 }]);
				
				done();
			});
			
			it('dependent condition between 2 variety keys', function(done){
				var data = {
					L1: {
						1: {
							reject: true,
							L2: {
								1: {
									a: 'A1'
								},
								2: {
									a: 'A2'
								}
							}
						},
						2: {
							reject: false,
							L2: {
								1: {
									a: 'A3'
								},
								2: {
									a: 'A4'
								}
							}
						}
					}
				};
				var tobj = compile({
					'->': true,
					$data: ':external',
					'{L1}': [ '$data', function(d){ return d.L1 }],
					'?': [ 'L1', function(l){ return !l.reject }],
					'{L2}': [ 'L1', function(l){ return l.L2 }],
					$return: [ 'L2', function(l){ return l.a }]
				});

				expect(build(tobj, { $data: data })).to.deep.equal([ 'A3', 'A4' ]);
				
				done();
			});
			
			it('filter', function(done){
				var tobj = compile({
					'->': true,
					'{$a}': function(){ return [ 1, 2, 3 ] },
					$return: [ '$a', function(a){ return a*a }],
					'?': [ '$a', function(a){ return a%2 }]
				});

				expect(build(tobj)).to.deep.equal([ 1, 9 ]);
				
				done();
			});
			
			it('dependent condition in sub template', function(done){
				var tobj = compile({
					'->': true,
					sub: {
						'->': true,
						$a: ':external',
						b: [ '$a', function(a){ return a + 1 }],
						'?': [ 'b', function(b){ return b > 2 }]
					}
				});

				expect(build(tobj, { $a: 1 })).to.deep.equal({});
				expect(build(tobj, { $a: 2 })).to.deep.equal({ sub: { b: 3 }});
				
				done();
			});
			
			it('dependent condition in sub template with `$return` key', function(done){
				var tobj = compile({
					'->': true,
					sub: {
						'->': true,
						$a: ':external',
						b: [ '$a', function(a){ return a + 1 }],
						'?': [ 'b', function(b){ return b > 2 }],
						$return: [ '?', function(){ return this.b }]
					}
				});

				expect(build(tobj, { $a: 1 })).to.deep.equal({});
				expect(build(tobj, { $a: 2 })).to.deep.equal({ sub: 3 });
				
				done();
			});
		});
	
		describe('simple tests to convert array to multiinstance object', function(){
			
			it('should return multiinstance object', function(done){
				
				var arr = [ 'A', 'B', 'C' ];
				
				var t = compile({
					'->': true,
					$arr: ':external',
					'{value,$i}': [ '$arr', function(arr){ return arr }],
					':': [ '$i*', function($i){ return $i + 1  }]
				});
				
				expect(build(t, { $arr: arr })).to.deep.equal({
					1: { value: 'A' },
					2: { value: 'B' },
					3: { value: 'C' }
				});
				
				done();
			});
			
			it('should return object (strings instead of subobjects)', function(done){
				
				var arr = [ 'A', 'B', 'C' ];
				
				var t = compile({
					'->': true,
					$arr: ':external',
					'{$value,$i}': [ '$arr', function(arr){ return arr }],
					$return: [ '$value', function(val){ return val }],
					':': [ '$i', function($i){ return $i + 1  }]
				});
				
				expect(build(t, { $arr: arr })).to.deep.equal({
					1: 'A',
					2: 'B',
					3: 'C'
				});
				
				done();
			});
		});

		describe('empty collections', function(){
			
			it('should return empty object', function(done){
				
				var arr = [ 'A', 'B', 'C' ];
				
				var t = compile({
					'->': true,
					$arr: ':external',
					'{value,$i}': [ '$arr', function(arr){ return arr }],
					':': [ '$i*', function($i){ return $i + 1  }]
				});

				expect(build(t, {})).to.deep.equal({});
				
				done();
			});
			
			it('should return empty array', function(done){
				
				var arr = [ 'A', 'B', 'C' ];
				
				var t = compile({
					'->': true,
					$arr: ':external',
					'{value,$i}': [ '$arr', function(arr){ return arr }]
				});

				expect(build(t, {})).to.deep.equal([]);
				
				done();
			});
		});

		describe('live examples', function(){
	
			var world = {
				countries: [
					{
						name: 'Russia',
						lang: 'ru',
						id: 1,
						cities: [
							{
								name: 'Moscow',
								id: 11
							},
							{
								name: 'Luhovicy',
								id: 12
							}
						]
					},
					{
						name: 'England',
						lang: 'eng',
						id: 2,
						cities: [
							{
								name: 'London',
								id: 21
							},
							{
								name: 'Belfast',
								id: 22
							}
						]
					}
				]
			};

			var company = {
				Departments: [
					{
						Name: 'Quality assurance',
						Staff: [
							{
								FirstName: 'Panic',
			                    LastName: 'Generator',
			                    Position: 'QA-Engineer'
							},
							{
								FirstName: 'Ivanov',
			                    LastName: 'Ivan',
			                    Position: 'QA-Engineer'
							}
						]
					},
					{
						Name: 'Development',
						Staff: [
							{
								FirstName: 'Bydlo',
			                    LastName: 'Coder',
			                    Position: 'Junior Developer'
							},
							{
								FirstName: 'Nebydlo',
			                    LastName: 'Coder',
			                    Position: 'Senior Developer'
							}
						]
					}
				]
			};
			
			it('should flatten company staff list', function(done){

				var t = compile({
					'->': true,
					$company: ':external',
					'{$dep}': [ '$company', function(c){ return c.Departments }],
					'{$person}': [ '$dep', function(d){ return d.Staff }],
				    FirstName: [ '$person', function(p){ return p.FirstName }],
				    LastName: [ '$person', function(p){ return p.LastName }],
				    Position: [ '$person', function(p){ return p.Position }],
				    Department: [ '$dep', function(d){ return d.Name }]
				});
				
				expect(build(t, {
					$company: company
				})).to.deep.equal([
					{
						FirstName: 'Panic',
						LastName: 'Generator',
						Position: 'QA-Engineer',
						Department: 'Quality assurance'
					},
					{
						FirstName: 'Ivanov',
						LastName: 'Ivan',
						Position: 'QA-Engineer',
						Department: 'Quality assurance'
					},
					{
						FirstName: 'Bydlo',
						LastName: 'Coder',
						Position: 'Junior Developer',
						Department: 'Development'
					},
					{
						FirstName: 'Nebydlo',
						LastName: 'Coder',
						Position: 'Senior Developer',
						Department: 'Development'
					}
				]);
				
				done();
			});
							
			it('should return cities objects list', function(done){

				var tobj = compile({
					'->': true,
					$world: ':external',
					'{$countryObj}': [ '$world', function(w){ return w.countries }],
					'{$cityObj}': [ '$countryObj', function(c){ return c.cities }],
					name: [ '$cityObj', function(c){ return c.name }],
					country: [ '$countryObj', function(c){ return c.name }],
					id: [ '$cityObj', function(c){ return c.id }]
				});
	
				expect(build(tobj, {
					$world: world
				})).to.deep.equal([
					{ name: 'Moscow', country: 'Russia', id: 11 },
					{ name: 'Luhovicy', country: 'Russia', id: 12 },
					{ name: 'London', country: 'England', id: 21 },
					{ name: 'Belfast', country: 'England', id: 22 }
				]);
				
				done();
			});
							
			it('should return city objects with city id as a key', function(done){
				var tobj = compile({
					'->': true,
					$world: ':external',
					':': [ '$cityObj', function(c){ return c.id }],
					'{$countryObj}': [ '$world', function(w){ return w.countries }],
					'{$cityObj}': [ '$countryObj', function(c){ return c.cities }],
					name: [ '$cityObj', function(c){ return c.name }],
					country: [ '$countryObj', function(c){ return c.name }]
				});
	
				expect(build(tobj, {
					$world: world
				})).to.deep.equal({
					11: { name: 'Moscow', country: 'Russia' },
					12: { name: 'Luhovicy', country: 'Russia' },
					21: { name: 'London', country: 'England' },
					22: { name: 'Belfast', country: 'England' }
				});
	
				done();
			});
	
			it('should return full cities names array', function(done){
	
				var tobj = compile({
					'->': true,
					$world: ':external',
					'{$countryObj}': [ '$world', function(w){ return w.countries }],
					'{$cityObj}': [ '$countryObj', function(c){ return c.cities }],
					'$return': [ '$countryObj', '$cityObj', function(country, city){ return city.name + ' ' + country.name }]
				});
			
				expect(build(tobj, {
					$world: world
				})).to.deep.equal([
					'Moscow Russia',
					'Luhovicy Russia',
					'London England',
					'Belfast England'
				]);
				
				done();
			});
	
			it('should return object with cities ids as a keys and full cities names as a values', function(done){
	
				var tobj = compile({
					'->': true,
					':': [ '$cityObj', function(c){ return c.id }],
					$world: ':external',
					'{$countryObj}': [ '$world', function(w){ return w.countries }],
					'{$cityObj}': [ '$countryObj', function(c){ return c.cities }],
					'$return': [ '$countryObj', '$cityObj', function(country, city){ return city.name + ' ' + country.name }]
				});
			
				expect(build(tobj, {
					$world: world
				})).to.deep.equal({
					11: 'Moscow Russia',
					12: 'Luhovicy Russia',
					21: 'London England',
					22: 'Belfast England'
				});
				
				done();
			});
			
			it('templates tree', function(done){
				var tobj = compile({
					'->': [ '$cityObj', 'params' ],
					$world: ':external',
					'{$countryObj}': [ '$world', function(w){ return w.countries }],
					'{$cityObj}': [ '$countryObj', function(c){ return c.cities }],
					':': [ '$cityObj', function(c){ return c.id }],
					name: [ '$cityObj', function(c){ return c.name }],
					params: {
						'->': true,
						country: [ '$parent', function(p){ return p.$countryObj.name }],
						lang: [ '$parent', function(p){ return p.$countryObj.lang }]
					}
				});
	
				expect(build(tobj, {
					$world: world
				})).to.deep.equal({
					11: {
						name: 'Moscow',
						params: {
							country: 'Russia',
							lang: 'ru'
						}
					},
					12: {
						name: 'Luhovicy',
						params: {
							country: 'Russia',
							lang: 'ru'
						}
					},
					21: {
						name: 'London',
						params: {
							country: 'England',
							lang: 'eng'
						}
					},
					22: {
						name: 'Belfast',
						params: {
							country: 'England',
							lang: 'eng'
						}
					}
				});
				
				done();
			});

		});

		describe('error processing', function(){
			
			it('Incorrect value for variety key', function(done){ 

				try {
					var tobj = compile({
						'->': true,
						'{a, b, c}': function(){ return true }
					});
					
					build(tobj);
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('build_error');
					expect(e.message).to.equal('Incorrect value for variety key: "{a,b,c}"');
				}
				
				try {
					var tobj = compile({
						L2: {
							L3: {
								L4: {
									'->': true,
									a: function(){ return 'A' },
									'{b}': [ 'a', function(a){ return !a }]
								}
							}
						}
					});

					build(tobj);
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('build_error');
					expect(e.key).to.equal('L2.L3.L4.{b}');
					expect(e.message).to.equal('Incorrect value for variety key: "L2.L3.L4.{b}"');
				}

				done();
			});
			
			it('Undefined critical dependency', function(done){ 

				try {
					var tobj = compile({
						L2: {
							L3: {
								L4: {
									'->': true,
									a: function(){ return 'A' },
									c: function(){ return undefined },
									'{b}': [ 'a', 'c**', function(a){ return !a }]
								}
							}
						}
					});
					
					build(tobj);
					assert.ok(false);
				} catch (e) {
					expect(e.code).to.equal('build_error');
					expect(e.message).to.equal('Undefined critical dependency "c" for key: "L2.L3.L4.{b}"');
				}

				done();
			});
		});
	});
});	
