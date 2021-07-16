const LEXIC_ID = "lexic";
const GRAMMAR_ID = "grammar";

class FrontEnd {

	constructor(guidelines, errorHandler) {
		
		//Create lexer
		this.lexer = new Lexer(guidelines[LEXIC_ID], errorHandler);
		
		//Create parser
		this.parser = new Parser(guidelines[LEXIC_ID], guidelines[GRAMMAR_ID], errorHandler);
		
		//TODO: Create semantic analyzer
		
		//TODO: Create AST generator
		
	}
	
	process(naturalText) {
		
		//Scan to get tokens
		this.lexer.scan(naturalText);
		
		//Parse tokens
		this.parser.parse(this.lexer.tokens);
		
		//TODO: Analyze semantic
		//TODO: Generate AST code
		
	}
	
	get intermidiateCode() {
		return [];
	}
	
	get symbolicTable() {
		return [];
	}
	
	get errors() {
		return [];
	}

}
