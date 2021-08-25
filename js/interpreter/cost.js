const COST_TYPE = {
	CONST: {
		desc: "constant",
		order: 0
	},
	LOG: {
		desc: "logarithmic",
		order: 1
	},
	LIN: {
		desc: "linear",
		order: 2
	},
	POL: {
		desc: "polinomic",
		order: 3
	},
	EXP: {
		desc: "exponential",
		order: 4
	},
	PROD: {
		desc: "product"
	},
	MAX: {
		desc: "maximum"
	},
	MIN: {
		desc: "minimum"
	},
	INF: {
		desc: "endless"
	}
}

class Cost {

	constructor(costDisplay, costConsole) {
		this.costDisplay = costDisplay;
		this.costConsole = costConsole;
		this.clear();
	}
	
	clear() {
		this.costDisplay.unmarkContent();
		this.costConsole.clear();
	}
	
	setCode(astTree, astFunc, astSys) {
		
		//Get required data
		this.astTree = astCopy(astTree, null);
		this.astFunc = astCopy(astFunc, this.astTree.context);
		this.astSys = astCopy(astSys, this.astTree.context);
		
		//Clear display tips and global cost
		this.clear();
		
		//Prepare code runner
		this.codeRunner = new CodeRunner(this.astSys, this.astFunc, this.astTree.context, this.costConsole);
		
		//Analyze cost
		let error = !this.analyzeFuncCost(this.astSysSrc);
		if(!error) {
			error = !this.analyzeFuncCost(this.astFuncSrc);
		}
		if(!error) {
			error = !this.analyzeCodeCost(this.astTree);
		}
		
		//Display costs
		if(!error) {
			this.displayCosts(this.astTree, 0);
		}
		
	}
	
	displayCosts(node, colorIdx) {
		//Check node type
		if(node.type == AST_NODE.STRUCT) {
			
			//Check if is root node
			if(node == this.astTree) {
				this.displayGlobalCost(node.cost);
			}
			
			//Process actions
			for(let i = 0; i < node.children.length; i++) {
				this.displayCosts(node.children[i], (colorIdx + i) % BG_COLOR_CLASSES.length);
			}
			
		} else {
			//Check action
			switch(node.semantica) {
				
				case SEMANTICA_KEYS.VAR_ASSIGN:
					this.displayVarAssignCost(node, colorIdx);
					break;
					
				case SEMANTICA_KEYS.FORK:
				case SEMANTICA_KEYS.LOOP:
					this.displayCodeJumpCost(node, colorIdx);
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					this.displayFuncCallCost(node, colorIdx);
					break;
					
				case SEMANTICA_KEYS.FUNC_DEFINE:
					this.displayFuncDefineCost(node, colorIdx);
					break;
					
			}
		}
	}
	
	displayExpCost(node, colorIdx) {
		//Check node type
		switch(node.type) {
			
			case AST_NODE.EXPRESSION:
				for(let i = 0; i < node.children.length; i++) {
					this.displayExpCost(node.children[i], colorIdx);
				}
				break;
				
			case AST_NODE.FUNC_EXP:
				this.displayFuncCallCost(node, colorIdx);
				break;
				
		}
	}
	
