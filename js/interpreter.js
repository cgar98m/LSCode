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

class Interpreter {

	constructor(astTree, astFunc, astSys, console) {
		
		//Get required elements
		this.astTree = astTree;
		this.astFunc = astFunc;
		this.astSys = astSys;
		this.console = console;
		
		//Prepare execution status
		this.resetStatus();
		
	}
	
	resetStatus() {
		
		//Check if any action exists
		if(this.astTree.children.length > 0) {
			
			this.curNode = this.astTree.children[0];
			
			this.nodePath = [this.astTree];
			this.indexPath = [0];
			
			this.context = this.#contextCopy(this.curNode.context);
			
		} else {
			this.curNode = null;
		}
		
		//Clear console
		this.console.value = "";
		
	}
	
	isRunnable() {
		return this.curNode != null;
	}
	
	runNext() {
		
		//Check end of program
		if(!this.isRunnable()) {
			return;
		}
		
		//Check node type
		switch(this.curNode.type) {
				
			case AST_NODE.ACTION:
				switch(this.curNode.semantica) {
					
					case SEMANTICA_KEYS.VAR_ASSIGN:
						if(this.#varAssign()) {
							this.#prepareNext();
						} else {
							this.curNode = null;
						}
						break;
						
					case SEMANTICA_KEYS.FORK:
						this.#fork();
						break;
						
					case SEMANTICA_KEYS.LOOP:
						this.#loop();
						break;
						
					case SEMANTICA_KEYS.FUNC_CALL:
						let returnValue = this.#funcCall();
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
				break;
				
			default:	//Undefined case
				this.curNode = null;
				break;
				
		}
		
	}
	
	#contextCopy(context) {
		//TODO
		return context;
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
				this.#prepareNext();
			} else {
				this.curNode = null;
			}
			
		}
		
	}
	
	#varAssign() {
		
		//Get vars and expressions
		let vars = this.curNode.children[0];
		let exps = this.curNode.children[1];
		
		//Evaluate expressions to assign to correspondant vars
		let curVar = 0;
		for(let i = 0; i < exps.children.length; i++) {
			
			//Eval expression
			let results = this.#evalExp(exps.children[i]);
			
			//Assign result
			for(let j = 0; j < results.length; j++) {
				
				//Check invalid result
				if(results[j] == null) {
					return false;
				}
				
				//Assign value to vars
				for(let k = 0; k < vars.children[curVar].children.length; k++) {
					let varRef = this.#locateVar(vars.children[curVar].children[k].content, this.context);
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
		//TODO
	}
	
	#loop() {
		//TODO
	}
	
	#funcCall() {
		
		//Get func ref and expression params
		let funcRef = this.astFunc[this.curNode.ref];
		if(typeof funcRef === "undefined") {
			funcRef = this.astSys[this.curNode.ref];
		}
		let exps = this.curNode.children;
		
		//Evaluate expressions to use them as params
		let curParam = 0;
		for(let i = 0; i < exps.length; i++) {
			
			//Eval expression
			let results = this.#evalExp(exps[i]);
			
			//Assign result
			for(let j = 0; j < results.length; j++) {
				
				//Check invalid result
				if(results[j] == null) {
					return [null];
				}
				
				//Assign value to param
				funcRef.children[0].children[curParam].varRef.value = results[j];
				
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
		
		//TODO: Run function
		return [null];
		
	}
	
	#runSysFunction(funcRef) {
		//All prints: switch useful in the future, useless otherwise
		switch(funcRef.funcName) {
			
			case SYS_FUNC.INT:
			case SYS_FUNC.BOOL:
			case SYS_FUNC.STRING:
			case SYS_FUNC.INT:
				if(this.console.value.length > 0) {
					this.console.value += "\n";
				}
				this.console.value += funcRef.context.vars.msg.value;			
				return [];
				
			default:	//Undefined
				return [null];
				
		}
	}
	
	#evalExp(node) {
		
		//Check node type
		let value = [];
		switch(node.type) {
			case AST_NODE.EXPRESSION:
				//Check if has any operation assigned
				if(typeof node.operation === "undefined") {
					value = this.#evalExp(node.children[0]);
				} else {
					value = this.#operate(node);
				}
				break;
			
			case AST_NODE.VALUE:
				value.push(this.#getConstValue(node));
				break;
				
			case AST_NODE.ID:
			
				//Check if var has any value
				if(typeof node.ref.value === "undefined") {
					node.ref.value = this.#getDefaultValue(node.ref.type);
				}
				
				//Get value
				if(node.ref.value != null) {
					value.push(node.ref.value);
				} else {
					value = [null];
				}
				
				break;
				
			case AST_NODE.FUNC_EXP:
				value.push(...this.#expFuncCall(node));
				break;
				
			default:	//Undefined case
				value = [null];
				console.value += "Unexpected struct";
				break;
				
		}
		
		return value;
		
	}
	
	#expFuncCall(node) {
		
		//Get func ref and expression params
		let funcRef = node.funcRef;
		let exps = node.children;
		
		//Evaluate expressions to use them as params
		let curParam = 0;
		for(let i = 0; i < exps.length; i++) {
			
			//Eval expression
			let results = this.#evalExp(exps[i]);
			
			//Assign result
			for(let j = 0; j < results.length; j++) {
				
				//Check invalid result
				if(results[j] == null) {
					return [null];
				}
				
				//Assign value to param
				funcRef.children[0].children[curParam].varRef.value = results[j];
				
				//Next param
				curParam++;
				
			}
			
		}
		
		//TODO: Run function
		//TODO: Get return value
		return [];
		
	}
	
	#operate(node) {
		
		//Eval expressions before operation occurs
		let exps = [];
		for(let i = 0; i < node.children.length; i++) {
			exps.push(...this.#evalExp(node.children[i]));
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
					console.value += "Division by 0";
					return [null];
				}
				return [exps[0] / exps[1]];
				
			case OPERATION.MOD:
				//Check 0-div
				if(exps[1] == 0) {
					console.value += "Division by 0";
					return [null];
				}
				return [exps[0] % exps[1]];
				
			default:
				console.value += "Unexpected operation";
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
				console.value += "Unexpected const";
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
				console.value += "Unexpected data type";
				return null;
		}
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
