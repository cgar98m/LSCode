const AST_NODE = {
	STRUCT: "struct",
	ACTION: "action",
	IMPLICIT_ACTION: "implicitAction",
	INFO_HEADER: "infoHeader",
	INFO: "info"
}
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
	EXPRESSION: "expression",
	OPERATION: "operation",
	OPERATOR: "operator",
	VALUE: "value"
}

const EXP_SPECIAL_KEYS = {
	EXP: "expression",
	FUNC: "return",
	ID: "id"
}

class Semantica {
	
	constructor(grammarMap, errorHandler) {
		
		//Keep grammar
		this.grammarMap = grammarMap;
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Clear strcuts
		this.clear();
		
	}
	
	clear() {
		
		//Empty context
		this.globalContext = {
			vars: {},
			parentContext: null
		};
		
		//Empty global and funcs context
		this.globalContext = {
			vars: {},
			parentContext: null
		};
		this.funcAstTree = [];
		
		//Create root AST node
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
		this.#astSkell(parseTree, this.astTree);
		
		//Var definition (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.#astVarsAlloc(parseTree, this.astTree);
		}
		
		//Func definition (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.#astFuncAlloc(parseTree, this.astTree);
		}
		
		//Vars/func calls existance check (stop on critical error)
		if(this.errorHandler.criticalErrors == 0) {
			this.#astAccessCheck(parseTree, this.astTree);
		}
		
	}
	
	/*******
	AST CORE
	*******/
	
	#astSkell(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						this.#varAssignSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FORK:
						this.#forkSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.LOOP:
						this.#loopSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_DEFINE:
						this.#funcDefineSkell(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_CALL:
						this.#funcCallSkell(parseNode, astNodeParent, semantica);
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
					this.#astSkell(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	#varAssignSkell(parseNode, astNodeParent, semantica) {
	
		//Create var assign node
		let varAssignNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			children: []
		};
		astNodeParent.children.push(varAssignNode);
		
		//Link parse node to ast
		parseNode.linkAst = varAssignNode;
	
	}
	
	#forkSkell(parseNode, astNodeParent, semantica) {
		
		//Create if node
		let ifNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
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
				this.#contextExtraction(prod, casesNode, astNodeParent.context);
			}
		}
		
	}
	
	#loopSkell(parseNode, astNodeParent, semantica) {
		
		//Create loop node
		let loopNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
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
				this.#contextExtraction(parseNode.children[i], codeNode, astNodeParent.context);
			}
		}
		
	}
	
	#funcDefineSkell(parseNode, astNodeParent, semantica) {
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].funcName);
		
		//Check if function exists
		if(typeof this.funcAstTree[funcNodeName.info.content] !== "undefined") {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Function re-defined in line " + funcNodeName.info.line + ", col " + funcNodeName.info.offset);
			return;
		}
		
		//Create function
		let funcNode = {
			type: AST_NODE.STRUCT,
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
		
		//Create empty return node
		let returnNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		funcNode.children.push(returnNode);
		
		//Create code node
		let codeNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		funcNode.children.push(codeNode);
		
		//Fill code node
		for(let i = 0; i < parseNode.children.length; i++) {
			if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_DEFINE].code) {
				this.#contextExtraction(parseNode.children[i], codeNode, astNodeParent.context);
			}
		}
		
	}
	
	#contextExtraction(parseNode, astNodeParent, context) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check if contains new context key
			if(typeof semantica[SEMANTICA_KEYS.NEW_CONTEXT] === "undefined") {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.#contextExtraction(parseNode.children[i], astNodeParent, context);
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
					this.#astSkell(parseNode.children[i], parseNode.linkAst);
				}
				
			}
			
		}
	}
	
	#funcCallSkell(parseNode, astNodeParent, semantica) {
		
		//Check if is part of a var assign
		if(this.#isAssignFunc(parseNode)) {
			return;
		}
		
		//Create func call node
		let funcCallNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			children: []
		};
		astNodeParent.children.push(funcCallNode);
		
		//Link parse node to ast
		parseNode.linkAst = funcCallNode;
		
	}
	
	#isAssignFunc(parseNode) {
		
		//Check current node semantica
		let semantica = this.grammarMap[parseNode.production_id].semantica;
		if(typeof semantica[SEMANTICA_KEYS.VAR_ASSIGN] !== "undefined") {
			return true;
		}
		
		//Check if has parent node
		if(parseNode.parentNode != null) {
			return this.#isAssignFunc(parseNode.parentNode);
		}
		
		//It isn't part of var assign
		return false;
		
	}
	
	/*************
	VAR DEFINITION
	*************/
	
	#astVarsAlloc(parseNode, astNodeParent) {
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
						
					case SEMANTICA_KEYS.VAR_DEFINE:
						this.#varDefineAlloc(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						this.#varAssignAlloc(parseNode, astNodeParent, semantica);
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
					this.#astVarsAlloc(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	#varDefineAlloc(parseNode, astNodeParent, semantica) {
		
		//Extract vars
		let varList = this.#varExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_DEFINE].vars));
		
		//Extract type
		let typeInfo = this.#typeExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_DEFINE].type));
		
		//Create vars in symbolic table
		for(let i = 0; i < varList.length; i++) {
			
			//Get var info
			let varInfo = varList[i];
			varInfo.type = typeInfo.type;
			
			//Check if var already exists
			if(this.#existsVar(varInfo.content, astNodeParent.context)) {
				//Check if is located in same context
				if(typeof astNodeParent.context.vars[varInfo.content] === "undefined") {
					//Var re-definition in different context accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, "Var definition in sub-context in line " + varInfo.line + ", col " + varInfo.offset + " ==> \"" + varInfo.content + "\"" + "\nProgram may not work as expected");
				} else {
					//Var re-definition in same context not accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Var re-definition in line " + varInfo.line + ", col " + varInfo.offset + " ==> \"" + varInfo.content + "\"");
					return;
				}
			}
			
			//Create var on symbolic table
			astNodeParent.context.vars[varInfo.content] = varInfo;
			
		}
		
	}
	
	#varAssignAlloc(parseNode, astNodeParent, semantica) {
		
		//Extract var groups
		let varConcat = this.#varConcatExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_ASSIGN].varConcat));
		
		//Get var assign node
		let varAssignNode = parseNode.linkAst;
		
		//Create vars in current context if don't exist
		for(let i = 0; i < varConcat.length; i++) {
			for(let j = 0; j < varConcat[i].length; j++) {
				
				//Get var info
				let varInfo = varConcat[i][j];
				
				//Check if var already exists
				if(!this.#existsVar(varInfo.content, astNodeParent.context)) {
					
					//Var creation notification
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, "Implicit global var definition in line " + varInfo.line + ", col " + varInfo.offset + " ==> \"" + varInfo.content + "\"" + "\nProgram may not work as expected");
					
					//Update sym table
					varInfo.type = null;	//Undefined value (depends on expression, which can contain itself --> mimics neighbour type)
					this.globalContext.vars[varInfo.content] = varInfo;
					
				}
				
			}
		}
		
		//Check same vars amount
		for(let i = 0; i < varConcat.length - 1; i++) {
			if(varConcat[i].length != varConcat[i + 1].length) {
				//Different var amount
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Different var amounts between assigns in line " + varConcat[0][0].line + ", col " + varConcat[0][0].offset);
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
	
	#varConcatExtraction(parseNode) {
	
		//Check if is a production
		let varConcat = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsVarGroup = typeof semantica[SEMANTICA_KEYS.VAR_SEPARATION] !== "undefined";
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsVarGroup && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.VAR_SEPARATION].varGroup) {
					varConcat.push(this.#varExtraction(parseNode.children[i]));
				} else {
					varConcat.push(...this.#varConcatExtraction(parseNode.children[i]));
				}
			}
		
		}
	
		return varConcat;
		
	}
	
	#varExtraction(parseNode) {
		
		//Check if is a production
		let varList = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsVar = typeof semantica[SEMANTICA_KEYS.VAR] !== "undefined";
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsVar && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.VAR].varName) {
					varList.push(parseNode.children[i].info);
				} else {
					varList.push(...this.#varExtraction(parseNode.children[i]));
				}
			}
			
		}
		
		return varList;
		
	}
	
	/**************
	FUNC DEFINITION
	**************/
	
	#astFuncAlloc(parseNode, astNodeParent) {
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
						this.#funcDefineAlloc(parseNode, astNodeParent, semantica);
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
					this.#astFuncAlloc(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	#funcDefineAlloc(parseNode, astNodeParent, semantica) {
		
		//Get function data
		let funcParams = [];
		let funcTypes = [];
		let funcReturn = [];
		for(let i = 0; i < parseNode.children.length; i++) {
			switch(parseNode.children[i].production_id) {
				
				case semantica[SEMANTICA_KEYS.FUNC_DEFINE].params:
					funcParams = this.#funcParamsExtraction(parseNode.children[i]);
					break;
					
				case semantica[SEMANTICA_KEYS.FUNC_DEFINE].returnType:
					funcTypes = this.#typeConcatExtraction(parseNode.children[i]);
					break;
					
				case semantica[SEMANTICA_KEYS.FUNC_DEFINE].returnData:
					funcReturn = this.#funcReturnExtraction(parseNode.children[i]);
					break;
					
			}
		}
		
		//Get func define node
		let funcVarDefineNode = astNodeParent.children[0];
		
		//Create vars in symbolic table
		for(let i = 0; i < funcParams.length; i++) {
			
			//Get var info
			let varInfo = funcParams[i];
			
			//Check if var already exists
			if(this.#existsVar(varInfo.content, astNodeParent.context)) {
				//Check if is located in same context
				if(typeof astNodeParent.context.vars[varInfo.content] === "undefined") {
					//Var re-definition in different context accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, "Var definition in sub-context in line " + varInfo.line + ", col " + varInfo.offset + " ==> \"" + varInfo.content + "\"" + "\nProgram may not work as expected");
				} else {
					//Var re-definition in same context not accepted
					this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Var re-definition in line " + varInfo.line + ", col " + varInfo.offset + " ==> \"" + varInfo.content + "\"");
					return;
				}
			}
			
			//Create var on symbolic table
			astNodeParent.context.vars[varInfo.content] = varInfo;
			
			//Create var node
			let funcVarDef = {
				type: AST_NODE.INFO,
				info: varInfo
			};
			funcVarDefineNode.children.push(funcVarDef);
			
		}
		
		
		
	}
	
	#funcParamsExtraction(parseNode) {
		
		//Check if is a production
		let funcParams = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let param;
			let existsFuncVar = typeof semantica[SEMANTICA_KEYS.FUNC_VAR] !== "undefined";
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsFuncVar) {
					if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_VAR].varName) {
						param = parseNode.children[i].info;
					} else if(parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.FUNC_VAR].type) {
						let typeInfo = this.#typeExtraction(parseNode.children[i]);
						param.type = typeInfo.type;
					}
				} else {
					funcParams.push(...this.#funcParamsExtraction(parseNode.children[i]));
				}
			}
			
			//Append param if exists
			if(existsFuncVar) {
				funcParams.push(param);
			}
			
		}
		
		return funcParams;
		
	}
	
	#typeConcatExtraction(parseNode) {
	
		//Check if is a production
		let typeConcat = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsTypeGroup = typeof semantica[SEMANTICA_KEYS.TYPE_SEPARATION] !== "undefined";
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsTypeGroup && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.TYPE_SEPARATION].typeGroup) {
					typeConcat.push(this.#typeExtraction(parseNode.children[i]));
				} else {
					typeConcat.push(...this.#typeConcatExtraction(parseNode.children[i]));
				}
			}
		
		}
	
		return typeConcat;
		
	}
	
	#typeExtraction(parseNode) {
		
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process type child
			if(typeof semantica[SEMANTICA_KEYS.TYPE] !== "undefined") {
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
	
	#funcReturnExtraction(parseNode) {
		//TODO
		return [];
	}
	
	/**************
	EXISTANCE CALLS
	**************/
	
	#astAccessCheck(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = false;
			for(let key in semantica) {
				switch(key) {
					
					case SEMANTICA_KEYS.VALUE:
						this.#valueExists(parseNode, astNodeParent, semantica);
						break;
						
					case SEMANTICA_KEYS.FUNC_CALL:
						this.#funcExists(parseNode, semantica);
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
					this.#astAccessCheck(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	#valueExists(parseNode, astNodeParent, semantica) {
		
		//Get all possible value list
		let posValues = semantica[SEMANTICA_KEYS.VALUE].typePairs;
		
		//Find associated value
		for(let i = 0; i < parseNode.children.length; i++) {
			let posNode = parseNode.children[i];
			for(let j = 0; j < posValues.length; j++) {
				if(typeof posValues[j][posNode.production_id] !== "undefined") {
					//Check what kind of value is
					if(posValues[j][posNode.production_id] == EXP_SPECIAL_KEYS.EXP) {
						this.#astAccessCheck(posNode, astNodeParent);
					} else if(posValues[j][posNode.production_id] == EXP_SPECIAL_KEYS.FUNC) {
						this.#astAccessCheck(posNode, astNodeParent);
					} else if(posValues[j][posNode.production_id] == EXP_SPECIAL_KEYS.ID) {
						this.#varAccesCheck(posNode, astNodeParent);
					}
				}
			}
		}
		
	}
	
	#varAccesCheck(posNode, astNodeParent) {
		//Check var existance
		if(!this.#existsVar(posNode.info.content, astNodeParent.context)) {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Access to undefined var in line " + posNode.info.line + ", col " + posNode.info.offset + " ==> \"" + posNode.info.content + "\"");
		}
	}
	
	#existsVar(varName, context) {
		
		//Check if var exists in current context
		if(typeof context.vars[varName] !== "undefined") {
			return true;
		}
		
		//Check parent contexts
		if(context.parentContext != null) {
			return this.#existsVar(varName, context.parentContext);
		}
		
		//Var not found
		return false;
		
	}
	
	#locateVar(varName, context) {
		
		//Check if var exists in current context
		if(typeof context.vars[varName] !== "undefined") {
			return context.vars[varName];
		}
		
		//Check parent contexts
		if(context.parentContext != null) {
			return this.#locateVar(varName, context.parentContext);
		}
		
		//Var not found
		return null;
		
	}
	
	#funcExists(parseNode, semantica) {
		
		//Get function name node
		let funcNodeName = parseNode.children.find(item => item.production_id == semantica[SEMANTICA_KEYS.FUNC_CALL].funcName);
		
		//Check if function exists
		if(typeof this.funcAstTree[funcNodeName.info.content] === "undefined") {
			this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Call to undefined function in line " + funcNodeName.info.line + ", col " + funcNodeName.info.offset + " ==> \"" + funcNodeName.info.content + "\"");
		}
		
	}
	
	/*#parseTreeToAstTree(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let continueSearch = true;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.NEW_CONTEXT:
						astNodeParent = parseNode.linkAst;
						break;
						
					case SEMANTICA_KEYS.VAR_DEFINE:
						this.#varDefine(parseNode, astNodeParent, semantica);
						continueSearch = false;
						break;
						
					case SEMANTICA_KEYS.VAR:
						break;
					case SEMANTICA_KEYS.TYPE:
						break;
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						this.#varAssign(parseNode, astNodeParent, semantica);
						continueSearch = false;
						break;
						
					case SEMANTICA_KEYS.VAR_SEPARATION:
						break;
					case SEMANTICA_KEYS.FORK:
						break;
					case SEMANTICA_KEYS.LOOP:
						break;
					case SEMANTICA_KEYS.FUNC_DEFINE:
						break;
					case SEMANTICA_KEYS.FUNC_VAR:
						break;
					case SEMANTICA_KEYS.TYPE_SEPARATION:
						break;
					case SEMANTICA_KEYS.FUNC_CALL:
						break;
					case SEMANTICA_KEYS.EXP_SEPARATION:
						break;
					case SEMANTICA_KEYS.EXPRESSION:
						break;
					case SEMANTICA_KEYS.OPERATION:
						break;
					case SEMANTICA_KEYS.OPERATOR:
						break;
					case SEMANTICA_KEYS.VALUE:
						break;
				}
			}
			
			//Check if no key was found
			if(continueSearch) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.#parseTreeToAstTree(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}*/
	
}