	displayVarAssignCost(node, colorIdx) {
		
		//Display var assign global cost
		this.displayLocalCost(node.cost, node.lineStart, node.lineEnd, node.offsetStart, node.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
		
		//Display expressions cost
		for(let i = 0; i < node.children[1].children.length; i++) {
			this.displayExpCost(node.children[1].children[i], (colorIdx + 1) % BG_COLOR_CLASSES.length);
		}
		
	}
	
	displayCodeJumpCost(node, colorIdx) {
		
		//Display code jump cost
		this.displayLocalCost(node.cost, node.lineStart, node.lineEnd, node.offsetStart, node.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
		
		//Display condition cost
		let cNode = node.children[0].children[0];
		this.displayLocalCost(cNode.cost, cNode.lineStart, cNode.lineEnd, cNode.offsetStart, cNode.offsetEnd, BG_COLOR_CLASSES[(colorIdx + 1) % BG_COLOR_CLASSES.length]);
		this.displayExpCost(cNode, (colorIdx + 2) % BG_COLOR_CLASSES.length);
		
		//Display subcode costs
		for(let i = 0; i < node.children[1].children.length; i++) {
			this.displayCosts(node.children[1].children[i], (colorIdx + 2) % BG_COLOR_CLASSES.length);
		}
		
	}
	
	displayFuncCallCost(node, colorIdx) {
		
		//Get func ref
		let funcRef = this.astFunc[node.ref];
		if(typeof funcRef === UNDEFINED) {
			funcRef = this.astSys[node.ref];
		}
		
		//Display call cost
		this.displayLocalCost(funcRef.cost, funcRef.lineStart, funcRef.lineEnd, funcRef.offsetStart, funcRef.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
		
		//Display params cost
		for(i = 0; i < node.children.length; i++) {
			let exp = node.children[i];
			this.displayLocalCost(exp.cost, exp.lineStart, exp.lineEnd, exp.offsetStart, exp.offsetEnd, BG_COLOR_CLASSES[(colorIdx + 1) % BG_COLOR_CLASSES.length]);
			this.displayExpCost(exp, (colorIdx + 2) % BG_COLOR_CLASSES.length);
		}
		
	}
	
	displayFuncDefineCost(node, colorIdx) {
		
		//Display func cost
		this.displayLocalCost(node.cost, node.lineStart, node.lineEnd, node.offsetStart, node.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
		
		//Display subcode costs
		for(let i = 0; i < node.children[2].children.length; i++) {
			this.displayCosts(node.children[2].children[i], (colorIdx + 1) % BG_COLOR_CLASSES.length);
		}
		
		//Display return cost
		let rNode = node.children[3];
		if(rNode.children.length > 0) {
			this.displayLocalCost(rNode.cost, rNode.lineStart, rNode.lineEnd, rNode.offsetStart, rNode.offsetEnd, BG_COLOR_CLASSES[(colorIdx + 1) % BG_COLOR_CLASSES.length]);
			for(let i = 0; i < rNode.children.length; i++) {
				let exp = rNode.children[i];
				this.displayLocalCost(exp.cost, exp.lineStart, exp.lineEnd, exp.offsetStart, exp.offsetEnd, BG_COLOR_CLASSES[(colorIdx + 2) % BG_COLOR_CLASSES.length]);
				this.displayExpCost(exp, (colorIdx + 3) % BG_COLOR_CLASSES.length);
			}
		}
		
	}
	
	analyzeFuncCost(node) {
		
		//Check if any function exists
		let funcKeys = Object.keys(this.astFunc);
		if(funcKeys.length == 0) {
			return true;
		}
		
		//TODO
		return true;
		
	}
	
	analyzeCodeCost(node) {
		
		//Check if any action exists
		if(node.children.length == 0) {
			return true;
		}
		
		//Process actions
		let costs = [];
		for(let i = 0; i < node.children.length; i++) {
			let cost = this.analyzeAction(node.children[i]);
			if(cost == null) {
				return false;
			} else {
				costs.push(cost);
			}
		}
		
		//Get global cost
		node.cost = this.additiveCost(costs);
		return true;
		
	}
	
	analyzeAction(node) {
		//Check action
		switch(node.semantica) {
			
			case SEMANTICA_KEYS.VAR_ASSIGN:
				return this.varAssignCost(node);
				
			case SEMANTICA_KEYS.FORK:
				return this.forkCost(node);
				
			case SEMANTICA_KEYS.LOOP:
				return this.loopCost(node);
				
			case SEMANTICA_KEYS.FUNC_CALL:
				return this.funcCallCost(node);
				
			default:	//Undefined case
				return null;
				
		}
	}
	
	varAssignCost(node) {
		
		//Get expressions
		let exps = node.children[1];
		
		//Get expressions cost
		let expCosts = [];
		for(let i = 0; i < exps.children.length; i++) {
			let costs = this.evalExpCost(exps.children[i]);
			for(let i = 0; i < costs.length; i++) {
				if(costs[i] == null) {
					return null;
				} else {
					expCosts.push(costs[i]);
				}
			}
		}
		
		//Get cost range
		node.cost = this.additiveCost(expCosts);
		return node.cost;
		
	}
	
	this.forkCost(node) {
		
		//Get condition cost
		let costs = this.evalExpCost(node.children[0].children[0]);
		for(let i = 0; i < costs.length; i++) {
			if(costs[i] == null) {
				return null;
			}
		}
		node.children[0].children[0].cost = this.additiveCost(costs);
		
		//Get sub-costs
		let subCosts = [];
		for(let i = 0; i < node.children[1].children.length; i++) {
			if(!this.analyzeCodeCost(node.children[1].children[i])) {
				return null;
			}
		}
		
		//Check branches to assign fork cost
		node.cost = node.children[0].children[0].cost;
		if(node.children[1].children.length > 0) {
			//Check condition
			if(this.isConstantExp(node.children[0].children[0])) {
				let conditionExp = this.codeRunner.evalExp(node.children[0].children[0], null)[0];
				if(conditionExp == null) {
					return null;
				} else {
					let conditionIdx = conditionExp ? 0 : 1;
					for(let i = 0; i < node.children[1].children.length; i++) {
						if(node.children[1].children[i].conditionCase == conditionIdx) {
							node.cost = this.productCost([node.cost, node.children[1].children[i].cost]);
							break;
						}
					}
				}
			} else {
				
				//Split maxs & mins
				let maxs = [];
				let mins = [];
				for(let i = 0; i < node.children[1].children.length; i++) {
					maxs.push(node.children[1].children[i].cost.max);
					mins.push(node.children[1].children[i].cost.min);
				}
				
				//Reorder costs (highest --> lowest)
				this.reorderCosts(maxs);
				this.reorderCosts(mins);
				
				//Select fork cost (highest max, lowest min --> worst & best case)
				node.cost = {
					max: maxs[0],
					min: mins[mins.length - 1]
				};
			
			}
		}
		
		return node.cost;
		
	}
	
	loopCost(node) {
		
		//Get condition cost
		let costs = this.evalExpCost(node.children[0].children[0]);
		for(let i = 0; i < costs.length; i++) {
			if(costs[i] == null) {
				return null;
			}
		}
		node.children[0].children[0].cost = this.additiveCost(costs);
		
		//Analyze loop code cost
		if(node.children[1].children.length > 0) {
			if(!this.analyzeCodeCost(node.children[1].children[0])) {
				return null;
			}
		}
		
		//Check condition
		node.cost = node.children[0].children[0].cost;
		if(this.isConstantExp(node.children[0].children[0])) {
			let conditionExp = this.codeRunner.evalExp(node.children[0].children[0], null)[0];
			if(conditionExp == null) {
				return null;
			} else {
				if(conditionExp) {
					node.cost = {
						max: {
							type: COST_TYPE.INF
						},
						min: {
							type: COST_TYPE.INF
						}
					};
				}
			}
		} else {
			let itCost = this.getIterationCost(node.children[0].children[0], node.children[1].children.length > 0 ? node.children[1].children[0] : null, node.context);
			if(itCost == null) {
				return null;
			} else {
				node.cost = this.productCost([node.cost, itCost]);
			}
		}
		
		return node.cost;
		
	}
	
	funcCallCost(node) {
		//TODO
		return null;
	}
	
	getIterationCost(condition, code, context) {
		
		//Check if has code to run (updates condition dependency)
		if(code == null) {
			return {
				max: {
					type: COST_TYPE.INF
				},
				min: {
					type: COST_TYPE.CONST,
					param: 1
				}
			};
		}
		
		//Get condition dependency vars (must exist)
		let vars = this.getDependencies(condition, code, context);
		let varUpdateCosts = [];
		for(let i = 0; i < vars.length; i++) {
			switch(vars[i].type) {
				
				case DATA_TYPES.INT:
				case DATA_TYPES.CHAR:
					varUpdateCosts.push(this.getIntegerUpdateCost(vars[i], code));
					if(varUpdateCosts[varUpdateCosts.length - 1] == null) {
						return null;
					}
					break;
					
				case DATA_TYPES.BOOL:
					varUpdateCosts.push(this.getBoolUpdateCost(vars[i], code));
					if(varUpdateCosts[varUpdateCosts.length - 1] == null) {
						return null;
					}
					break;
					
				case DATA_TYPES.STRING:
				default:
					return null;
					
			}
		}
		
		//Get cost ponderation
		return this.additiveCost(varUpdateCosts);
		
	}
	
	getIntegerUpdateCost(varRef, code) {
		
		//Analyze code
		let costs = [];
		for(let i = 0; i < code.children.length; i++) {
			let tmpCost = this.analyzeUpdateAction(varRef, code.children[i]);
			if(tmpCost[0] == null) {
				return null;
			} else {
				costs.push(...tmpCost);
			}
		}
		
		if(costs.length > 0) {
			return this.additiveCost(costs);
		} else {
			return {
				max: {
					type: COST_TYPE.INF
				},
				min: {
					type: COST_TYPE.INF
				}
			};
		}
		
	}
	
	analyzeUpdateAction(varRef, node) {
		
		//Check action
		let costs = [];
		switch(node.semantica) {
			
			case SEMANTICA_KEYS.VAR_ASSIGN:
				costs.push(...this.varAssignUpdate(varRef, node));
				break;
				
			case SEMANTICA_KEYS.FORK:
				costs.push(...this.forkUpdate(varRef, node));
				break;
				
			case SEMANTICA_KEYS.LOOP:
				costs.push(...this.loopUpdate(varRef, node));
				break;
				
			case SEMANTICA_KEYS.FUNC_CALL:
				costs.push(...this.funcCallUpdate(varRef, node));
				break;
				
			default:	//Undefined case
				return [null];
				
		}
		
		return costs;
		
	}
	
	varAssignUpdate(varRef, node) {
		
		//Check if target var is modified
		let varPos = null;
		for(let i = 0; i < node.children[0].children.length && varPos == null; i++) {
			for(let j = 0; j < node.children[0].children[i].children.length; j++) {
				if(node.children[0].children[i].children[j].content == varRef.content) {
					varPos = i;
					break;
				}
			}
		}
		
		//Check if var was found
		if(varPos == null) {
			return [];
		}
		
		//Analyze expressions
		let curParam = 0;
		let paramCount = 0;
		for(let i = 0; i < node.children[1].children.length; i++) {
			paramCount += this.totalExps(node.children[1].children[i]);
			if(varPos < paramCount) {
				let costs = this.expUpdateEval(varRef, node.children[1].children[i], varPos - curParam, node.context);
				if(costs.length == 0) {
					return [];
				} else if(costs[0] == null) {
					return [null];
				} else {
					return costs;
				}
			} else {
				curParam += (paramCount - 1);
			}
		}
		
		//May not ever happen
		return [null];
		
	}
	
	totalExps(exp) {
		//Check if is a group of expressions
		if(exp.dataType == EXP_SPECIAL_KEYS.GROUP) {
			let funcCallNode = locateExpFunc(exp);
			return funcCallNode.multiType.length;
		} else {
			return 1;
		}
	}
	
	expUpdateEval(varRef, node, expIdx, context) {
		
		//TODO
		
		//Check index
		let cost = [];
		if(expIdx == 0) {
			//Check node type
			switch(node.type) {
				
				case AST_NODE.EXPRESSION:
					//Check if has any operation assigned
					if(typeof node.operation === UNDEFINED) {
						cost = this.expUpdateEval(varRef, node.children[0], expIdx, context);
					} else {
						let newCost = this.operateCost(varRef, this.decomposeOp(node, context), context);
						if(newCost.lenth == 0) {
							cost.push({
								max: {
									type: COST_TYPE.INF
								},
								min: {
									type: COST_TYPE.CONST,
									param: 1
								}
							});
						} else {
							if(newCost[0] == null) {
								return [null];
							} else {
								cost = newCost;
							}
						}
					}
					break;
				
				case AST_NODE.FUNC_EXP:
					//Should analyze in the future
				case AST_NODE.VALUE:
					cost.push({
						max: {
							type: COST_TYPE.INF
						},
						min: {
							type: COST_TYPE.CONST,
							param: 1
						}
					});
					break;
					
				case AST_NODE.ID:
					//Check if is target var
					let newVarRef = astLocateVar(node.ref.content, context);
					if(newVarRef == varRef) {
						cost.push({
							max: {
								type: COST_TYPE.INF
							},
							min: {
								type: COST_TYPE.INF
							}
						});
					} else {
						cost.push({
							max: {
								type: COST_TYPE.INF
							},
							min: {
								type: COST_TYPE.CONST,
								param: 1
							}
						});
					}
					break;
					
				default:	//Undefined case
					cost = [null];
					break;
					
			}
		} else {
			//TODO
			cost = [null];
		}
		
		return cost;
		
	}
	
	decomposeExp(exp, context) {
		
		//Check node type
		let exps = [];
		switch(exp.type) {
			
			case AST_NODE.EXPRESSION:
				//Check if has any operation assigned
				if(typeof exp.operation === UNDEFINED) {
					exps = this.decomposeExp(exp.children[0], context);
				} else {
					exps = [this.decomposeOp(exp, context)];
				}
				break;
				
			case AST_NODE.VALUE:
				exps.push(exp);
				break;
				
			case AST_NODE.ID:
				exps.push(astLocateVar(exp.ref.content, context));
				break;
				
			case AST_NODE.FUNC_EXP:	//Should analyze in the future
			default:				//Undefined case
				exps = [null];
				break;
				
		}
		
		return exps;
		
	}
	
	decomposeOp(exp, context) {
		
		//Create op node
		let opNode = {
			op: exp.operation,
			children: []
		};
		
		//Get expressions
		for(let i = 0; i < exp.children.length; i++) {
			let newExp = this.decomposeExp(exp.children[i], context);
			if(newExp == null) {
				return null;
			} else {
				opNode.children.push(...newExp);
			}
		}
		
		return opNode;
		
	}
	
	operateCost(varRef, op, context) {
		
		//Check exps
		if(op == null) {
			return [null];
		}
		
		//Check operation (considerating exp lengths is ok)
		let costs = [];
		let subCosts = [];
		switch(op.op) {
				
			case OPERATION.PLUS:
			case OPERATION.MINUS:
			
				//Check complex expressions
				for(let i = 0; i < op.children.length; i++) {
					if(typeof op.children[i].op !== UNDEFINED) {
						let newCost = this.operateCost(varRef, op, context);
						if(newCost[0] == null) {
							return [null];
						} else {
							subCosts.push(newCost[0].max);	//1 cost
						}
					}
				}
				
				//Check operation
				if(subCosts.length == 0) {
					//Check if exists target var (2 exps at most)
					for(let i = 0; i < op.children.length; i++) {
						if(varRef == op.children[i]) {
							costs.push({
								max: {
									type: COST_TYPE.LIN,
									param: varRef.content
								},
								min: {
									type: COST_TYPE.LIN,
									param: varRef.content
								}
							});
						}
					}
				} else {
					
					//Get lowest cost
					this.reorderCosts(subCosts);
					let lowCost = subCosts[subCosts.length - 1];
					
					//Append to cost list
					costs.push({
						max: lowCost,
						min: lowCost
					});
					
				}
				
				break;
				
			case OPERATION.MULT:
			case OPERATION.DIV:
			case OPERATION.MOD:
				//TODO
				break;
				
			default:
				return [null];
				
		}
		
		return costs;
		
	}
	
	forkUpdate(varRef, node) {
		//TODO
		return [null];
	}
				
	loopUpdate(varRef, node) {
		//TODO
		return [null];
	}
	
	funcCallUpdate(varRef, node) {
		//TODO
		return [null];
	}
	
	getBoolUpdateCost(varRef, code) {
		//TODO
		return [null];
	}
	
	getDependencies(node, code, context) {
	
		//Check node type
		let deps = [];
		switch(node.type) {
			
			case AST_NODE.EXPRESSION:
				if(typeof node.operation === UNDEFINED) {
					deps.push(...this.getDependencies(node.children[0], code, context));
				} else {
					deps.push(...this.getDependencyOp(node, code, context));
				}
				break;
			
			case AST_NODE.VALUE:
				deps.push({
					content: node
				});
				break;
			
			case AST_NODE.ID:
				deps.push({
					content: astLocateVar(node.ref.content, context)
				});
				break;
				
			case AST_NODE.FUNC_EXP:
				deps.push(this.getFuncDependencyVars(node));
				break;
				
		}
		
		return deps;
	
	}
	
	getDependencyOp(node, code, context) {
		
		//Check if is compare operation
		switch(node.operation) {
				
			case OPERATION.LOW:
			case OPERATION.LOW_EQ:
			case OPERATION.GREAT:
			case OPERATION.GREAT_EQ:
				break;
				
			case OPERATION.EQ:
			case OPERATION.NOT_EQ:
			default:
				//Modify in the future
				return [];
				
		}
		
		//Get children dependencies
		let deps = [];
		for(let i = 0; i < node.children.length; i++) {
			let dep = this.getDependencies(node.children[i], code, context);
			if(dep.length > 0) {
				deps.push(dep);
			}
		}
		
		//Check dependencies
		if() {
		}
		
		return [];
		
	}
	
	getFuncDependencyVars(node) {
		return [];	//Condition modify in functions in the future
	}
	
	evalExpCost(node) {
		
		//Check node type
		let cost = [];
		switch(node.type) {
			
			case AST_NODE.EXPRESSION:
				for(let i = 0; i < node.children.length; i++) {
					cost.push(...this.evalExpCost(node.children[i]));
				}
				break;
			
			case AST_NODE.VALUE:
			case AST_NODE.ID:
				cost.push({
					max: {
						type: COST_TYPE.CONST,
						param: 1
					},
					min: {
						type: COST_TYPE.CONST,
						param: 1
					}
				});
				break;
				
			case AST_NODE.FUNC_EXP:
				cost.push(this.funcCallCost(node));
				break;
				
		}
		
		return cost;
		
	}
	
	isConstantExp(exp) {
		
		//Check node type
		let i;
		switch(exp.type) {
			
			case AST_NODE.EXPRESSION:
				for(i = 0; i < exp.children.length; i++) {
					if(!this.isConstantExp(exp.children[i])) {
						return false;
					}
				}
				break;
				
			case AST_NODE.ID:
				return false;
				
			case AST_NODE.FUNC_EXP:
				//return this.isConstantFunction(exp);
				return false;
				
		}
		
		//Any dependency found
		return true;
		
	}
	
	isConstantFunction(exp) {
		
		//Check params
		for(i = 0; i < exp.children.length; i++) {
			if(!this.isConstantExp(exp.children[i])) {
				return false;
			}
		}
		
		//Get func ref
		let funcName = exp.ref;
		let funcRef = this.astFunc[funcName];
		if(typeof funcRef === UNDEFINED) {
			return this.isConstantSysFunction(this.astSys[funcName]);
		}
		
		//Check return expressions
		let exps = funcRef.children[3].children;
		for(let i = 0; i < exps.length; i++) {
			if(!this.isConstantExp(exps[i])) {
				return false;
			}
		}
		
		//No dependency found
		return true;
		
	}
	
	isConstantSysFunction(funcRef) {
		//All prints: switch useful in the future, useless otherwise
		switch(funcRef.funcName) {
			
			case SYS_FUNC.INT:
			case SYS_FUNC.BOOL:
			case SYS_FUNC.INT:
			case SYS_FUNC.STRING:
				return true;

			default:
				return true;	//May not ever happen
				
		}
	}
	
	additiveCost(costs) {
		
		//Prepare cost
		let addCost = {
			max: null,
			min: null
		};
		
		//Check every cost
		for(let i = 0; i < costs.length; i++) {
			//Check first time
			if(addCost.max == null) {
				addCost.max = costs[i].max;
				addCost.min = costs[i].min;
			} else {
			
				//Check maxs
				let compare = this.costCompare(addCost.max, costs[i].max);
				if(compare == null) {
					addCost.max = {
						type: COST_TYPE.MAX,
						children: [
							addCost.max,
							costs[i].max
						]
					};
				} else {
					if(compare < 0) {
						addCost.max = costs[i].max;
					}
				}
			
				//Check mins
				compare = this.costCompare(addCost.min, costs[i].min);
				if(compare == null) {
					addCost.min = {
						type: COST_TYPE.MIN,
						children: [
							addCost.min,
							costs[i].min
						]
					};
				} else {
					if(compare < 0) {
						addCost.min = costs[i].min;
					}
				}
			
			}
		}
		
		return addCost;
		
	}
	
	productCost(costs) {
	
		//Prepare concat cost
		let concCost = {
			max: null,
			min: null
		};
	
		//Check every cost
		for(let i = 0; i < costs.length; i++) {
			//Check first time
			if(concCost.max == null) {
				concCost.max = {
					type: COST_TYPE.PROD,
					children: [costs[i].max]
				};
				concCost.min = {
					type: COST_TYPE.PROD,
					children: [costs[i].min]
				};
			} else {
				//Concat costs
				this.concatCost(concCost.max.children, costs[i].max);
				this.concatCost(concCost.min.children, costs[i].min);
			}
		}
		
		//Check product length
		if(concCost.max.children.length == 1) {
			concCost.max = concCost.max.children[0];
		}
		if(concCost.min.children.length == 1) {
			concCost.min = concCost.min.children[0];
		}
		
		return concCost;
	
	}
	
	concatCost(prodCost, cost) {
		
		//Check if prodCost contains infinity
		if(prodCost[0].type == COST_TYPE.INF) {
			return;
		}
		
		//Check if cost is polynomic
		let costCopy = {...cost};
		if(cost.type != COST_TYPE.POL) {
			costCopy.type = COST_TYPE.POL;
			costCopy.param = cost;
			costCopy.paramExtra = {
				type: COST_TYPE.CONST,
				param: 1
			};
		}
		
		//Check if cost already exists
		for(let i = 0; i < prodCost.length; i++) {
			
			//Check if cost is polynomic
			let prodCostCopy = {...prodCost[i]};
			if(prodCostCopy.type != COST_TYPE.POL) {
				prodCostCopy.type = COST_TYPE.POL;
				prodCostCopy.param = prodCost[i];
				prodCostCopy.paramExtra = {
					type: COST_TYPE.CONST,
					param: 1
				};
			}
			
			//Compare costs
			let compareResult = this.costCompare(costCopy, prodCostCopy);
			if(compareResult != null && compareResult == 0) {
				
				//Check if are const type or infinity
				if(costCopy.param.type == COST_TYPE.CONST || costCopy.param.type == COST_TYPE.INF) {
					return;
				}
				
				//Same cost --> Increase exponent
				prodCostCopy.paramExtra.param++;
				
				//Check if is requried to be added
				if(prodCost[i].type != prodCostCopy.type) {
					prodCost.splice(i, 1);
					prodCost.push(prodCostCopy);
				}
				
				//Reorder costs
				this.reorderCosts(prodCost);
				return;
				
			}
			
		}
		
		//Cost not found: check infinity case
		if(cost.type == COST_TYPE.INF) {
			prodCost.splice(0, prodCost.length);
		}
		
		//Append cost
		prodCost.push(cost);
		this.reorderCosts(prodCost);
		
	}
	
	reorderCosts(costs) {
		for(let i = 0; i < costs.length - 1; i++) {
			let maxIdx = i;
			for(let j = i + 1; j < costs.length; j++) {
				let compareResult = this.costCompare(costs[j], costs[maxIdx]);
				if(compareResult != null && compareResult > 0) {
					maxIdx = j;
				}
			}
			this.costSwap(costs, maxIdx, i);
		}
	}
	
	costSwap(costs, i, j) {
		let tmp = costs[i];
		costs[i] = costs[j];
		costs[j] = tmp;
	}
	
	costCompare(cost1, cost2) {
		//Check if are equal
		if(cost1.type == cost2.type) {
			//Check type
			switch(cost1.type) {
			
				case COST_TYPE.CONST:
					return cost1.param - cost2.param;
					
				case COST_TYPE.LIN:
					if(cost1.param == cost2.param) {
						return 0;
					}
					return null;
					
				case COST_TYPE.LOG:
				case COST_TYPE.POL:
				case COST_TYPE.EXP:
					let baseComp = this.costCompare(cost1.paramExtra, cost2.paramExtra);
					if(baseComp == null) {
						return null;
					} else {
						let expComp = this.costCompare(cost1.param, cost2.param);
						if(expComp == null) {
							return null;
						} else {
							if(baseComp == 0 && expComp == 0) {
								return 0;
							} else if(baseComp != 0 && expComp == 0)  {
								return baseComp;
							} else if(baseComp == 0 && expComp != 0) {
								return expComp;
							} else {
								return null;
							}
						}
					}
					
				case COST_TYPE.PROD:
					return this.customCostCompare(cost1, cost2);
					
				case COST_TYPE.MAX:
					return this.maxCostCompare(cost1, cost2);
					
				case COST_TYPE.MIN:
					return this.minCostCompare(cost1, cost2);
					
				case COST_TYPE.INF:
					return 0;
					
			}
		} else {
			//Check type
			if(cost1.type == COST_TYPE.PROD) {
				return this.hybridCustomCostCompare(cost1, cost2);
			} else if(cost2.type == COST_TYPE.PROD) {
				let compareResult = this.hybridCustomCostCompare(cost2, cost1);
				return compareResult == null ? null : -compareResult;
			} else {
				if(cost1.type == COST_TYPE.MAX) {
					return this.hybridMaxCostCompare(cost1, cost2);
				} else if(cost2.type == COST_TYPE.MAX) {
					let compareResult = this.hybridMaxCostCompare(cost2, cost1);
					return compareResult == null ? null : -compareResult;
				} else {
					if(cost1.type == COST_TYPE.MIN) {
						return this.hybridMinCostCompare(cost1, cost2);
					} else if(cost2.type == COST_TYPE.MIN) {
						let compareResult = this.hybridMinCostCompare(cost2, cost1);
						return compareResult == null ? null : -compareResult;
					} else {
						if(cost1.type == COST_TYPE.INF) {
							return 1;
						} else if(cost2.type == COST_TYPE.INF) {
							return -1;
						} else {
							return cost1.type.order - cost2.type.order;
						}
					}
				}
			}
		}
	}
	
	minCostCompare(cost1, cost2) {
		
		//Get comparissons for every max component
		let compareResults = [];
		for(let i = 0; i < cost1.children.length; i++) {
			for(let j = 0; j < cost2.children.length; j++) {
				compareResults.push(this.costCompare(cost1.children[i], cost2.children[j]));
			}
		}
		
		//Check if all comparissons have same result
		for(let i = 0; i < compareResults.length - 1; i++) {
			if(compareResults[i] != compareResults[i + 1] || compareResults[i] == null) {
				return null;
			}
		}
		
		//Same results
		return -compareResults[0];
		
	}
	
	hybridMinCostCompare(minCost, cost) {
		
		//Get comparissons for every max component
		let compareResults = [];
		for(let i = 0; i < minCost.children.length; i++) {
			compareResults.push(this.costCompare(minCost.children[i], cost));
		}
		
		//Check if all comparissons have same result
		for(let i = 0; i < compareResults.length - 1; i++) {
			if(compareResults[i] != compareResults[i + 1] || compareResults[i] == null) {
				return null;
			}
		}
		
		//Same results
		return -compareResults[0];
		
	}
	
	maxCostCompare(cost1, cost2) {
		
		//Get comparissons for every max component
		let compareResults = [];
		for(let i = 0; i < cost1.children.length; i++) {
			for(let j = 0; j < cost2.children.length; j++) {
				compareResults.push(this.costCompare(cost1.children[i], cost2.children[j]));
			}
		}
		
		//Check if all comparissons have same result
		for(let i = 0; i < compareResults.length - 1; i++) {
			if(compareResults[i] != compareResults[i + 1]) {
				return null;
			}
		}
		
		//Same results
		return compareResults[0];
		
	}
	
	hybridMaxCostCompare(maxCost, cost) {
		
		//Get comparissons for every max component
		let compareResults = [];
		for(let i = 0; i < maxCost.children.length; i++) {
			compareResults.push(this.costCompare(maxCost.children[i], cost));
		}
		
		//Check if all comparissons have same result
		for(let i = 0; i < compareResults.length - 1; i++) {
			if(compareResults[i] != compareResults[i + 1]) {
				return null;
			}
		}
		
		//Same results
		return compareResults[0];
		
	}
	
	customCostCompare(cost1, cost2) {
		
		//Compare costs
		for(let i = 0; i < cost1.children.length; i++) {
			
			//Check if cost2 children also exists
			if(i >= cost2.children.length) {
				break;
			}
			
			//Compare costs by equals
			let compareResult = this.costCompare(cost1.children[i], cost2.children[i]);
			if(compareResult == null) {
				return null;
			} else {
				if(compareResult != 0) {
					return compareResult;
				}
			}
			
		}
		
		//Larger cost is the higher cost
		return cost1.children.length - cost2.children.length;
		
	}
	
	hybridCustomCostCompare(customCost, cost) {
		
		//Compare costs
		let compareResult = this.costCompare(customCost.children[0], cost);
		if(compareResult != null && compareResult == 0) {
			compareResult = 1;
		}
		
		return compareResult;
		
	}
	
	displayLocalCost(cost, lineStart, lineEnd, offsetStart, offsetEnd, color) {
		this.costDisplay.markContent(lineStart, lineEnd, offsetStart, offsetEnd, color, this.getTip(cost));
	}
	
	displayGlobalCost(cost) {
		this.costConsole.displayMsg(this.getTip(cost), true);
	}
	
	getTip(cost) {
		
		//Check cost info
		let tip = EMPTY;
		let compare = this.costCompare(cost.max, cost.min);
		if(compare == null || compare != 0) {
			tip += MSG_BIG_OH.format(this.getHRCost(cost.max)) + LINE_BREAK;
			tip += MSG_BIG_OMEGA.format(this.getHRCost(cost.min));
		} else {
			tip += MSG_BIG_THETA.format(this.getHRCost(cost.max));
		}
		
		return tip;
		
	}
	
	getHRCost(cost) {
		switch(cost.type) {
			
			case COST_TYPE.CONST:
				return MSG_COST_CONST;
				
			case COST_TYPE.LIN:
				return cost.param;
				
			case COST_TYPE.LOG:
				return MSG_COST_LOG.format(this.getHRCost(cost.param));
				
			case COST_TYPE.POL:
			case COST_TYPE.EXP:
				return MSG_COST_EXP.format(this.getHRCost(cost.param), this.getHRCost(cost.paramExtra));
			
			case COST_TYPE.PROD:
				let hrCost = EMPTY;
				for(let i = 0; i < cost.children.length; i++) {
					if(i > 0) {
						hrCost = MSG_COST_MULT.format(hrCost, this.getHRCost(cost.children[i]));
					} else {
						hrCost += this.getHRCost(cost.children[i]);
					}
				}
				return hrCost;
				
			case COST_TYPE.MAX:
				return MSG_COST_MAX.format(this.getHRCost(cost.children[0]), this.getHRCost(cost.children[1]));
				
			case COST_TYPE.MIN:
				return MSG_COST_MIN.format(this.getHRCost(cost.children[0]), this.getHRCost(cost.children[1]));
				
			case COST_TYPE.INF:
				return INFINITE;
				
		}
	}

}
