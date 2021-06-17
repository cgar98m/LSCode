
class Parser {
	
	constructor(grammar) {
		
		//TODO: Pre-build first & follow
		this.firsts = this.#firstCalc(grammar);
		
		//Empty parse tree
		this.parseTree = null;
		
	}
	
	parse(tokens) {
		
	}
	
	#firstCalc(grammar) {
		
		let firsts = [];
		
		return firsts;
		
	}
	
}
