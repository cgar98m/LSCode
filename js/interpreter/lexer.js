const TOKEN_COMMENT_LINE = "SP_COMMENT_LINE";

const TOKEN_COMMENT_OPEN = "SP_COMMENT_OPEN";
const TOKEN_COMMENT_CLOSE = "SP_COMMENT_CLOSE";

class Lexer {

	constructor(lexic, errorHandler) {
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Pre-build regex
		for(let i = 0; i < lexic.length; i++) {
			lexic[i].builtRegex = new RegExp(lexic[i].regex, CASE_INSENSITIVE_REGEXP);
		}
		this.lexic = lexic;
		
		//Empty token list
		this.tokens = [];
		
	}
	
	scan(naturalText) {
		
		//Empty tokens
		this.tokens = [];
		
		//Split text in lines
		let lines = naturalText.split(LINE_BREAK);
		
		//Look for tokens in every line
		let ignoreTokens = false;
		for(let i = 0; i < lines.length; i++) {
			
			//Get line and prepare char offset
			let line = lines[i];
			let charOffset = 0;
			
			//Look for token matches in current line
			while(line.length > 0) {
				
				//Trim line and update offset
				charOffset += line.length;
				line = line.trimLeft();
				charOffset -= line.length;
				
				//Token matching
				let matches = [];
				for(let j = 0; j < this.lexic.length; j++) {
					
					//Match try
					let match = line.match(this.lexic[j].builtRegex);
					
					//Check match
					if(match != null) {
						
						//Prepare token
						let token = {
							token_id: this.lexic[j].token_id.slice(),
							line: i,
							offset: charOffset + match.index,
							content: match[0].slice()
						};
						
						//Store token as match
						matches.push(token);
						
					}
					
				}
				
				//Get best match
				if(matches.length > 0) {
					
					//Best match finding
					let bestMatch = 0;
					for(let j = 1; j < matches.length; j++) {
						//Check earlier appearance
						if(matches[j].offset < matches[bestMatch].offset) {
							bestMatch = j;
						} else if(matches[j].offset == matches[bestMatch].offset) {
							//Check largest token
							if(matches[j].content.length > matches[bestMatch].content.length) {
								bestMatch = j;
							} else if(matches[j].content.length == matches[bestMatch].content.length) {
								//Check reserved token
								if(matches[j].token_id != TOKEN_ID) {
									bestMatch = j;
								}
							}
						}
					}
					
					//Check line comment
					if(matches[bestMatch].token_id == TOKEN_COMMENT_LINE) {
						break;	//Trailing tokens ignored
					}
					
					//Check comment open
					if(matches[bestMatch].token_id == TOKEN_COMMENT_OPEN) {
						//Ignore tokens until comment closing
						ignoreTokens = true;
					} else if(matches[bestMatch].token_id == TOKEN_COMMENT_CLOSE) {
						//Enable token storing
						ignoreTokens = false;
					} else {
						//Check if token can be stored
						if(!ignoreTokens) {
							//Store token
							this.tokens.push(matches[bestMatch]);
						}
					}
					
					//Get token last char offset
					let offset = (matches[bestMatch].offset - charOffset) + matches[bestMatch].content.length;
					
					//Check if some undefined token was ignored
					let unexpectedContent = line.substring(0, matches[bestMatch].offset - charOffset).trim();
					if(unexpectedContent.length != 0) {
						//Check if error should not be ignored
						if(!ignoreTokens) {
							//Unexpected token warning
							this.errorHandler.newError(ERROR_FONT.LEXER, ERROR_TYPE.WARNING, WARN_UNDEFINED_TOKEN.format(unexpectedContent, i, charOffset));
						}
					}
					
					//Remove token from line and update offset
					line = line.substring(offset, line.length);
					charOffset += offset;
					
				} else {
					
					//Check if something left isn't a blankspace
					let unexpectedContent = line.trim();
					if(unexpectedContent.length != 0) {
						//Check if error should not be ignored
						if(!ignoreTokens) {
							//Unexpected token warning
							this.errorHandler.newError(ERROR_FONT.LEXER, ERROR_TYPE.WARNING, WARN_UNDEFINED_TOKEN.format(unexpectedContent, i, charOffset));
						}
					}
					
					break;	//No more matches remaining in this line
					
				}
				
			}
			
		}
		
	}

}
