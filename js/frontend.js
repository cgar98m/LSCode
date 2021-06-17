const LEXIC_ID = "lexic";
const GRAMMAR_ID = "grammar";

class FrontEnd {

	constructor(guidelines) {
		
		//TODO: Create error handler
		
		//Create lexer
		this.lexer = new Lexer(guidelines[LEXIC_ID]);
		this.parser = new Parser(guidelines[GRAMMAR_ID]);
		//TODO: Create semantic analyzer
		//TODO: Create code generator
		
	}
	
	process(naturalText) {
		
		//Scan to get tokens
		this.lexer.scan(naturalText);
		
		//Parse tokens
		this.parser.parse(this.lexer.tokens);
		
		//TODO: Analyze semantic
		//TODO: Generate code
		
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
