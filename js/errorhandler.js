const ERROR_FONT = {
	LEXER: "Lexer",
	PARSER: "Parser",
	SEMANTICA: "Semantica"
};
const ERROR_TYPE = {
	WARNING: "Warning",
	ERROR: "Error"
};

class ErrorHandler {

	constructor() {
		this.errors = [];
	}

	newError(errorFont, errorType, errorMsg) {
		this.errors.push({
			font: errorFont,
			type: errorType,
			msg: errorMsg
		});
	}
	
	newErrorPack(errorList, msgHeader) {
		for(let i = 0; i < errorList.length; i++) {
			let error = errorList[i];
			this.newError(error.font, error.type, "[" + msgHeader + "] " + error.msg);
		}
	}
	
	clear() {
		this.errors = [];
	}

}