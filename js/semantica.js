class Semantica {
	
	constructor(grammarMap, errorHandler) {
		
		//Keep grammar
		this.grammarMap = grammarMap;
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Empty ast tree
		this.astTree = null;
		
	}
	
	generateAst(parseTree) {
		//TODO
	}
	
	clear() {
		this.astTree = null;
	}
	
}
