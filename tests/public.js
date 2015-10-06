var T = require('../lib/index.js').T
  ,	expect = require('chai').expect
  ,	assert = require('chai').assert;
  
describe('public API:', function(){

	describe('T class:', function(){
		
		it('a single test:', function(done){
		
			var tobj = T({
				'->': true,
				$a: ':external',
				$return: [ '$a', function(a){ return '_' + a + '_' }]
			});
			
			expect(tobj.build({ $a: 'A' })).to.equal('_A_');
			expect(tobj.build({ $a: 'B' })).to.equal('_B_');
			
			done();
		});
	});
});	
