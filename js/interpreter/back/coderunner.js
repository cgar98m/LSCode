const LOOP_TIMEOUT = 5000;

class CodeRunner {
	
	constructor(astSys, astFunc, globalContext, console) {
		this.astSys = astSys;
		this.astFunc = astFunc;
		this.globalContext = globalContext;
		this.console = console;
	}
	
	runFunction(funcRef) {
		
		//Check if is a system function
		if(typeof this.astSys[funcRef.funcName] !== UNDEFINED) {
			return this.runSysFunction(funcRef);
		}
		
		//Run non-return actions
		let funcActions = funcRef.children[2].children;
		if(funcActions.length > 0) {
			if(!this.runFuncCode(funcActions[0])) {
				return [null];
			}
		}
		
		return this.runReturn(funcRef);
		
	}

	runSysFunction(funcRef) {
		//All prints: switch useful in the future, useless otherwise
		switch(funcRef.funcName) {
			
			case SYS_FUNC.CHAR:
				if(this.console != null) {
					this.console.displayMsg(String.fromCharCode(funcRef.context.vars.msg.value), true);
				}
				return [];
				
			case SYS_FUNC.INT:
			case SYS_FUNC.BOOL:
			case SYS_FUNC.STRING:
				if(this.console != null) {
					this.console.displayMsg(funcRef.context.vars.msg.value, true);
				}
				return [];
				
			default:	//Undefined
				return [null];
				
		}
	}

	runFuncCode(node) {
			
		//Run every action
		for(let i = 0; i < node.children.length; i++) {
			//Check action
			switch(node.children[i].semantica) {
		
				case SEMANTICA_KEYS.VAR_ASSIGN:
					if(!this.runVarAssign(node.children[i])) {
						return false;
					}
					break;
					
				case SEMANTICA_KEYS.FORK:
					let forkResp = this.runFork(node.children[i], null, null);
					if(forkResp == null || !forkResp) {
						return false;
					}
					break;
					
				case SEMANTICA_KEYS.LOOP:
					let loopResp = this.runLoop(node.children[i], null, null);
					if(loopResp == null || !loopResp) {
						return false;
					}
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					let returnValue = this.runFuncCall(node.children[i], node.children[i].context);
					for(let i = 0; i < returnValue.length; i++) {
						if(returnValue[i] == null) {
							return false;
						}
					}
					break;
					
				default:	//Undefined case
					return false;
					
			}
		}
		
		//All ok
		return true;
		
	}

	runVarAssign(node) {
			
		//Get vars and expressions
		let vars = node.children[0];
		let exps = node.children[1];
		
		//Evaluate expressions
		let results = [];
		for(let i = 0; i < exps.children.length; i++) {
			results.push(...this.evalExp(exps.children[i], node.context));
		}
		
		//Assign expressions to correspondant var
		let curVar = 0;
		for(let i = 0; i < results.length; i++) {
				
			//Check invalid result
			if(results[i] == null) {
				return false;
			}
			
			//Assign value to vars
			for(let j = 0; j < vars.children[curVar].children.length; j++) {
				let varRef = astLocateVar(vars.children[curVar].children[j].content, node.context);
				varRef.value = results[i];
			}
			
			//Next var
			curVar++;
		
		}
		
		//All ok
		return true;
		
	}

	runFork(node, altCodeFunc, obj) {
			
		//Get condition and cases
		let condition = node.children[0].children[0];
		let cases = node.children[1];
		
		//Eval condition
		let results = this.evalExp(condition, node.context);
		if(results[0] == null) {
			return null;
		}
		
		//Load correspondant case
		let expectedCase = results[0] ? 0 : 1;
		for(let i = 0; i < cases.children.length; i++) {
			if(cases.children[i].conditionCase == expectedCase) {
				if(altCodeFunc == null) {
					return this.runFuncCode(cases.children[i]);
				} else {
					if(altCodeFunc(obj, cases.children[i])) {
						return false;
					}
				}
			}
		}
		
		//No match found: empty/inexistant case
		return true;
		
	}

	runLoop(node, altCodeFunc, obj) {
		//Loop
		let startTime = Date.now();
		while(true) {
			
			//Get condition and run code
			let condition = node.children[0].children[0];
			let code = node.children[1];
			
			//Eval condition
			let results = this.evalExp(condition, node.context);
			if(results[0] == null) {
				return null;
			}
			
			//Load code
			if(results[0]) {
				if(altCodeFunc == null) {
					if(code.children.length > 0) {
						if(!this.runFuncCode(code.children[0])) {
							return false;
						}
					} else {
						//Empty/inexistant code (endless loop)
						this.console.displayMsg(ERROR_ENDLESS_LOOP.format(node.lineStart, node.offsetStart), true);
						return false;
					}
				} else {
					
					if(code.children.length > 0) {
						if(altCodeFunc(obj, code.children[0])) {
							return false;
						}
					}
					
					//Empty/inexistant code (endless loop)
					this.console.displayMsg(WARN_ENDLESS_LOOP.format(node.lineStart, node.offsetStart), true);
					return false;
					
				}
			} else {
				//End of loop
				return true;
			}
			
			//Check loop time duration
			if(Date.now() - startTime > LOOP_TIMEOUT) {
				//Too long loop
				this.console.displayMsg(ERROR_LONG_LOOP.format(node.lineStart, node.offsetStart), true);
				return false;
			}
			
		}
	}

