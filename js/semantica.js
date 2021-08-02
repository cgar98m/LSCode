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
	VAR: "var",
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

class Semantica {
	
	constructor(grammarMap, errorHandler) {
		
		//Keep grammar
		this.grammarMap = grammarMap;
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Empty ast tree
		this.astTree = null;
		
	}
	
	//TODO
	generateAst(parseTree) {
		
		//Create global and funcs context
		this.globalContext = {
			vars: {},
			parentContext: null
		};
		this.funcContext = [];
		
		//Create root AST node
		this.astTree = {
			type: AST_NODE.STRUCT,
			context: this.globalContext,
			children: []
		}
		
		//Navigate parse tree to generate AST
		this.#parseTreeToAstTree(parseTree, this.astTree);		
		
	}
	
	clear() {
		this.astTree = null;
	}
	
	#parseTreeToAstTree(parseNode, astNodeParent) {
		//Check if is a production
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Check every semantica key
			let tmp = true;
			for(let key in semantica) {
				switch(key) {
						
					case SEMANTICA_KEYS.NEW_CONTEXT:
						this.#newContext(parseNode, astNodeParent);
						tmp = false;
						break;
						
					case SEMANTICA_KEYS.VAR_DEFINE:
						this.#varDefine(parseNode, astNodeParent, semantica);
						tmp = false;
						break;
						
					/*case SEMANTICA_KEYS.VAR:
						break;*/
						
					/*case SEMANTICA_KEYS.TYPE:
						break;*/
						
					case SEMANTICA_KEYS.VAR_ASSIGN:
						this.#varAssign(parseNode, astNodeParent, semantica);
						tmp = false;
						break;
						
					/*case SEMANTICA_KEYS.VAR_SEPARATION:
						break;*/
						
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
			if(Object.keys(semantica).length == 0 || tmp) {
				//Process all children
				for(let i = 0; i < parseNode.children.length; i++) {
					this.#parseTreeToAstTree(parseNode.children[i], astNodeParent);
				}
			}
			
		}
	}
	
	#newContext(parseNode, astNodeParent) {
			
		//Create new node and context
		let contextNode = {
			type: AST_NODE.STRUCT,
			context: {
				vars: {},
				parentContext: astNodeParent.context
			},
			children: []
		};
		
		//Append node to AST tree
		astNodeParent.children.push(contextNode);
		
		//Continue processing
		for(let i = 0; i < parseNode.children.length; i++) {
			this.#parseTreeToAstTree(parseNode.children[i], contextNode);
		}
		
	}
	
	#varDefine(parseNode, astNodeParent, semantica) {
		
		//Extract vars
		let varList = this.#varExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_DEFINE].vars));
		
		//Extract type
		let type = this.#typeExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_DEFINE].type));
		
		//Create var define node
		let varDefineNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			context: astNodeParent.context,
			children: []
		};
		astNodeParent.children.push(varDefineNode);
		
		//Create vars in symbolic table
		let visitedVars = [];
		let varsNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		varDefineNode.children.push(varsNode);
		for(let i = 0; i < varList.length; i++) {
			
			//Get var info
			let varInfo = varList[i];
			
			//Check if var was already visited
			if(visitedVars.find(item => item.content == varInfo.content)) {
				//Duplicated definition
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.WARNING, "Duplicated var definition in line " + varInfo.line + ", char " + varInfo.offset + " ==> \"" + varInfo.content + "\"");
				continue;
			}
			
			//Update sym table and visited vars
			let varDef = {
				type: AST_NODE.INFO,
				info: varInfo
			};
			varDef.info.type = null;
			varDef.info.value = null;
			
			//Check if var already exists
			if(!this.#existsVar(varInfo.content, varDefineNode.context)) {
				astNodeParent.context.vars[varInfo.content] = varDef;
				visitedVars.push(varInfo);
			}
			
			//Append to action node
			varsNode.children.push(varDef);
			
		}
		
		//Append type to action node
		let typesNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		varDefineNode.children.push(typesNode);
		typesNode.children.push(type);
		
	}
	
	#varAssign(parseNode, astNodeParent, semantica) {
		
		//Extract var groups
		let varConcat = this.#varConcatExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_ASSIGN].varConcat));
		
		//Extract values
		let values = this.#valuesExtraction(parseNode.children.find(child => child.production_id == semantica[SEMANTICA_KEYS.VAR_ASSIGN].values));
		
		//Create var assign node
		let varAssignNode = {
			type: AST_NODE.ACTION,
			semantica: Object.keys(semantica)[0],
			context: astNodeParent.context,
			children: []
		};
		
		//Check same length on vars and values
		/*values = [{
			data: 2
		},
		{
			data: 3
		}];*/
		for(let i = 0; i < varConcat.length; i++) {
			let varGroup = varConcat[i];
			if(varGroup.length != values.length) {
				this.errorHandler.newError(ERROR_FONT.SEMANTICA, ERROR_TYPE.ERROR, "Var group amount differs on assign values amount in line " + varGroup[0].line + ", char " + varGroup[0].offset);
				return;
			}
		}
		
		//Append action node to parent (no critical error was found)
		astNodeParent.children.push(varAssignNode);
		
		//Create vars in symbolic table if don't exist
		for(let i = 0; i < varConcat.length; i++) {
			for(let j = 0; j < varConcat[i].length; j++) {
				
				//Get var info
				let varInfo = varConcat[i][j];
				
				//Check if var already exists
				if(!this.#existsVar(varInfo.content, varAssignNode.context)) {
					
					//Update sym table
					let varDef = {
						type: AST_NODE.INFO,
						info: varInfo
					};
					varDef.info.type = null;
					varDef.info.value = null;
					astNodeParent.context.vars[varInfo.content] = varDef;
					
					//TODO: Create implicit type conversion action
					
				}
				
			}
		}
		
		//Create separated vars depending on position
		let varAssignVarsNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		varAssignNode.children.push(varAssignVarsNode);
		let varAssignValuesNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		varAssignNode.children.push(varAssignValuesNode);
		for(let i = 0; i < values.length; i++) {
			
			//Update value node
			varAssignValuesNode.children.push(values[i]);
			
			//Update vars node
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
	
	#valuesExtraction(parseNode) {
		
		//Check if is a production
		let expConcat = [];
		if(parseNode.type == NODE_TYPE.PRODUCTION) {
			
			//Get production semantica
			let semantica = this.grammarMap[parseNode.production_id].semantica;
			
			//Process all children
			let existsExpGroup = typeof semantica[SEMANTICA_KEYS.EXP_SEPARATION] !== "undefined";
			for(let i = 0; i < parseNode.children.length; i++) {
				if(existsExpGroup && parseNode.children[i].production_id == semantica[SEMANTICA_KEYS.EXP_SEPARATION].expGroup) {
					
					//Get expression
					let expression = this.#expExtraction(parseNode.children[i]);
					
					//TODO: Check if is multiple return
					
					//Append expression
					expConcat.push(...expression);
					
				} else {
					expConcat.push(...this.#valuesExtraction(parseNode.children[i]));
				}
			}
		
		}
	
		return expConcat;
	
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
					let typeInfo = {
						type: AST_NODE.INFO,
						info: parseNode.children[i].info
					};
					typeInfo.info.type = typePairs.find(item => Object.keys(item)[0] == parseNode.children[i].production_id);
					return typeInfo;
				}
			}
			
		}
		
		return null;
		
	}
	
	#expExtraction(parseNode) {
	
		return [{
			data: 2
		}];
	
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
	
}
