const ERROR_FONT = {
	LEXER: 'L',
	PARSER: 'P',
	SEMANTICA: 'S'
};
const ERROR_TYPE = {
	WARNING: 'W',
	ERROR: 'E'
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