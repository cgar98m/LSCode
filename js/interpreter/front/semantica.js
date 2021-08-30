const SEMANTICA_KEYS = {
	NEW_CONTEXT: "newContext",
	VAR_DEFINE: "varDefine",
	VAR: "varName",
	TYPE: "type",
	VAR_ASSIGN: "varAssign",
	VAR_SEPARATION: "varSeparation",
	FORK: "fork",
	LOOP: "loop",
	FUNC_DEFINE: "funcDefine",
	FUNC_VAR: "funcVar",
	TYPE_SEPARATION: "typeSeparation",
	FUNC_CALL: "funcCall",
	EXP_SEPARATION: "expSeparation",
	UNARY_EXPRESSION: "unaryExpression",
	EXPRESSION: "expression",
	OPERATION: "operation",
	OPERATOR: "operator",
	VALUE: "value"
}

const EXP_SPECIAL_KEYS = {
	EXP: "expression",
	FUNC: "return",
	ID: "id",
	GROUP: "group"
}

const DATA_TYPES = {
	INT: "int",
	CHAR: "char",
	BOOL: "bool",
	STRING: "string"
}

const SYS_FUNC = {
	INT: "printaEnter",
	CHAR: "printaCaracter",
	BOOL: "printaBoolea",
	STRING: "printaCadena"
}

const OPERATION = {
	NOT: "not",
	OR: "or",
	AND: "and",
	EQ: "equal",
	NOT_EQ: "notEqual",
	LOW: "lower",
	LOW_EQ: "lowerEqual",
	GREAT: "greater",
	GREAT_EQ: "greaterEqual",
	PLUS: "plus",
	MINUS: "minus",
	MULT: "mult",
	DIV: "div",
	MOD: "mod"
}

const OP_LVL = {
	NOT: 0,
	OR: 1,
	AND: 2,
	EQ: 3,
	NOT_EQ: 3,
	LOW: 4,
	LOW_EQ: 4,
	GREAT: 4,
	GREAT_EQ: 4,
	PLUS: 5,
	MINUS: 5,
	MULT: 6,
	DIV: 6,
	MOD: 6
};

const BOOL = {
	TRUE: "KW_BOOL_TRUE",
	FALSE: "KW_BOOL_FALSE"
}

class Semantica {
	
	constructor(grammarMap, errorHandler) {
		
		//Keep grammar
		this.grammarMap = grammarMap;
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Clear strcuts
		this.clear();
		this.sysFuncClear();
		
	}
	
	clear() {
		
		//Empty context
		this.globalContext = {
			vars: {},
			parentContext: null
		};
		
		//Empty funcs
		this.funcAstTree = [];
		
		//Empty root AST node
		this.astTree = null;
		
	}
	
	generateAst(parseTree) {
		
		//Clear strcuts
		this.clear();
		
		//Create root AST node
		this.astTree = {
			type: AST_NODE.STRUCT,
			context: this.globalContext,
			children: []
		}
		
		//Context & AST struct (stop on critical error)
		this.astSkell(parseTree, this.astTree);
		
		//Func definition (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.astFuncAlloc(parseTree, this.astTree);
		}
		