	runFuncCall(node, context) {
			
		//Get function name
		let funcName = node.ref;
		
		//Get func ref and expression params
		let funcRef = this.astFunc[funcName];
		if(typeof funcRef === UNDEFINED) {
			funcRef = astCopy(this.astSys[funcName], this.globalContext);
		} else {
			funcRef = astCopy(this.astFunc[funcName], this.globalContext);
		}
		
		//Evaluate expressions to use them as params
		let curParam = 0;
		let exps = node.children;
		for(let i = 0; i < exps.length; i++) {
			
			//Eval expression
			let results = this.evalExp(exps[i], context);
			
			//Assign result
			for(let j = 0; j < results.length; j++) {
				
				//Check invalid result
				if(results[j] == null) {
					return [null];
				}
				
				//Assign value to param
				funcRef.children[0].children[curParam].info.value = results[j];
				
				//Next param
				curParam++;
				
			}
			
		}
		
		return this.runFunction(funcRef);

	}

	runReturn(funcRef) {
		
		//Evaluate return expressions
		let returnParams = [];
		let exps = funcRef.children[3].children;
		for(let i = 0; i < exps.length; i++) {
			
			//Eval expression
			let results = this.evalExp(exps[i], funcRef.context);
			
			//Assign result
			for(let j = 0; j < results.length; j++) {
				//Check invalid result
				if(results[j] == null) {
					return [null];
				} else {
					returnParams.push(results[j]);
				}
			}
			
		}
		
		return returnParams;
		
	}
	
	evalExp(node, context) {
		
		//Check node type
		let value = [];
		switch(node.type) {
			
			case AST_NODE.EXPRESSION:
				//Check if has any operation assigned
				if(typeof node.operation === UNDEFINED) {
					value = this.evalExp(node.children[0], context);
				} else {
					value = this.operate(node, context);
				}
				break;
			
			case AST_NODE.VALUE:
				value.push(this.getConstValue(node));
				break;
				
			case AST_NODE.ID:
			
				//Check if var has any value
				let varRef = astLocateVar(node.ref.content, context);
				if(varRef.value == null) {
					varRef.value = this.getDefaultValue(varRef.type);
				}
				
				//Get value
				if(varRef.value != null) {
					value.push(varRef.value);
				} else {
					value = [null];
				}
				
				break;
				
			case AST_NODE.FUNC_EXP:
				value.push(...this.runFuncCall(node, context));
				break;
				
			default:	//Undefined case
				value = [null];
				break;
				
		}
		
		return value;
		
	}
	
	operate(node, context) {
	
		//Eval expressions before operation occurs
		let exps = [];
		for(let i = 0; i < node.children.length; i++) {
			exps.push(...this.evalExp(node.children[i], context));
		}
		
		//Check valid exps
		for(let i = 0; i < exps.length; i++) {
			if(exps[i] == null) {
				return [null];
			}
		}
		
		//Check operation (considerating exp lengths is ok)
		switch(node.operation) {
			
			case OPERATION.NOT:
				return [!exps[0]];
				
			case OPERATION.OR:
				return [exps[0] || exps[1]];
				
			case OPERATION.AND:
				return [exps[0] && exps[1]];
				
			case OPERATION.EQ:
				return [exps[0] == exps[1]];
				
			case OPERATION.NOT_EQ:
				return [exps[0] != exps[1]];
				
			case OPERATION.LOW:
				return [exps[0] < exps[1]];
				
			case OPERATION.LOW_EQ:
				return [exps[0] <= exps[1]];
				
			case OPERATION.GREAT:
				return [exps[0] > exps[1]];
				
			case OPERATION.GREAT_EQ:
				return [exps[0] >= exps[1]];
				
			case OPERATION.NEG:
				return [-exps[0]];
				
			case OPERATION.PLUS:
				return [exps[0] + exps[1]];
				
			case OPERATION.MINUS:
				return [exps[0] - exps[1]];
				
			case OPERATION.MULT:
				return [exps[0] * exps[1]];
				
			case OPERATION.DIV:
				//Check 0-div
				if(exps[1] == 0) {
					this.console.displayMsg(ERROR_ZERO_DIV.format(node.lineStart, node.offsetStart), true);
					return [null];
				}
				return [Math.round(exps[0] / exps[1])];
				
			case OPERATION.MOD:
				//Check 0-div
				if(exps[1] == 0) {
					this.console.displayMsg(ERROR_ZERO_DIV.format(node.lineStart, node.offsetStart), true);
					return [null];
				}
				return [Math.round(exps[0] % exps[1])];
				
			default:
				return [null];
				
		}
		
	}

	getConstValue(node) {
		switch(node.dataType) {
			
			case DATA_TYPES.INT:
				return parseInt(node.value.content);
				
			case DATA_TYPES.CHAR:
				return node.value.content.charCodeAt(1);
				
			case DATA_TYPES.BOOL:
				return node.value.token_id == BOOL.TRUE ? true : false;
				
			case DATA_TYPES.STRING:
				let string = node.value.content;
				return string.substring(1, string.length - 1);
				
			default:
				return null;
				
		}
	}

	getDefaultValue(type) {
		switch(type) {
			
			case DATA_TYPES.INT:
			case DATA_TYPES.CHAR:
				return 0;
				
			case DATA_TYPES.BOOL:
				return false;
				
			case DATA_TYPES.STRING:
				return EMPTY;
				
			default:
				return null;
				
		}
	}

}
