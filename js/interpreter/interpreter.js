class Interpreter {

	constructor(console) {
		this.console = console;
		this.astTreeSrc = null;
		this.curNode = null;
	}
	
	setCode(astTree, astFunc, astSys) {
		
		//Get required data
		this.astTreeSrc = astTree;
		this.astFunc = astFunc;
		this.astSys = astSys;
		
		//Reset console
		this.resetStatus();
		
	}
	
	resetStatus() {
		
		//Clear console
		this.console.clear();
		
		//Check if any AST tree exists
		if(this.astTreeSrc == null) {
			return;
		}
		
		//Check if any action exists
		if(this.astTreeSrc.children.length > 0) {
			
			//Copy ast tree
			this.astTree = astCopy(this.astTreeSrc, null);
			
			//Prepare code runner
			this.codeRunner = new CodeRunner(this.astSys, this.astFunc, this.astTree.context, this.console);
			
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
					if(this.codeRunner.runVarAssign(this.curNode)) {
						this.prepareNext();
					} else {
						this.curNode = null;
					}
					break;
					
				case SEMANTICA_KEYS.FORK:
					let forkResp = this.codeRunner.runFork(this.curNode, this.prepareCase, this);
					if(forkResp == null) {
						this.curNode = null;
					} else if(forkResp) {
						this.prepareNext();
					}
					break;
					
				case SEMANTICA_KEYS.LOOP:
					let loopResp = this.codeRunner.runLoop(this.curNode, this.prepareCase, this);
					if(loopResp == null) {
						this.curNode = null;
					} else if(loopResp) {
						this.prepareNext();
					}
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					let returnValue = this.codeRunner.runFuncCall(this.curNode, this.curNode.context);
					for(let i = 0; i < returnValue.length; i++) {
						if(returnValue[i] == null) {
							this.curNode = null;
							return;
						}
					}
					this.prepareNext();
					break;
					
				default:	//Undefined case
					this.curNode = null;
					break;
					
			}
		
		} catch(e) {
			if(e instanceof RangeError) {
				this.console.displayMsg(ERROR_STACK_OV, true);
			} else {
				this.console.displayMsg(ERROR_UNDEFINED, true);	//May not happen, ever
				console.error(e);
			}
			this.curNode = null;
		}
	}
	
	prepareNext() {
		
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
				
				this.prepareNext();
				
			} else {
				this.curNode = null;
			}
			
		}
		
	}
	
	prepareCase(obj, caseNode) {
		//Check if any action exists
		if(caseNode.children.length > 0) {
			
			obj.curNode = caseNode.children[0];
			
			obj.nodePath.push(caseNode);
			obj.indexPath.push(0);
			
			return true;
			
		} else {
			return false;
		}
	}
	
}