		//Var definition (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.astVarsAlloc(parseTree, this.astTree);
		}
		
		//Vars/func calls existance check (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.astAccessCheck(parseTree, this.astTree);
		}
		
		//Expressions validation: if, while, var assign & func call (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.astExpressionCheck(parseTree, this.astTree);
		}
		
		//Func return validation (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.astFuncReturnCheck(parseTree, this.astTree);
		}
		
		//Check critical error
		if(this.errorHandler.criticalErrors != 0) {
			this.clear();
		}
		
	}
	
	//Hardcoded func. May improve in the future (sysFunc.json?)
	sysFuncClear() {
		
		//Reset system funcs
		this.sysFunc = [];
		
		//Create all data types print
		let types = Object.keys(DATA_TYPES);
		for(let i = 0; i < types.length; i++) {
			this.sysPrint(SYS_FUNC[types[i]], DATA_TYPES[types[i]]);
		}
		
	}
	
	sysPrint(printName, printType) {
		this.sysFunc[printName] = {
			type: AST_NODE.FUNC,
			funcName: printName,
			context: {
				vars: {
					msg: {
						content: "msg",
						type: printType
					}
				},
				parentContext: this.globalContext
			},
			children: [
				{
					children: [
						{
							info: {}
						}
					]
				},
				{
					children: []
				},
				{
					children: []
				},
				{
					children: []
				}
			]
		}
		this.sysFunc[printName].children[0].children[0].info = this.sysFunc[printName].context.vars.msg;
	}
	
	/*******
	AST CORE
	*******/
	
	astSkell(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						this.varAssignSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FORK:
						this.forkSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.LOOP:
						this.loopSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_DEFINE:
						this.funcDefineSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_CALL:
						this.funcCallSkell(parseNode, astNodeParent, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astSkell(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	varAssignSkell(parseNode, astNodeParent, semantica) {
	
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
	
		//Create var assign node
		let varAssignNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
			context: astNodeParent.context,
			children: []
		};
		astNodeParent.children.push(varAssignNode);
		
		//Link parse node to ast
		parseNode.linkAst = varAssignNode;
	
	}
	
	forkSkell(parseNode, astNodeParent, semantica) {
		
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Create if node
		let ifNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
			context: astNodeParent.context,
			children: []
		};
		astNodeParent.children.push(ifNode);
		
		//Link parse node to ast
		parseNode.linkAst = ifNode;
		
		//Create empty condition node
		let conditionNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		ifNode.children.push(conditionNode);
		
		//Create cases node
		let casesNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		ifNode.children.push(casesNode);
		
		//Fill cases node
		for(let i = 0; i < parseNode.children.length; i++) {
			let prod = parseNode.children[i];
			if(semantica[ifNode.semantica].cases.find(item => item == prod.production_id)) {
				
				//Create context
				this.contextExtraction(prod, casesNode, astNodeParent.context);
				
				//Assign case type
				let caseContext = casesNode.children[casesNode.children.length - 1];
				caseContext.conditionCase = semantica[ifNode.semantica].cases.indexOf(prod.production_id);
				
			}
		}
		
	}
	
	loopSkell(parseNode, astNodeParent, semantica) {
		
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Create loop node
		let loopNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
			context: astNodeParent.context,
			children: []
		};
		astNodeParent.children.push(loopNode);
		
		//Link parse node to ast
		parseNode.linkAst = loopNode;
		
		//Create empty condition node
		let conditionNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		loopNode.children.push(conditionNode);
		
		//Create code node
		let codeNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		loopNode.children.push(codeNode);
		
		//Fill code node
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[loopNode.semantica].code) {
				this.contextExtraction(parseNode.children[i], codeNode, astNodeParent.context);
			}
		}
		
	}
	
	funcDefineSkell(parseNode, astNodeParent, semantica) {
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].funcName);
		
		//Check if function exists
		if(this.existsFunc(funcNodeName.info.content)) {
			if(this.isSysFunc(funcNodeName.info.content)) {
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_SYS_FUNC_REDEFINE.format(funcNodeName.info.content, funcNodeName.info.line, funcNodeName.info.offset));
			} else {
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_FUNC_REDEFINE.format(funcNodeName.info.content, funcNodeName.info.line, funcNodeName.info.offset));
			}
			return;
		}
		
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Create function
		let funcNode = {
			type: AST_NODE.FUNC,
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
			funcName: funcNodeName.info.content,
			context: {
				vars: {},
				parentContext: this.globalContext
			},
			children: []
		}
		this.funcAstTree[funcNodeName.info.content] = funcNode;
		
		//Link parse node to ast
		parseNode.linkAst = funcNode;
		
		//Create empty params node
		let paramsNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		funcNode.children.push(paramsNode);
		
		//Create empty return type node
		let returnTypeNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		funcNode.children.push(returnTypeNode);
		
		//Create code node
		let codeNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		funcNode.children.push(codeNode);
		
		//Fill code node
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].code) {
				this.contextExtraction(parseNode.children[i], codeNode, funcNode.context);
			}
		}
		
		//Check if exists any context
		if(codeNode.children.length != 0) {
			for(let i = 0; i < codeNode.children.length; i++) {
				codeNode.children[i].context.parentContext = this.globalContext;
			}
			funcNode.context = codeNode.children[0].context;
		}
		
		//Create empty return node
		let returnNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		funcNode.children.push(returnNode);
		
		//Check if exists return statement
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].returnData) {
				
				//Get first and last terminals
				firstTerm = this.terminalFirst(parseNode.children[i]);
				lastTerm = this.terminalLast(parseNode.children[i]);
				
				//Update info
				returnNode.lineStart = firstTerm.info.line;
				returnNode.lineEnd = lastTerm.info.line;
				returnNode.offsetStart = firstTerm.info.offset;
				returnNode.offsetEnd = lastTerm.info.offset + lastTerm.info.content.length - 1;
				
			}
		}
		
	}
	
	contextExtraction(parseNode, astNodeParent, context) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check if contains new context key
			if(typeof semantica[SEMANTICA_KEYS.NEW_CONTEXT] === UNDEFINED) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.contextExtraction(parseNode.children[i], astNodeParent, context);
				}
			} else {
				
				//Create new context
				let contextNode = {
					type: AST_NODE.STRUCT,
					context: {
						vars: {},
						parentContext: context
					},
					children: []
				};
				
				//Append node to AST tree
				astNodeParent.children.push(contextNode);
				
				//Link parse node to ast node
				parseNode.linkAst = contextNode;
				
				//Sub-context extraction
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astSkell(parseNode.children[i], parseNode.linkAst);
				}
				
			}
			
		}
	}
	
	funcCallSkell(parseNode, astNodeParent, semantica) {
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].funcName);
		
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Create func call node
		let funcCallNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
			context: astNodeParent.context,
			ref: funcNodeName.info.content,
			children: []
		};
		astNodeParent.children.push(funcCallNode);
		
		//Link parse node to ast
		parseNode.linkAst = funcCallNode;
		
	}
	
	/*************
	VAR DEFINITION
	*************/
	
	astVarsAlloc(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica and AST
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.NEW_CONTEXT:
						astNodeParent = parseNode.linkAst;
						continueSearch = true;
						break;
						
					case SEMANTICA_KEYS.FUNC_DEFINE:
						astNodeParent = parseNode.linkAst;
						continueSearch = true;
						break;
						
					case SEMANTICA_KEYS.VAR_DEFINE:
						this.varDefineAlloc(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						this.varAssignAlloc(parseNode, astNodeParent, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astVarsAlloc(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	varDefineAlloc(parseNode, astNodeParent, semantica) {
		
		//Extract vars
		let varList = this.varExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_DEFINE].vars));
		
		//Extract type
		let typeInfo = this.typeExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_DEFINE].type));
		
		//Create vars in symbolic table
		for(let i = 0; i < varList.length; i++) {
			
			//Get var info
			let varInfo = varList[i];
			varInfo.type = typeInfo.type;
			
			//Check if var already exists
			if(astExistsVar(varInfo.content, astNodeParent.context)) {
				//Check if is located in same context
				if(typeof astNodeParent.context.vars[varInfo.content] === UNDEFINED) {
					//Var re-definition in different context accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, WARN_VAR_REDEFINE.format(varInfo.content, varInfo.line, varInfo.offset));
				} else {
					//Var re-definition in same context not accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_VAR_REDEFINE.format(varInfo.content, varInfo.line, varInfo.offset));
					return;
				}
			}
			
			//Create var on symbolic table
			astNodeParent.context.vars[varInfo.content] = varInfo;
			
		}
		
	}
	
	varAssignAlloc(parseNode, astNodeParent, semantica) {
		
		//Extract var groups
		let varConcat = this.varConcatExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_ASSIGN].varConcat));
		
		//Get var assign node
		let varAssignNode = parseNode.linkAst;
		
		//Create vars in current context if don't exist
		for(let i = 0; i < varConcat.length; i++) {
			for(let j = 0; j < varConcat[i].length; j++) {
				
				//Get var info
				let varInfo = varConcat[i][j];
				
				//Check if var already exists
				if(!astExistsVar(varInfo.content, astNodeParent.context)) {
					
					//Var creation notification
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, WARN_IMPLICIT_VAR_DEFINE.format(varInfo.content, varInfo.line, varInfo.offset));
					
					//Update sym table
					varInfo.type = null;	//Undefined value (depends on expression, which can contain itself --> mimics neighbour type)
					astNodeParent.context.vars[varInfo.content] = varInfo;
					
				} else {
					let varRef = astLocateVar(varInfo.content, astNodeParent.context);
					varInfo.type = varRef.type;
				}
				
			}
		}
		
		//Check same vars amount
		for(let i = 0; i < varConcat.length - 1; i++) {
			if(varConcat[i].length != varConcat[i + 1].length) {
				//Different var amount
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_VAR_AMOUNT_MISSMATCH.format(varConcat[0][0].line, varConcat[0][0].offset));
				return;
			}
		}
		
		//Create separated vars depending on position
		let varAssignVarsNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		varAssignNode.children.push(varAssignVarsNode);
		for(let i = 0; i < varConcat[0].length; i++) {
			
			//Append new vars node relative to hypothetic value
			let nodeVars = {
				type: AST_NODE.INFO_HEADER,
				children: []
			};
			varAssignVarsNode.children.push(nodeVars);
			
			for(let j = 0; j < varConcat.length; j++) {
				nodeVars.children.push(varConcat[j][i]);
			}
			
		}
		
	}
	
	varConcatExtraction(parseNode) {
	
		//Check if is a production
		let varConcat = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsVarGroup = typeof semantica[SEMANTICA_KEYS.VAR_SEPARATION] !== UNDEFINED;
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsVarGroup && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.VAR_SEPARATION].varGroup) {
					varConcat.push(this.varExtraction(parseNode.children[i]));
				} else {
					varConcat.push(...this.varConcatExtraction(parseNode.children[i]));
				}
			}
		
		}
	
		return varConcat;
		
	}
	
	varExtraction(parseNode) {
		
		//Check if is a production
		let varList = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsVar = typeof semantica[SEMANTICA_KEYS.VAR] !== UNDEFINED;
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsVar && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.VAR].varName) {
					varList.push(parseNode.children[i].info);
				} else {
					varList.push(...this.varExtraction(parseNode.children[i]));
				}
			}
			
		}
		
		return varList;
		
	}
	
	/**************
	FUNC DEFINITION
	**************/
	
	astFuncAlloc(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.FUNC_DEFINE:
						astNodeParent = parseNode.linkAst;
						this.funcDefineAlloc(parseNode, astNodeParent, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astFuncAlloc(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	funcDefineAlloc(parseNode, astNodeParent, semantica) {
		
		//Get function data
		let funcParams = [];
		let funcTypes = [];
		for(let i = 0; i < parseNode.children.length; i++) {
			switch(parseNode.children[i].production_id) {
				
				case semantica[SEMANTICA_KEYS.FUNC_DEFINE].params:
					funcParams = this.funcParamsExtraction(parseNode.children[i]);
					break;
					
				case semantica[SEMANTICA_KEYS.FUNC_DEFINE].returnType:
					funcTypes = this.typeConcatExtraction(parseNode.children[i]);
					break;
					
			}
		}
		
		//Get func define node
		let funcVarDefineNode = astNodeParent.children[0];
		
		//Create vars in symbolic table
		for(let i = 0; i < funcParams.length; i++) {
			
			//Get var info
			let varInfo = funcParams[i];
			
			//Check if var already exists (may not happen, ever)
			if(astExistsVar(varInfo.content, astNodeParent.context)) {
				//Check if is located in same context
				if(typeof astNodeParent.context.vars[varInfo.content] === UNDEFINED) {
					//Var re-definition in different context accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, WARN_VAR_REDEFINE.format(varInfo.content, varInfo.line, varInfo.offset));
				} else {
					//Var re-definition in same context not accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_VAR_REDEFINE.format(varInfo.content, varInfo.line, varInfo.offset));
					return;
				}
			}
			
			//Create var on symbolic table and assign data type
			astNodeParent.context.vars[varInfo.content] = varInfo;
			
			//Create var node
			let funcVarDef = {
				type: AST_NODE.INFO,
				info: varInfo
			};
			funcVarDefineNode.children.push(funcVarDef);
			
		}
		
		//Get func type return node
		let funcTypeNode = astNodeParent.children[1];
		
		//Append return type
		for(let i = 0; i < funcTypes.length; i++) {
			funcTypeNode.children.push({
				type: AST_NODE.INFO,
				info: funcTypes[i]
			});
		}
		
	}
	
	funcParamsExtraction(parseNode) {
		
		//Check if is a production
		let funcParams = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let param;
			let existsFuncVar = typeof semantica[SEMANTICA_KEYS.FUNC_VAR] !== UNDEFINED;
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsFuncVar) {
					if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_VAR].varName) {
						param = parseNode.children[i].info;
					} else if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_VAR].type) {
						let typeInfo = this.typeExtraction(parseNode.children[i]);
						param.type = typeInfo.type;
					}
				} else {
					funcParams.push(...this.funcParamsExtraction(parseNode.children[i]));
				}
			}
			
			//Append param if exists
			if(existsFuncVar) {
				funcParams.push(param);
			}
			
		}
		
		return funcParams;
		
	}
	
	typeConcatExtraction(parseNode) {
	
		//Check if is a production
		let typeConcat = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsTypeGroup = typeof semantica[SEMANTICA_KEYS.TYPE_SEPARATION] !== UNDEFINED;
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsTypeGroup && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.TYPE_SEPARATION].typeGroup) {
					typeConcat.push(this.typeExtraction(parseNode.children[i]));
				} else {
					typeConcat.push(...this.typeConcatExtraction(parseNode.children[i]));
				}
			}
		
		}
	
		return typeConcat;
		
	}
	
	typeExtraction(parseNode) {
		
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process type child
			if(typeof semantica[SEMANTICA_KEYS.TYPE] !== UNDEFINED) {
				//Find type pair
				let typePairs = semantica[SEMANTICA_KEYS.TYPE].typePairs;
				for(let i = 0; i < parseNode.children.length; i++) {
					
					//Prepare node
					let typeInfo = parseNode.children[i].info;
					
					//Extract key-value type
					let keyValue = typePairs.find(item => Object.keys(item)[0] == parseNode.children[i].production_id);
					
					//Get type
					typeInfo.type = keyValue[Object.keys(keyValue)[0]];
					return typeInfo;
					
				}
			}
			
		}
		
		return null;
		
	}
	
	/**************
	EXISTANCE CALLS
	**************/
	
	astAccessCheck(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
					
					case SEMANTICA_KEYS.NEW_CONTEXT:
						astNodeParent = parseNode.linkAst;
						continueSearch = true;
						break;
						
					case SEMANTICA_KEYS.FUNC_DEFINE:
						astNodeParent = parseNode.linkAst;
						continueSearch = true;
						break;
					
					case SEMANTICA_KEYS.VALUE:
						this.valueAccessCheck(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_CALL:
						this.funcAccessCheck(parseNode, astNodeParent, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astAccessCheck(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	valueAccessCheck(parseNode, astNodeParent, semantica) {
		
		//Get all possible value list
		let posValues = semantica[SEMANTICA_KEYS.VALUE].typePairs;
		
		//Find associated value
		for(let i = 0; i < parseNode.children.length; i++) {
			let posNode = parseNode.children[i];
			for(let j = 0; j < posValues.length; j++) {
				if(typeof posValues[j][posNode.production_id] !== UNDEFINED) {
					//Check what kind of value is
					if(posValues[j][posNode.production_id] == EXP_SPECIAL_KEYS.EXP) {
						this.astAccessCheck(posNode, astNodeParent);
					} else if(posValues[j][posNode.production_id] == EXP_SPECIAL_KEYS.FUNC) {
						this.astAccessCheck(posNode, astNodeParent);
					} else if(posValues[j][posNode.production_id] == EXP_SPECIAL_KEYS.ID) {
						this.varAccesCheck(posNode, astNodeParent);
					}
				}
			}
		}
		
	}
	
	varAccesCheck(posNode, astNodeParent) {
		//Check var existance
		if(!astExistsVar(posNode.info.content, astNodeParent.context)) {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_UNDEFINED_VAR.format(posNode.info.content, posNode.info.line, posNode.info.offset));
		} else {
			//Check if was previosuly defined
			let varRef = astLocateVar(posNode.info.content, astNodeParent.context);
			if(posNode.info.line < varRef.line) {
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_UNDEFINED_VAR.format(posNode.info.content, posNode.info.line, posNode.info.offset));
			} else if(posNode.info.line == varRef.line) {
				if(posNode.info.offset < varRef.offset) {
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_UNDEFINED_VAR.format(posNode.info.content, posNode.info.line, posNode.info.offset));
				}
			}
		}
	}
	
	funcAccessCheck(parseNode, astNodeParent, semantica) {
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].funcName);
		
		//Check if function exists
		if(!this.existsFunc(funcNodeName.info.content)) {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_UNDEFINED_FUNC.format(funcNodeName.info.content, funcNodeName.info.line, funcNodeName.info.offset));
			return;
		}
		
		//Check params if exist
		let paramsNode = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].params);
		if(typeof paramsNode !== UNDEFINED) {
			this.astAccessCheck(paramsNode, astNodeParent);
		}
		
	}
	
	/****************
	FUNC RETURN CHECK
	****************/
	
	astFuncReturnCheck(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.FUNC_DEFINE:
						astNodeParent = parseNode.linkAst;
						this.funcReturnCheck(parseNode, astNodeParent, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astFuncReturnCheck(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	funcReturnCheck(parseNode, astNodeParent, semantica) {
		
		//Get function data
		let funcData = [];
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].returnData) {
				funcData = this.expConcatExtraction(parseNode.children[i], astNodeParent.context);	
			}
		}
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].funcName);
		
		//Check if return data has expected length
		let funcTypeNode = astNodeParent.children[1];
		let expTypes = this.expConcatTypes(funcData);
		if(expTypes.length != funcTypeNode.children.length) {
			//New error: return arguments total must match function requriements
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_RETURN_AMOUNT_MISSMATCH.format(funcNodeName.info.content));
			return;
		}
		
		//Check every data type
		for(let i = 0; i < funcData.length; i++) {
			if(expTypes[i] != funcTypeNode.children[i].info.type) {
				//New error: return arguments must match function return type requriements
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_RETURN_TYPE_MISSMATCH.format(funcNodeName.info.content, i));
				return;
			}
		}
		
		//Append data
		astNodeParent.children[3].children.push(...funcData);
		
	}
	
	expConcatTypes(expConcat) {
	
		//Get real length
		let expTypes = [];
		for(let i = 0; i < expConcat.length; i++) {
			//Check if is a group of expressions
			if(expConcat[i].dataType == EXP_SPECIAL_KEYS.GROUP) {
				let funcCallNode = locateExpFunc(expConcat[i]);
				expTypes.push(...funcCallNode.multiType);
			} else {
				expTypes.push(expConcat[i].dataType);
			}
		}
	
		return expTypes;
	
	}
	
	expConcatExtraction(parseNode, context) {
		
		//Check if is a production
		let expConcat = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsExpGroup = typeof semantica[SEMANTICA_KEYS.EXP_SEPARATION] !== UNDEFINED;
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsExpGroup && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.EXP_SEPARATION].expGroup) {
					expConcat.push(this.expExtraction(parseNode.children[i], context));
				} else {
					expConcat.push(...this.expConcatExtraction(parseNode.children[i], context));
				}
			}
		
		}
	
		return expConcat;
	
	}
	
	expExtraction(parseNode, context) {
		
		//Check if is a production
		let exp = null;
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.UNARY_EXPRESSION:
						exp = this.expUnaryExpression(parseNode, semantica, context);
						break;
						
					case SEMANTICA_KEYS.EXPRESSION:
						exp = this.expExpression(parseNode, semantica, context);
						break;
						
					case SEMANTICA_KEYS.VALUE:
						exp = this.expValue(parseNode, semantica, context);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					exp = this.expExtraction(parseNode.children[i], context);	//Only 1 valid child, always
				}
			}
		
		}
		
		return exp;
		
	}
	
	expUnaryExpression(parseNode, semantica, context) {
		
		//Get info nodes
		let expNode = parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.UNARY_EXPRESSION].exp);
		let opNode = parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.UNARY_EXPRESSION].operator);
		
		//Process expression and operator
		let exp = this.expExtraction(expNode, context);
		let operator = null;
		if(typeof opNode !== UNDEFINED) {
			operator = this.operatorExtraction(opNode);
		}
		
		//Check if went ok
		if(exp == null) {
			//Already notified error
			return null;
		}
		
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Append expression
		exp.lineStart = firstTerm.info.line;
		exp.lineEnd = lastTerm.info.line;
		exp.offsetStart = firstTerm.info.offset;
		exp.offsetEnd = lastTerm.info.offset + lastTerm.info.content.length - 1;
		
		//Check expressions type
		let typeMatch = this.unaryExpMatch(exp, operator != null, semantica[SEMANTICA_KEYS.UNARY_EXPRESSION].typeOptions);
		if(typeMatch == null) {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_EXP_MISSMATCH.format(firstTerm.info.line, firstTerm.info.offset));
			return null;
		}
		
		//Create unary expression node
		let unaryExpNode = {
			type: AST_NODE.EXPRESSION,
			dataType: typeMatch,
			prio: false,
			children: [
				exp
			]
		};
		if(operator != null) {
			unaryExpNode.operation = operator;
		} else {
			unaryExpNode = exp;
		}
		return unaryExpNode;
		
	}
	
	expExpression(parseNode, semantica, context) {
		
		//Get expressions
		let mainNode = parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.EXPRESSION].mainExp);
		let subNode = parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.EXPRESSION].subExp);
		
		//Process expressions if exists
		let mainExp = this.expExtraction(mainNode, context);
		let operation = null;
		if(typeof subNode !== UNDEFINED) {
			operation = this.operationExtraction(subNode, context);
		}
		
		//Check if went ok
		if(mainExp == null) {
			//Already notified error
			return null;
		}
		
		//Get first and last terminal (error related info)
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Check expressions type
		let typeMatch = this.expMatch(mainExp, operation == null ? null : operation.exp, semantica[SEMANTICA_KEYS.EXPRESSION].typeOptions);
		if(typeMatch == null) {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_EXP_MISSMATCH.format(firstTerm.info.line, firstTerm.info.offset));
			return null;
		}
		
		//Create expression node
		let expNode = {
			type: AST_NODE.EXPRESSION,
			dataType: typeMatch,
			prio: false,
			children: [
				mainExp
			],
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1
		};
		if(operation != null) {
			expNode.operation = operation.op;
			expNode.children.push(operation.exp);
			expNode = this.expLeftify(this.expRightify(expNode));
		} else {
			expNode = mainExp;
		}
		return expNode;
		
	}
	
	unaryExpMatch(exp, opExists, rules) {
		
		//Get data types
		let expType = exp.dataType;
		
		//Check every rule
		for(let i = 0; i < rules.length; i++) {
			let rule = rules[i];
			if(rule.exp == expType && rule.opExists == opExists) {
				return rule.type;
			}
		}
		
		//Invalid data types
		return null;
		
	}
	
	expMatch(mainExp, subExp, rules) {
		
		//Get data types
		let mainType = [mainExp.dataType];
		let subType = subExp == null ? null : subExp.dataType;
		
		//Check every rule
		for(let i = 0; i < rules.length; i++) {
			let rule = rules[i];
			if(rule.mainExp == mainType && rule.subExp == subType) {
				return rule.type;
			}
		}
		
		//Invalid data types
		return null;
		
	}
	
	operationExtraction(parseNode, context) {
		
		//Check if is a production
		let operation = null;
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.OPERATION:
						operation = this.expOperation(parseNode, semantica, context);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					operation = this.operationExtraction(parseNode.children[i], context);	//Only 1 valid child, always
				}
			}
		
		}
		
		return operation;
		
	}
	
	expOperation(parseNode, semantica, context) {
		
		//Get expression
		let expression = this.expExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.OPERATION].expression), context);
		
		//Check if went ok
		if(expression == null) {
			//Already notified error
			return null;
		}
		
		//Get operator
		let opKey = Object.keys(semantica[SEMANTICA_KEYS.OPERATION].operatorPair)[0];
		let operation = semantica[SEMANTICA_KEYS.OPERATION].operatorPair[opKey];
		if(operation == null) {
			operation = this.operatorExtraction(parseNode.children.find(child => child.production_id == opKey));
		}
		
		//Return obtained data
		return {
			exp: expression,
			op: operation
		};
		
	}
	
	operatorExtraction(parseNode) {
		
		//Check if is a production
		let operator = null;
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.OPERATOR:
						operator = this.expOperator(parseNode, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					operator = this.operatorExtraction(parseNode.children[i]);	//Only 1 valid child, always
				}
			}
		
		}
		
		return operator;
		
	}
	
	expOperator(parseNode, semantica) {
		
		//Get operator pairs
		let opPairs = semantica[SEMANTICA_KEYS.OPERATOR].operatorPairs;
		
		//Get operator
		for(let i = 0; i < opPairs.length; i++) {
			if(typeof parseNode.children.find(child => child.production_id == Object.keys(opPairs[i])[0]) !== UNDEFINED) {
				return opPairs[i][Object.keys(opPairs[i])[0]];
			}
		}
		
		//Operator not found (never happens!)
		return null;
		
	}
	
	expValue(parseNode, semantica, context) {
		
		//Get value pairs
		let valuePairs = semantica[SEMANTICA_KEYS.VALUE].typePairs;
		
		//Locate value
		for(let i = 0; i < valuePairs.length; i++) {
			let key = Object.keys(valuePairs[i])[0];
			let foundNode = parseNode.children.find(child => child.production_id == key);
			if(typeof foundNode !== UNDEFINED) {
				
				//Get first and last terminals
				let firstTerm = this.terminalFirst(foundNode);
				let lastTerm = this.terminalLast(foundNode);
				
				//Process value
				switch(valuePairs[i][key]) {
					
					case EXP_SPECIAL_KEYS.EXP:
						let parenthesisExp = this.expExtraction(foundNode, context);
						if(parenthesisExp != null) {
							parenthesisExp.prio = true;
						}
						return parenthesisExp;
						
					case EXP_SPECIAL_KEYS.FUNC:
					
						//Get func info (existance previously checked)
						let funcRef = this.funcCallExtraction(foundNode, context);
						let funcType = this.funcReturnType(funcRef, false);
						let semantica = this.grammarMap[foundNode.production_id].semantica;
						let funcNodeName = foundNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].funcName);
						
						//Check null return
						if(funcType == null) {
							//Null function return used on expression
							this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_EXP_CALL_NULL.format(funcNodeName.info.content, funcNodeName.info.line, funcNodeName.info.offset));
							return null;
						}
						
						//Check function params
						let paramsData = this.funcCallParamsCheck(foundNode, context);
						if(paramsData == null) {
							return null;	//Error already registered
						}
						
						//Return info
						return {
							type: AST_NODE.FUNC_EXP,
							lineStart: firstTerm.info.line,
							lineEnd: lastTerm.info.line,
							offsetStart: firstTerm.info.offset,
							offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
							dataType: funcType,
							multiType: this.funcReturnType(funcRef, true),
							ref: funcRef.funcName,
							call: funcNodeName.info,
							prio: false,
							children: paramsData
						};
						
					case EXP_SPECIAL_KEYS.ID:
					
						//Get var info (existance previously checked)
						let varRef = astLocateVar(foundNode.info.content, context);
						
						//Check data type
						if(varRef.type == null) {
							//Undefined var type (implicit declaration in same assign)
							let varInfo = foundNode.info;
							this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_EXP_NULL_VAR.format(varInfo.content, varInfo.line, varInfo.offset));
							return null;
						}
						
						return {
							type: AST_NODE.ID,
							dataType: varRef.type,
							ref: varRef,
							lineStart: firstTerm.info.line,
							lineEnd: lastTerm.info.line,
							offsetStart: firstTerm.info.offset,
							offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
							prio: false
						};
						
					default:
						return {
							type: AST_NODE.VALUE,
							dataType: valuePairs[i][foundNode.production_id],
							value: foundNode.info,
							lineStart: firstTerm.info.line,
							lineEnd: lastTerm.info.line,
							offsetStart: firstTerm.info.offset,
							offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
							prio: false
						};
						
				}
			}
		}
		
	}
	
	funcCallExtraction(parseNode, context) {
		
		//Check if is a production
		let funcRef = null;
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.FUNC_CALL:
						//Get function reference
						let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].funcName);
						funcRef = this.referenceToFunc(funcNodeName.info.content);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					funcRef = this.funcCallExtraction(parseNode.children[i], context);	//Only 1 valid child, always
				}
			}
			
		}
		
		return funcRef;
		
	}
	
	funcReturnType(funcRef, complete) {
		
		//Get return types
		let funcTypes = funcRef.children[1].children;
		
		//Check if has any return
		if(funcTypes.length == 0) {
			return null;
		}
		
		//Check if has multiple return
		if(funcTypes.length > 1) {
			if(complete) {
				let types = [];
				for(let i = 0; i < funcTypes.length; i++) {
					types.push(funcTypes[i].info.type);
				}
				return types;
			} else {
				return EXP_SPECIAL_KEYS.GROUP;
			}
		}
		
		//Single return
		return funcTypes[0].info.type;
		
	}
	
	funcCallParamsCheck(parseNode, context) {
		
		//Get production semantica
		let semantica = this.grammarMap[parseNode.production_id].semantica;
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].funcName);
		
		//Get function params
		let paramsNode = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].params);
		let paramsData = [];
		if(typeof paramsNode !== UNDEFINED) {
			paramsData = this.expConcatExtraction(paramsNode, context);
		}
		
		//Get function params type
		let funcRef = this.referenceToFunc(funcNodeName.info.content);
		let funcParamTypes = this.funcParamsType(funcRef);
		
		//Check if params has expected length
		let expTypes = this.expConcatTypes(paramsData);
		if(expTypes.length != funcParamTypes.length) {
			//New error: arguments total must match function requriements
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_CALL_ARG_AMOUNT_MISSMATCH.format(funcNodeName.info.content, funcNodeName.info.line, funcNodeName.info.offset));
			return null;
		}
		
		//Check if params has expected type
		for(let i = 0; i < expTypes.length; i++) {
			if(expTypes[i] != funcParamTypes[i]) {
				//New error: argument types must match function requriements
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_CALL_ARG_TYPE_MISSMATCH.format(funcNodeName.info.content, funcNodeName.info.line, funcNodeName.info.offset, i));
				return null;
			}
		}
		
		return paramsData;
		
	}
	
	/****************
	EXPRESSIONS CHECK
	****************/

	astExpressionCheck(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						astNodeParent = parseNode.linkAst;
						this.varAssignExp(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FORK:
						astNodeParent = parseNode.linkAst;
						this.forkExp(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.LOOP:
						astNodeParent = parseNode.linkAst;
						this.loopExp(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_CALL:
						astNodeParent = parseNode.linkAst;
						this.funcCallExp(parseNode, astNodeParent, semantica);
						break;
						
					default:
						continueSearch = true;
						break;
						
				}
			}
			
			//Check if no key was found
			if(Object.keys(semantica).length == 0 || continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.astExpressionCheck(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	varAssignExp(parseNode, astNodeParent, semantica) {
		
		//Get value data
		let valueData = [];
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.VAR_ASSIGN].values) {
				valueData = this.expConcatExtraction(parseNode.children[i], astNodeParent.context);
			}
		}
		
		//Check if data has expected length
		let singleVarGroupNode = astNodeParent.children[0];
		let expTypes = this.expConcatTypes(valueData);
		if(expTypes.length != singleVarGroupNode.children.length) {
			//New error: arguments total must match var assign requriements
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_ASSIGN_AMOUNT_MISSMATCH.format(singleVarGroupNode.children[0].children[0].line, singleVarGroupNode.children[0].children[0].offset));
			return;
		}
		
		//Assign data type to implicit declared vars
		for(let i = 0; i < singleVarGroupNode.children.length; i++) {
			let iVarList = singleVarGroupNode.children[i];
			for(let j = 0; j < iVarList.children.length; j++) {
				//Get var ref
				let varRef = astLocateVar(iVarList.children[j].content, astNodeParent.context);
				if(varRef.type == null) {
					varRef.type = expTypes[i];
				}
				iVarList.children[j].type = varRef.type;
			}
		}
		
		//Check every data type
		for(let i = 0; i < valueData.length; i++) {
			//Check null type (implicit var define)
			let varRef = astLocateVar(singleVarGroupNode.children[i].children[0].content, astNodeParent.context);
			if(expTypes[i] != varRef.type) {
				//New error: var assign arguments must match var type requriements
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_ASSIGN_TYPE_MISSMATCH.format(singleVarGroupNode.children[0].children[0].line, singleVarGroupNode.children[0].children[0].offset, i));
				return;
			}
		}
		
		//Get first and last terminals
		let firstTerm = this.terminalFirst(parseNode);
		let lastTerm = this.terminalLast(parseNode);
		
		//Create value assign node
		let valueAssignNode = {
			type: AST_NODE.INFO_HEADER,
			lineStart: firstTerm.info.line,
			lineEnd: lastTerm.info.line,
			offsetStart: firstTerm.info.offset,
			offsetEnd: lastTerm.info.offset + lastTerm.info.content.length - 1,
			children: []
		};
		astNodeParent.children.push(valueAssignNode);
		
		//Append data
		valueAssignNode.children.push(...valueData);
		
	}
	
	forkExp(parseNode, astNodeParent, semantica) {
		
		//Get condition data
		let conditionData = [];
		let firstTerm;
		let lastTerm;
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FORK].condition) {
				conditionData.push(this.expExtraction(parseNode.children[i], astNodeParent.context));
				firstTerm = this.terminalFirst(parseNode.children[i]);
				lastTerm = this.terminalLast(parseNode.children[i]);
			}
		}
		
		//Check if is a valid expression
		if(conditionData[0] == null) {
			return;	//Already notified error
		}
		
		//Check if data has expected length (1)
		let expTypes = this.expConcatTypes(conditionData);
		if(expTypes.length != 1) {
			//New error: arguments total must match if requirements
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_FORK_ARG_AMOUNT_MISSMATCH.format(firstTerm.info.line, firstTerm.info.offset));
			return;
		}
		
		//Check data type
		if(expTypes[0] != DATA_TYPES.BOOL) {
			//New error: argument must be boolean
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_FORK_ARG_TYPE_MISSMATCH.format(firstTerm.info.line, firstTerm.info.offset));
			return;
		}
		
		//Update condition data
		conditionData[0].lineStart = firstTerm.info.line;
		conditionData[0].lineEnd = lastTerm.info.line;
		conditionData[0].offsetStart = firstTerm.info.offset;
		conditionData[0].offsetEnd = lastTerm.info.offset + lastTerm.info.content.length - 1;
		
		//Append data
		astNodeParent.children[0].children.push(...conditionData);
		
		//Continue analyzing content
		for(let i = 0; i < parseNode.children.length; i++) {
			for(let j = 0; j < semantica[SEMANTICA_KEYS.FORK].cases.length; j++) {
				if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FORK].cases[j]) {
					this.astExpressionCheck(parseNode.children[i], astNodeParent);
				}
			}
		}
		
	}
	
	loopExp(parseNode, astNodeParent, semantica) {
		
		//Get condition data
		let conditionData = [];
		let firstTerm;
		let lastTerm;
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.LOOP].condition) {
				conditionData.push(this.expExtraction(parseNode.children[i], astNodeParent.context));
				firstTerm = this.terminalFirst(parseNode.children[i]);
				lastTerm = this.terminalLast(parseNode.children[i]);
			}
		}
		
		//Check if is a valid expression
		if(conditionData[0] == null) {
			return;	//Already notified error
		}
		
		//Check if data has expected length (1)
		let expTypes = this.expConcatTypes(conditionData);
		if(expTypes.length != 1) {
			//New error: arguments total must match while requirements
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_LOOP_ARG_AMOUNT_MISSMATCH.format(firstTerm.info.line, firstTerm.info.offset));
			return;
		}
		
		//Check data type
		if(expTypes[0] != DATA_TYPES.BOOL) {
			//New error: argument must be boolean
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, ERROR_LOOP_ARG_TYPE_MISSMATCH.format(firstTerm.info.line, firstTerm.info.offset));
			return;
		}
		
		//Update condition data
		conditionData[0].lineStart = firstTerm.info.line;
		conditionData[0].lineEnd = lastTerm.info.line;
		conditionData[0].offsetStart = firstTerm.info.offset;
		conditionData[0].offsetEnd = lastTerm.info.offset + lastTerm.info.content.length - 1;
		
		//Append data
		astNodeParent.children[0].children.push(...conditionData);
		
		//Continue analyzing content
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.LOOP].code) {
				this.astExpressionCheck(parseNode.children[i], astNodeParent);
			}
		}
		
	}
	
	terminalFirst(node) {
		//Check if is a production
		if(node.type == NODE_TYPE.PRODUCTION) {
			return this.terminalFirst(node.children[0]);
		} else {
			return node;
		}
	}
	
	terminalLast(node) {
		//Check if is a production
		if(node.type == NODE_TYPE.PRODUCTION) {
			return this.terminalLast(node.children[node.children.length - 1]);
		} else {
			return node;
		}
	}
	
	funcCallExp(parseNode, astNodeParent, semantica) {
		
		//Check if is part of an expression
		if(this.isExpFunc(parseNode)) {
			return;
		}
		
		//Get function params
		let paramsData = this.funcCallParamsCheck(parseNode, astNodeParent.context);
		
		//Append params if valid
		if(paramsData != null) {
			astNodeParent.children.push(...paramsData);
		}
		
	}
	
	isExpFunc(parseNode) {
		
		//Check current node semantica
		let semantica = this.grammarMap[parseNode.production_id].semantica;
		if(typeof semantica[SEMANTICA_KEYS.EXPRESSION] !== UNDEFINED) {
			return true;
		}
		
		//Check if has parent node
		if(parseNode.parentNode != null) {
			return this.isExpFunc(parseNode.parentNode);
		}
		
		//It isn't part of an expression
		return false;
		
	}
	
	existsFunc(funcName) {
		if(this.isSysFunc(funcName)) {
			return true;
		} else {
			return typeof this.funcAstTree[funcName] !== UNDEFINED;
		}
	}
	
	funcParamsType(funcRef) {
		
		//Get param node
		let paramNode = funcRef.children[0];
		
		//Get every param type
		let paramTypes = [];
		for(let i = 0; i < paramNode.children.length; i++) {
			paramTypes.push(paramNode.children[i].info.type);
		}
		
		return paramTypes;
		
	}
	
	referenceToFunc(funcName) {
		if(this.isSysFunc(funcName)) {
			return this.sysFunc[funcName];
		} else {
			return this.funcAstTree[funcName];
		}
	}
	
	isSysFunc(funcName) {
		return typeof this.sysFunc[funcName] !== UNDEFINED;
	}
	
	expRightify(expNode) {
		
		//Check if left expression is final
		if(expNode.children[0].type == AST_NODE.EXPRESSION) {
			//Check prio
			if(!expNode.children[0].prio) {
				//Check same level operation
				if(OP_LVL[expNode.operation] == OP_LVL[expNode.children[0].operation]) {
					
					//Copy left expression
					let newExp = this.expRightify(expNode.children[0]);
					
					//Find last operation
					let lastRight = this.expRightifyLast(newExp, expNode.operation);
					
					//Create new last operation
					let newLast = {...expNode};
					newLast.children[0] = lastRight.children[1];
					
					//Replace last operation and base expression
					lastRight.children[1] = newLast;
					expNode = newExp;
					
				}
			}
		}
		
		//Check if right expression is final
		if(expNode.children[1].type == AST_NODE.EXPRESSION) {
			//Check prio
			if(!expNode.children[1].prio) {
				//Check same level operation
				if(OP_LVL[expNode.operation] == OP_LVL[expNode.children[1].operation]) {
					expNode.children[1] = this.expRightify(expNode.children[1]);
				}
			}
		}
		
		//Rightify right branch
		return expNode;
		
	}
	
	expRightifyLast(expNode, prevOp) {
		if(expNode.type == AST_NODE.EXPRESSION) {
			if(!expNode.prio) {
				if(OP_LVL[expNode.operation] == OP_LVL[prevOp]) {
					let nextExp = this.expRightifyLast(expNode.children[1], expNode.operation);
					if(nextExp == null) {
						return expNode;
					} else {
						return nextExp;
					}
				}
			} else {
				return expNode;
			}
		} else {
			return null;
		}
	}
	
	expLeftify(expNode) {
		
		//Check if right expression is final
		if(expNode.children[1].type == AST_NODE.EXPRESSION) {
			//Check prio
			if(!expNode.children[1].prio) {
				//Check same level operation
				if(OP_LVL[expNode.operation] == OP_LVL[expNode.children[1].operation]) {
					
					//Copy left expression
					let newExp = this.expLeftify(expNode.children[1]);
					
					//Find last operation
					let lastLeft = this.expLeftifyLast(newExp, expNode.operation);
					
					//Create new last operation
					let newLast = {...expNode};
					newLast.children[1] = lastLeft.children[0];
					
					//Replace last operation and base expression
					lastLeft.children[0] = newLast;
					expNode = newExp;
					
				}
			}
		}
		
		//Check if left expression is final
		if(expNode.children[0].type == AST_NODE.EXPRESSION) {
			//Check prio
			if(!expNode.children[0].prio) {
				//Check same level operation
				if(OP_LVL[expNode.operation] == OP_LVL[expNode.children[0].operation]) {
					expNode.children[0] = this.expLeftify(expNode.children[0]);
				}
			}
		}
		
		//Rightify right branch
		return expNode;
		
	}
	
	expLeftifyLast(expNode, prevOp) {
		if(expNode.type == AST_NODE.EXPRESSION) {
			if(!expNode.prio) {
				if(OP_LVL[expNode.operation] == OP_LVL[prevOp]) {
					let nextExp = this.expRightifyLast(expNode.children[0], expNode.operation);
					if(nextExp == null) {
						return expNode;
					} else {
						return nextExp;
					}
				}
			} else {
				return expNode;
			}
		} else {
			return null;
		}
	}
	
}
