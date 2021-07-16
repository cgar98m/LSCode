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
	
	newErrorPack(errorHandler) {
		this.errors.push(...errorHandler.errors);
	}
	
	clear() {
		this.errors = [];
	}

}