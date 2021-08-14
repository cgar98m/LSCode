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

const BOOL = {
	TRUE: "KW_BOOL_TRUE",
	FALSE: "KW_BOOL_FALSE"
}

const LOOP_TIMEOUT = 5000;

class Interpreter {

	constructor(console) {
		this.console = console;
		this.curNode = null;
	}
	
	setCode(astTree, astFunc, astSys) {
		
		//Get required data
		this.astTreeSrc = astTree;
		this.astFuncSrc = astFunc;
		this.astSysSrc = astSys;
		
		//Reset console
		this.resetStatus();
		
	}
	
	resetStatus() {
		
		//Check if any action exists
		if(this.astTreeSrc.children.length > 0) {
			
			//Copy ast tree
			this.astTree = astCopy(this.astTreeSrc, null);
			
			//Copy ast funcs
			this.astFunc = [];
			let funcs = Object.keys(this.astFuncSrc);
			for(let i = 0; i < funcs.length; i++) {
				this.astFunc[funcs[i]] = astCopy(this.astFuncSrc[funcs[i]], this.astTree.context);
			}
			
			//Copy sys funcs
			this.astSys = [];
			let sysFuncs = Object.keys(this.astSysSrc);
			for(let i = 0; i < sysFuncs.length; i++) {
				this.astSys[sysFuncs[i]] = astCopy(this.astSysSrc[sysFuncs[i]], this.astTree.context);
			}
			
			//Prepare code execution
			this.curNode = this.astTree.children[0];
			
			this.nodePath = [this.astTree];
			this.indexPath = [0];
			
		} else {
			this.curNode = null;
		}
		
	}
	
	isRunnable() {
		return this.curNode != null;
	}
	
	runnableCode() {
		
		//Check end of program
		if(!this.isRunnable()) {
			return null;
		}
		
		//Check action
		switch(this.curNode.semantica) {
			
			case SEMANTICA_KEYS.VAR_ASSIGN:
			case SEMANTICA_KEYS.FUNC_CALL:
				return {
					lineStart: this.curNode.lineStart,
					lineEnd: this.curNode.lineEnd,
					offsetStart: this.curNode.offsetStart,
					offsetEnd: this.curNode.offsetEnd
				};
				
			case SEMANTICA_KEYS.FORK:
			case SEMANTICA_KEYS.LOOP:
				let exp = this.curNode.children[0].children[0];
				return {
					lineStart: exp.lineStart,
					lineEnd: exp.lineEnd,
					offsetStart: exp.offsetStart,
					offsetEnd: exp.offsetEnd
				};
				
			default:	//Undefined case
				return null;
				
		}
		
	}
	
	runNext() {
		try {
		
			//Check end of program
			if(!this.isRunnable()) {
				return;
			}
			
			//Check action
			switch(this.curNode.semantica) {
				
				case SEMANTICA_KEYS.VAR_ASSIGN:
					if(this.#varAssign(this.curNode)) {
						this.#prepareNext();
					} else {
						this.curNode = null;
					}
					break;
					
				case SEMANTICA_KEYS.FORK:
					let forkResp = this.#fork();
					if(forkResp == null) {
						this.curNode = null;
					} else if(forkResp) {
						this.#prepareNext();
					}
					break;
					
				case SEMANTICA_KEYS.LOOP:
					let loopResp = this.#loop();
					if(loopResp == null) {
						this.curNode = null;
					} else if(loopResp) {
						this.#prepareNext();
					}
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					let returnValue = this.#funcCall(this.curNode, this.curNode.context);
					for(let i = 0; i < returnValue.length; i++) {
						if(returnValue[i] == null) {
							this.curNode = null;
							return;
						}
					}
					this.#prepareNext();
					break;
					
				default:	//Undefined case
					this.curNode = null;
					break;
					
			}
		
		} catch(e) {
			if(e instanceof RangeError) {
				this.#displayMsg("[Error] Stack overflow - Check for endless loops/recurssion");
			} else {
				this.#displayMsg("[Error] Undefined error");	//May not happen, ever
				console.error(e);
			}
			this.curNode = null;
		}
	}
	
	#prepareNext() {
		
		//Get previous node and index
		this.curNode = this.nodePath[this.nodePath.length - 1];
		let index = ++this.indexPath[this.indexPath.length - 1];
		
