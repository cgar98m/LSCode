class Lexer {

	const LANGS = ["CAT"];

	let regexList = [];
	
	let tokens = [];
	let lang = "CAT";

	constructor(errorHandler) {
		
		//Get handler
		this.errorHandler = errorHandler;
		
		//Load all regexp
		
		
	}

	setLanguage(lang) {
		this.lang = lang;
	}
	
	scan(naturalText) {
		
	}
	
	getTokens() {
		return tokens;
	}

}