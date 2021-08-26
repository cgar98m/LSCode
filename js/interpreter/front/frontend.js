const LEXIC_ID = "lexic";
const GRAMMAR_ID = "grammar";

class FrontEnd {

	constructor(guidelines, errorHandler) {
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Create lexer
		this.lexer = new Lexer(guidelines[LEXIC_ID], errorHandler);
		
		//Create parser
		this.parser = new Parser(guidelines[LEXIC_ID], guidelines[GRAMMAR_ID], errorHandler);
		
		//Create semantic analyzer (AST generator)
		this.semantica = new Semantica(this.parser.grammarMap, errorHandler);
		
	}
	
	process(naturalText) {
		
		//Scan to get tokens
		this.lexer.scan(naturalText);
		
		//Parse tokens
		if(this.errorHandler.criticalErrors == 0) {
			this.parser.parse(this.lexer.tokens);
		} else {
			this.parser.clear();
		}
		
		//Generate AST code
		if(this.errorHandler.criticalErrors == 0 && this.parser.parseTree.length > 0) {
			this.semantica.generateAst(this.parser.parseTree[0]);
		} else {
			this.semantica.clear();
		}
		
	}
	
	tokens() {
		return this.lexer.tokens;
	}
	
	predTree() {
		return this.parser.predTree;
	}
	
	parseTree() {
		return this.parser.parseTree;
	}
	
	astTree() {
		return this.semantica.astTree;
	}
	
	funcAstTree() {
		return this.semantica.funcAstTree;
	}
	
	sysAstTree() {
		return this.semantica.sysFunc;
	}

}