		//Check if all children where visited
		if(index < this.curNode.children.length) {
			this.curNode = this.curNode.children[index];
			return;
		} else {
			
			//Pop node
			this.nodePath.pop();
			this.indexPath.pop();
			
			//Prepare next if possible
			if(this.nodePath.length > 0) {
				
				//Check if current action is a loop
				let nextNode = this.nodePath[this.nodePath.length - 1].children[this.indexPath[this.indexPath.length - 1]];
				if(nextNode.semantica == SEMANTICA_KEYS.LOOP) {
					this.curNode = nextNode;
					return;
				}
				
				this.#prepareNext();
				
			} else {
				this.curNode = null;
			}
			
		}
		
	}
	
	#varAssign(node) {
		
		//Get vars and expressions
		let vars = node.children[0];
		let exps = node.children[1];
		
		//Evaluate expressions to assign to correspondant vars
		let curVar = 0;
		for(let i = 0; i < exps.children.length; i++) {
			
			//Eval expression
			let results = this.#evalExp(exps.children[i], node.context);
			
			//Assign result
			for(let j = 0; j < results.length; j++) {
				
				//Check invalid result
				if(results[j] == null) {
					return false;
				}
				
				//Assign value to vars
				for(let k = 0; k < vars.children[curVar].children.length; k++) {
					let varRef = this.#locateVar(vars.children[curVar].children[k].content, node.context);
					varRef.value = results[j];
				}
				
				//Next var
				curVar++;
				
			}
			
		}
		
		//All ok
		return true;
		
	}
	
	#fork() {
		
		//Get condition and cases
		let condition = this.curNode.children[0].children[0];
		let cases = this.curNode.children[1];
		
		//Eval condition
		let results = this.#evalExp(condition, this.curNode.context);
		if(results[0] == null) {
			return null;
		}
		
		//Load correspondant case
		let expectedCase = results[0] ? 0 : 1;
		for(let i = 0; i < cases.children.length; i++) {
			if(cases.children[i].conditionCase == expectedCase) {
				if(this.#prepareCase(cases.children[i])) {
					return false;
				}
			}
		}
		
		//No match found: empty/inexistant case
		return true;		
		
	}
	
	#loop() {
		
		//Get condition and run code
		let condition = this.curNode.children[0].children[0];
		let code = this.curNode.children[1];
		
		//Eval condition
		let results = this.#evalExp(condition, this.curNode.context);
		if(results[0] == null) {
			return null;
		}
		
		//Load code
		if(results[0]) {
			if(code.children.length > 0) {
				if(this.#prepareCase(code.children[0])) {
					return false;
				}
			}
		} else {
			//End of loop
			return true;
		}
		
		//Empty/inexistant code (endless loop)
		this.#displayMsg("[Warning] Endless loop");
		return false;
		
	}
	
	#prepareCase(caseNode) {
		//Check if any action exists
		if(caseNode.children.length > 0) {
			
			this.curNode = caseNode.children[0];
			
			this.nodePath.push(caseNode);
			this.indexPath.push(0);
			
			return true;
			
		} else {
			return false;
		}
	}
	
	#funcCall(node, context) {
		
		//Get function name
		let funcName = node.ref;
		
		//Get func ref and expression params
		let funcRef = this.astFunc[funcName];
		if(typeof funcRef === "undefined") {
			funcRef = astCopy(this.astSys[funcName], this.astTree.context);
		} else {
			funcRef = astCopy(this.astFunc[funcName], this.astTree.context);
		}
		let exps = node.children;
		
		//Evaluate expressions to use them as params
		let curParam = 0;
		for(let i = 0; i < exps.length; i++) {
			
			//Eval expression
			let results = this.#evalExp(exps[i], context);
			
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
		
		return this.#runFunction(funcRef);
	
	}
	
	#runFunction(funcRef) {
		
		//Check if is a system function
		if(typeof this.astSys[funcRef.funcName] !== "undefined") {
			return this.#runSysFunction(funcRef);
		}
		
		//Run non-return actions
		let funcActions = funcRef.children[2].children;
		if(funcActions.length > 0) {
			if(!this.#runFuncCode(funcActions[0])) {
				return [null];
			}
		}
		
		//Evaluate return expressions
		let returnParams = [];
		let exps = funcRef.children[3].children;
		for(let i = 0; i < exps.length; i++) {
			
			//Eval expression
			let results = this.#evalExp(exps[i], funcRef.context);
			
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
	
	#runFuncCode(node) {
		
		//Run every action
		for(let i = 0; i < node.children.length; i++) {
			//Check action
			switch(node.children[i].semantica) {
		
				case SEMANTICA_KEYS.VAR_ASSIGN:
					if(!this.#varAssign(node.children[i])) {
						return false;
					}
					break;
					
				case SEMANTICA_KEYS.FORK:
					if(!this.#funcFork(node.children[i])) {
						return false;
					}
					break;
					
				case SEMANTICA_KEYS.LOOP:
					if(!this.#funcLoop(node.children[i])) {
						return false;
					}
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					let returnValue = this.#funcCall(node.children[i], node.children[i].context);
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
	
	#funcFork(node) {
		
		//Get condition and cases
		let condition = node.children[0].children[0];
		let cases = node.children[1];
		
		//Eval condition
		let results = this.#evalExp(condition, node.context);
		if(results[0] == null) {
			return false;
		}
		
		//Load correspondant case
		let expectedCase = results[0] ? 0 : 1;
		for(let i = 0; i < cases.children.length; i++) {
			if(cases.children[i].conditionCase == expectedCase) {
				return this.#runFuncCode(cases.children[i]);
			}
		}
		
		//No match found: empty/inexistant case
		return true;
		
	}
	
	#funcLoop(node) {
		//Loop
		let startTime = Date.now();
		while(true) {
			
			//Get condition and run code
			let condition = node.children[0].children[0];
			let code = node.children[1];
			
			//Eval condition
			let results = this.#evalExp(condition, node.context);
			if(results[0] == null) {
				return false;
			}
			
			//Load code
			if(results[0]) {
				if(code.children.length > 0) {
					if(!this.#runFuncCode(code.children[0])) {
						return false;
					}
				} else {
					//Empty/inexistant code (endless loop)
					this.#displayMsg("[Error] Endless loop");
					return false;
				}
			} else {
				//End of loop
				return true;
			}
			
			//Check loop time duration
			if(Date.now() - startTime > LOOP_TIMEOUT) {
				//Too long loop
				this.#displayMsg("[Error] Too long loop - It may be an endless loop");
				return false;
			}
			
		}
	}
	
	#runSysFunction(funcRef) {
		//All prints: switch useful in the future, useless otherwise
		switch(funcRef.funcName) {
			
			case SYS_FUNC.INT:
			case SYS_FUNC.BOOL:
			case SYS_FUNC.INT:
				this.#displayMsg(funcRef.context.vars.msg.value);		
				return [];
				
			case SYS_FUNC.STRING:
				let string = funcRef.context.vars.msg.value;
				this.#displayMsg(string.substring(1, string.length - 1));	//Remove ""	
				return [];
				
			default:	//Undefined
				return [null];
				
		}
	}
	
	#evalExp(node, context) {
		
		//Check node type
		let value = [];
		switch(node.type) {
			case AST_NODE.EXPRESSION:
				//Check if has any operation assigned
				if(typeof node.operation === "undefined") {
					value = this.#evalExp(node.children[0], context);
				} else {
					value = this.#operate(node, context);
				}
				break;
			
			case AST_NODE.VALUE:
				value.push(this.#getConstValue(node));
				break;
				
			case AST_NODE.ID:
			
				//Check if var has any value
				let varRef = this.#locateVar(node.ref.content, context);
				if(typeof varRef.value === "undefined") {
					varRef.value = this.#getDefaultValue(varRef.type);
				}
				
				//Get value
				if(varRef.value != null) {
					value.push(varRef.value);
				} else {
					value = [null];
				}
				
				break;
				
			case AST_NODE.FUNC_EXP:
				value.push(...this.#funcCall(node, context));
				break;
				
			default:	//Undefined case
				value = [null];
				this.#displayMsg("[Error] Unexpected struct");
				break;
				
		}
		
		return value;
		
	}
	
	#operate(node, context) {
		
		//Eval expressions before operation occurs
		let exps = [];
		for(let i = 0; i < node.children.length; i++) {
			exps.push(...this.#evalExp(node.children[i], context));
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
				
			case OPERATION.PLUS:
				return [exps[0] + exps[1]];
				
			case OPERATION.MINUS:
				return [exps[0] - exps[1]];
				
			case OPERATION.MULT:
				return [exps[0] * exps[1]];
				
			case OPERATION.DIV:
				//Check 0-div
				if(exps[1] == 0) {
					this.#displayMsg("[Error] Division by 0");
					return [null];
				}
				return [Math.round(exps[0] / exps[1])];
				
			case OPERATION.MOD:
				//Check 0-div
				if(exps[1] == 0) {
					this.#displayMsg("[Error] Division by 0");
					return [null];
				}
				return [Math.round(exps[0] % exps[1])];
				
			default:
				this.#displayMsg("[Error] Unexpected operation");
				return [null];
				
		}
		
	}
	
	#getConstValue(node) {
		switch(node.dataType) {
			case DATA_TYPES.INT:
				return parseInt(node.value.content);
			case DATA_TYPES.CHAR:
				return node.value.content.charAt(0);
			case DATA_TYPES.BOOL:
				return node.value.token_id == BOOL.TRUE ? true : false;
			case DATA_TYPES.STRING:
				return node.value.content;
			default:
				this.#displayMsg("[Error] Unexpected const");
				return null;
		}
	}
	
	#getDefaultValue(type) {
		switch(type) {
			case DATA_TYPES.INT:
				return 0;
			case DATA_TYPES.CHAR:
				return '\0';
			case DATA_TYPES.BOOL:
				return false;
			case DATA_TYPES.STRING:
				return "";
			default:
				this.#displayMsg("[Error] Unexpected data type");
				return null;
		}
	}
	
	#displayMsg(msg) {
		if(this.console.value.length > 0) {
			this.console.value += "\n";
		}
		this.console.value += msg;
		this.console.scrollTop = this.console.scrollHeight;
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
	
}
