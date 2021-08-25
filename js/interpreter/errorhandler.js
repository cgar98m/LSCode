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
		this.criticalErrors = 0;
	}

	newError(errorFont, errorType, errorMsg) {
		this.errors.push({
			font: errorFont,
			type: errorType,
			msg: errorMsg
		});
		if(errorType == ERROR_TYPE.ERROR) {
			this.criticalErrors++;
		}
	}
	
	newErrorPack(errorList, msgHeader) {
		for(let i = 0; i < errorList.length; i++) {
			let error = errorList[i];
			this.newError(error.font, error.type, ERROR_PARSE.format(msgHeader, error.msg));
			if(error.type == ERROR_TYPE.ERROR) {
				this.criticalErrors++;
			}
		}
	}
	
	clear() {
		this.errors = [];
		this.criticalErrors = 0;
	}

}