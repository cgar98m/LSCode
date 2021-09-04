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

const BASIC_LOG_BASE = "2";

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
		//Just in case try-catch (required to test as much as possible)
		try {
			
			//Get required data
			this.astTree = astCopy(astTree, null);
			this.astFunc = astCopy(astFunc, this.astTree.context);
			this.astSys = astCopy(astSys, this.astTree.context);
			
			//Clear display tips and global cost
			this.clear();
			
			//Prepare code runner
			this.codeRunner = new CodeRunner(this.astSys, this.astFunc, this.astTree.context, this.costConsole);
			
			//Analyze cost
			let error = !this.analyzeFuncCost(this.astSys);
			if(!error) {
				error = !this.analyzeFuncCost(this.astFunc);
			}
			if(!error) {
				error = !this.analyzeCodeCost(this.astTree, true);
			}
			
			//Display costs
			if(!error) {
				
				//Display main costs
				this.displayCosts(this.astTree, 0);
				
				//Display funcs cost
				let funcs = Object.keys(this.astFunc);
				for(let i = 0; i < funcs.length; i++) {
					this.displayCosts(this.astFunc[funcs[i]], 0);
				}
				
			} else {
				this.costConsole.displayMsg(MSG_INCOMPLETE_COST);
			}
		
		} catch(e) {
			this.clear();
			this.costConsole.displayMsg(ERROR_COST_UNKNOWN);
			this.costConsole.displayMsg(MSG_INCOMPLETE_COST);
		}
	}
	
	displayCosts(node, colorIdx) {
		//Check node type
		if(node.type == AST_NODE.STRUCT) {
			
			//Check if is root node
			if(node == this.astTree) {
				if(typeof node.cost != UNDEFINED) {
					this.displayGlobalCost(node.cost);
				}
			}
			
			//Process actions
			for(let i = 0; i < node.children.length; i++) {
				this.displayCosts(node.children[i], (colorIdx + i) % BG_COLOR_CLASSES.length);
			}
			
		} else {
			
			//Check if cost exists
			if(typeof node.cost == UNDEFINED && node.semantica != SEMANTICA_KEYS.FUNC_CALL) {
				return;
			}
			
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
	
	displayExpCost(node, colorIdx, prevRange) {
		//Check node type
		switch(node.type) {
			
			case AST_NODE.ID:
			case AST_NODE.VALUE:
				if(prevRange != null) {
					this.displayLocalCost(node.cost, prevRange.lineStart, prevRange.lineEnd, prevRange.offsetStart, prevRange.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
				}
				break;
			
			case AST_NODE.EXPRESSION:
				if(prevRange != null) {
					this.displayLocalCost(node.cost, prevRange.lineStart, prevRange.lineEnd, prevRange.offsetStart, prevRange.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
					for(let i = 0; i < node.children.length; i++) {
						this.displayExpCost(node.children[i], (colorIdx + 1) % BG_COLOR_CLASSES.length, null);
					}
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
			this.displayExpCost(node.children[1].children[i], (colorIdx + 1) % BG_COLOR_CLASSES.length, {
				lineStart: node.children[1].realRange[i].lineStart,
				lineEnd: node.children[1].realRange[i].lineEnd,
				offsetStart: node.children[1].realRange[i].offsetStart,
				offsetEnd: node.children[1].realRange[i].offsetEnd
			});
		}
		
	}
	
	displayCodeJumpCost(node, colorIdx) {
		
		//Display code jump cost
		this.displayLocalCost(node.cost, node.lineStart, node.lineEnd, node.offsetStart, node.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
		
		//Display condition cost
		let cNode = node.children[0].children[0];
		this.displayExpCost(cNode, (colorIdx + 1) % BG_COLOR_CLASSES.length, {
			lineStart: node.children[0].realRange.lineStart,
			lineEnd: node.children[0].realRange.lineEnd,
			offsetStart: node.children[0].realRange.offsetStart,
			offsetEnd: node.children[0].realRange.offsetEnd
		});
		
		//Display subcode costs
		for(let i = 0; i < node.children[1].children.length; i++) {
			this.displayCosts(node.children[1].children[i], (colorIdx + 2) % BG_COLOR_CLASSES.length);
		}
		
	}
	
	displayFuncCallCost(node, colorIdx) {
		
		//Display call cost
		this.displayLocalCost(node.cost, node.lineStart, node.lineEnd, node.offsetStart, node.offsetEnd, BG_COLOR_CLASSES[colorIdx]);
		
		//Display params cost
		for(i = 0; i < node.children.length; i++) {
			let exp = node.children[i];
			this.displayExpCost(exp, (colorIdx + 2) % BG_COLOR_CLASSES.length, {
				lineStart: node.realRange[i].lineStart,
				lineEnd: node.realRange[i].lineEnd,
				offsetStart: node.realRange[i].offsetStart,
				offsetEnd: node.realRange[i].offsetEnd
			});
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
				this.displayExpCost(exp, (colorIdx + 3) % BG_COLOR_CLASSES.length, {
					lineStart: rNode.realRange[i].lineStart,
					lineEnd: rNode.realRange[i].lineEnd,
					offsetStart: rNode.realRange[i].offsetStart,
					offsetEnd: rNode.realRange[i].offsetEnd
				});
			}
		}
		
	}
	
	analyzeFuncCost(funcs) {
		
		//Check if any function exists
		let funcKeys = Object.keys(funcs);
		if(funcKeys.length == 0) {
			return true;
		}
		
		//Analyze functions cost
		for(let i = 0; i < funcKeys.length; i++) {
			
			//Get func
			let funcRef = funcs[funcKeys[i]];
			
			//Calculate content cost
			let funcCosts = [];
			if(funcRef.children[2].children.length != 0) {
				if(this.analyzeCodeCost(funcRef.children[2].children[0], false)) {
					funcCosts.push(funcRef.children[2].children[0].cost);
				} else {
					return false;
				}
			}
			
			//Calculate return cost
			if(funcRef.children[3].children.length != 0) {
				let subCosts = [];
				for(let j = 0; j < funcRef.children[3].children.length; j++) {
					let returnCosts = this.evalExpCost(funcRef.children[3].children[j], false);
					if(typeof returnCosts.find(item => item == null) == UNDEFINED) {
						funcRef.children[3].children[j].cost = this.additiveCost(returnCosts);
						subCosts.push(funcRef.children[3].children[j].cost);
					} else {
						return false;
					}
				}
				funcRef.children[3].cost = this.additiveCost(subCosts);
				funcCosts.push(funcRef.children[3].cost);
			}
			
			//Calculate final cost
			if(funcCosts.length == 0) {
				funcRef.cost = {
					max: {
						type: COST_TYPE.CONST,
						param: 1
					},
					min: {
						type: COST_TYPE.CONST,
						param: 1
					}
				};
			} else {
				funcRef.cost = this.additiveCost(funcCosts);
			}
			
		}
		
		//All ok
		return true;
		
	}
	
	analyzeCodeCost(node, funcOn) {
		
		//Check if any action exists
		if(node.children.length == 0) {
			return true;
		}
		
		//Process actions
		let costs = [];
		for(let i = 0; i < node.children.length; i++) {
			let cost = this.analyzeAction(node.children[i], funcOn);
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
	
	analyzeAction(node, funcOn) {
		//Check action
		switch(node.semantica) {
			
			case SEMANTICA_KEYS.VAR_ASSIGN:
				return this.varAssignCost(node, funcOn);
				
			case SEMANTICA_KEYS.FORK:
				return this.forkCost(node, funcOn);
				
			case SEMANTICA_KEYS.LOOP:
				return this.loopCost(node, funcOn);
				
			case SEMANTICA_KEYS.FUNC_CALL:
				
				//Check if func calls are available
				if(funcOn || this.isSysFunc(node.ref)) {
					return this.funcCallCost(node);
				}
				
				//Funcs not available
				this.costConsole.displayMsg(ERROR_INVALID_FUNC.format(node.ref, node.lineStart, node.lineEnd));
				return null;
				
			default:	//Undefined case (may not ever happen)
				return null;
				
		}
	}
	
	varAssignCost(node, funcOn) {
		
		//Get expressions
		let exps = node.children[1];
		
		//Get expressions cost
		let expCosts = [];
		for(let i = 0; i < exps.children.length; i++) {
			let costs = this.evalExpCost(exps.children[i], funcOn);
			for(let j = 0; j < costs.length; j++) {
				if(costs[j] == null) {
					return null;
				} else {
					exps.children[i].cost = costs[j];
					expCosts.push(costs[j]);
				}
			}
		}
		
		//Get cost range
		node.cost = this.additiveCost(expCosts);
		exps.cost = node.cost;
		return node.cost;
		
	}
	
	forkCost(node, funcOn) {
		
		//Get condition cost
		let costs = this.evalExpCost(node.children[0].children[0], funcOn);
		for(let i = 0; i < costs.length; i++) {
			if(costs[i] == null) {
				return null;
			}
		}
		let conditionCost = this.additiveCost(costs);
		node.children[0].children[0].cost = conditionCost;
		
		//Get sub-costs
		for(let i = 0; i < node.children[1].children.length; i++) {
			if(!this.analyzeCodeCost(node.children[1].children[i], funcOn)) {
				return null;
			}
		}
		
		//Check branches to assign fork cost
		node.cost = conditionCost;
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
							if(node.children[1].children[i].children.length > 0) {
								node.cost = this.additiveCost([node.cost, node.children[1].children[i].cost]);
							}
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
				if(this.reorderCosts(maxs, false)) {
					maxs = [{
						type: COST_TYPE.MAX,
						children: [...maxs]
					}];
				}
				if(this.reorderCosts(mins, false)) {
					mins = [{
						type: COST_TYPE.MIN,
						children: [...mins]
					}];
				}
				
				//Select fork cost (highest max, lowest min --> worst & best case)
				node.cost = this.additiveCost([node.cost, {
					max: maxs[0],
					min: mins[mins.length - 1]
				}]);
			
			}
		}
		
		return node.cost;
		
	}
	
	loopCost(node, funcOn) {
		
		//Get condition cost
		let costs = this.evalExpCost(node.children[0].children[0], funcOn);
		for(let i = 0; i < costs.length; i++) {
			if(costs[i] == null) {
				return null;
			}
		}
		let conditionCost = this.additiveCost(costs);
		node.children[0].children[0].cost = conditionCost;
		
		//Analyze loop code cost
		if(node.children[1].children.length > 0) {
			if(!this.analyzeCodeCost(node.children[1].children[0], funcOn)) {
				return null;
			}
		}
		
		//Check condition
		node.cost = conditionCost;
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
			
			//Check if exists any loop content
			if(node.children[1].children.length == 0) {
				node.cost = this.additiveCost([node.cost, {
					max: {
						type: COST_TYPE.INF
					},
					min: {
						type: COST_TYPE.CONST,
						param: 1
					}
				}]);
			} else {
				//Check not empty loop (var definitions could exist)
				if(node.children[1].children[0].children.length > 0) {
					//Get iteration cost
					let itCost = this.getIterationCost(node);
						if(itCost == null) {
							return null;
						} else {
							node.cost = this.productCost([itCost, this.additiveCost([node.cost, node.children[1].children[0].cost])]);
						}
					} else {
						node.cost = this.additiveCost([node.cost, {
						max: {
							type: COST_TYPE.INF
						},
						min: {
							type: COST_TYPE.CONST,
							param: 1
						}
					}]);
				}
			}
			
		}
		
		return node.cost;
		
	}
	
	funcCallCost(node) {
		
		//TODO
		
		//Analyze params cost
		let paramsCost = [];
		for(let i = 0; i < node.children.length; i++) {
			let costs = this.evalExpCost(node.children[i], true);
			for(let j = 0; j < costs.length; j++) {
				if(costs[j] == null) {
					return null;
				} else {
					node.children[i].cost = costs[j];
					paramsCost.push(costs[j]);
				}
			}
		}
		
		if(this.isSysFunc(node.ref)) {
			node.cost =  this.additiveCost([this.astSys[node.ref].cost, ...paramsCost]);
		} else {
			node.cost = this.additiveCost([this.astFunc[node.ref].cost, ...paramsCost]);
		}
		
		return node.cost;
		
	}
	
	getIterationCost(node) {
		
		//Check if has code to run (updates condition dependency)
		if(node.children[1].children.length == 0) {
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
		
		//Get condition var dependencies
		let deps = this.getCompDependencies(node);
		if(deps.length != 2) {
			//No valid comparison found
			this.costConsole.displayMsg(ERROR_CONDITION_DEP.format(node.lineStart, node.offsetStart));
			return null;
		}
		
		//Check valid dependencies
		if(!deps[0].update && deps[1].update) {
			return this.getDepCost(deps[0], deps[1]);
		} else if(deps[0].update && !deps[1].update) {
			return this.getDepCost(deps[1], deps[0]);
		} else {
			//No valid comparison found
			this.costConsole.displayMsg(ERROR_CONDITION_DEP.format(node.lineStart, node.offsetStart));
			return null;
		}
		
	}
	
	getDepCost(constDep, varDep) {
		
		//Prepare base cost
		let cost = {
			max: {
				type: varDep.costType
			},
			min: {
				type: varDep.costType
			}
		};
		
		//Set params
		if(varDep.costType != COST_TYPE.LIN) {
			
			//Max
			cost.max.param = {
				type: COST_TYPE.LIN,
				param: constDep.content
			};
			cost.max.paramExtra = {
				type: COST_TYPE.LIN,
				param: varDep.content
			};
			
			//Min
			cost.min.param = {
				type: COST_TYPE.LIN,
				param: constDep.content
			};
			cost.min.paramExtra = {
				type: COST_TYPE.LIN,
				param: varDep.content
			};
			
		} else {
			cost.max.param = constDep.content;
			cost.min.param = constDep.content;
		}
		
		return cost;
		
	}
	
	getCompDependencies(node) {
		
		//Get comparison
		let compExp = this.getComparison(node.children[0].children[0]);
		
		//Check comparison existance
		if(compExp == null) {
			return [];
		}
		
		//Check integer comparison
		if(compExp.children[0].dataType != DATA_TYPES.INT || compExp.children[1].dataType != DATA_TYPES.INT) {
			this.costConsole.displayMsg(ERROR_CONDITION_NOT_INT.format(node.lineStart, node.offsetStart));
			return [];
		}
		
		//Get dependencies
		let deps = [];
		for(let i = 0; i < compExp.children.length; i++) {
			
			//Get dependency
			let newDep = this.getComparisonDependency(compExp.children[i]);
			
			//Check valid dependency
			if(newDep == null) {
				continue;
			}
			
			//Check if is var
			if(typeof newDep.update != UNDEFINED) {
				deps.push(newDep);
			} else {
				let varUpdate = this.checkVarUpdate(newDep, node.children[1].children[0]);
				if(varUpdate == null) {
					continue;
				} else {
					newDep.update = varUpdate;
					deps.push(newDep);
				}
			}
			
		}
		
		return deps;
		
	}
	
	getCostFromOp(op) {
		switch(op) {
		
			case OPERATION.PLUS:
			case OPERATION.MINUS:
				return COST_TYPE.LIN;
				
			case OPERATION.MULT:
			case OPERATION.DIV:
				return COST_TYPE.LOG;
		
			default:	//May not ever happen
				return null;
		
		}
	}
	
	checkVarUpdate(varDep, node) {
		
		//Locate all var assigns that modify var dependency
		let varAssigns = this.extractVarAssign(varDep.content, node);
		if(typeof varAssigns.find(item => item == null) != UNDEFINED) {
			return null;
		}
		
		//Check if no var assign was found
		if(varAssigns.length == 0) {
			return false;
		}
		
		//Analyze assigns
		let varAssignOps = [];
		for(let i = 0; i < varAssigns.length; i++) {
			let varAssignOp = this.extractVarModification(varAssigns[i]);
			if(varAssignOp == null) {
				return null;
			} else {
				varAssignOps.push(varAssignOp);
			}
		}
		
		//Get shortest cost operation
		let lowestAssign = {
			costOp: this.getCostFromOp(varAssignOps[0].op),
			content: varAssignOps[0].content
		}
		for(let i = 1; i < varAssignOps.length; i++) {
			
			//Get cost from operation
			let costOp = this.getCostFromOp(varAssignOps[i].op);
			
			//Check cost type
			let costComp = this.emptyCostCompare(lowestAssign.costOp, costOp);
			if(costComp > 0) {
				lowestAssign.costOp = costOp;
				lowestAssign.content = varAssignOps[i].content;
			} else if(costComp == 0) {
				if(parseInt(lowestAssign.costOp) - parseInt(varAssignOps[i].content) < 0) {
					lowestAssign.costOp = costOp;
					lowestAssign.content = varAssignOps[i].content;
				}
			}
			
		}
		
		//Set cost associated to operation
		varDep.costType = lowestAssign.costOp;
		varDep.content = lowestAssign.content;
		return true;
		
	}
	
	extractVarModification(varAssign) {
		
		//Check if modifies itself
		let varName = varAssign.children[0].children[0].children[0].content;
		let exp = varAssign.children[1].children[0];
		if(!this.isVarSelfUpdated(exp, varName)) {
			this.costConsole.displayMsg(ERROR_COST_SELF_UPDATE.format(varName, varAssign.lineStart, varAssign.offsetStart));
			return null;
		}
		
		//Check if modification is simple
		let values = [];
		for(let i = 0; i < exp.children.length; i++) {
			if(this.isSimpleExp(exp.children[i])) {
				values.push(exp.children[i]);
			} else {
				this.costConsole.displayMsg(ERROR_COST_COMPLEX_UPDATE.format(varName, varAssign.lineStart, varAssign.offsetStart));
				return null;
			}
		}
		
		//Get var modification
		let duplicated = false;
		let opReturn = {
			op: exp.operation
		};
		for(let i = 0; i < values.length; i++) {
			if(values[i].type == AST_NODE.VALUE) {
				opReturn.content = values[i].value.content;
			} else {
				
				//Prepare return
				opReturn.content = values[i].ref.content;
				
				if(opReturn.content == varName) {
					if(duplicated) {
						opReturn.op = OPERATION.MULT,
						opReturn.content = BASIC_LOG_BASE;
					} else {
						duplicated = true;
					}
				}
				
			}
		}
		
		return opReturn;
		
	}
	
	isSimpleExp(exp) {
		
		//Check simple expression
		if(exp.type == AST_NODE.ID || exp.type == AST_NODE.VALUE) {
			return true;
		}
		
		return false;
		
	}
	
	isVarSelfUpdated(exp, varName) {
		
		//Find var
		switch(exp.type) {
			
			case AST_NODE.EXPRESSION:
				for(let i = 0; i < exp.children.length; i++) {
					if(this.isVarSelfUpdated(exp.children[i], varName)) {
						return true;
					}
				}
				break;
				
			case AST_NODE.ID:
				return exp.ref.content == varName;
				
		}
		
		//Not found
		return false;
		
	}
	
	extractVarAssign(varName, node) {
		
		//Get var assigns where var name is located
		let assigns = [];
		for(let i = 0; i < node.children.length; i++) {
			if(node.children[i].semantica == SEMANTICA_KEYS.VAR_ASSIGN) {
				let varAssign = node.children[i];
				for(let j = 0; j < varAssign.children[0].children.length; j++) {
					for(let k = 0; k < varAssign.children[0].children[j].children.length; k++) {
						let varNode = varAssign.children[0].children[j].children[k];
						if(varNode.content == varName) {
							if(varAssign.children[0].children.length == 1 && varAssign.children[0].children[j].children.length == 1) {
								assigns.push(varAssign);
							} else {
								this.costConsole.displayMsg(ERROR_COST_LOOP_MULTIVAR.format(varName, varAssign.lineStart, varAssign.offsetStart));
								return [null];
							}
						}
					}
				}
			}
		}
		
		return assigns;
		
	}
	
	getComparison(exp) {
		
		//Check expression
		if(exp.type == AST_NODE.EXPRESSION) {
			//Check operation
			if(OP_COMPARISSON[exp.operation]) {
				return exp;
			} else {
				for(let i = 0; i < exp.children.length; i++) {
					let compExp = this.getComparison(exp.children[i]);
					if(compExp != null) {
						return compExp;
					}
				}
			}
		}
		
		//Comparisson not found
		return null;
		
	}
	
	getComparisonDependency(exp) {
		if(exp.type == AST_NODE.VALUE) {
			return {
				content: exp.value.content,
				update: false
			};
		} else if(exp.type == AST_NODE.ID) {
			return {
				content: exp.ref.content
			};
		}
	}
	
	evalExpCost(node, funcOn) {
		
		//Check node type
		let cost = [];
		switch(node.type) {
			
			case AST_NODE.EXPRESSION:
				for(let i = 0; i < node.children.length; i++) {
					cost.push(...this.evalExpCost(node.children[i], funcOn));
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
			
				//Check if func calls are available
				if(funcOn) {
					cost.push(this.funcCallCost(node));
				} else {
					this.costConsole.displayMsg(ERROR_INVALID_FUNC.format(node.ref, node.lineStart, node.lineEnd));
					cost.push(null);
				}
				break;
				
		}
		
		return cost;
		
	}
	
	isConstantExp(exp) {
		
		//Check node type
		switch(exp.type) {
			
			case AST_NODE.EXPRESSION:
				for(let i = 0; i < exp.children.length; i++) {
					if(!this.isConstantExp(exp.children[i])) {
						return false;
					}
				}
				break;
				
			case AST_NODE.ID:
				return false;
				
			case AST_NODE.FUNC_EXP:
				return false;
				
		}
		
		//Any dependency found
		return true;
		
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
				
				//Concat max costs
				if(costs[i].max.type == COST_TYPE.PROD) {
					for(let j = 0; j < costs[i].max.children.length; j++) {
						this.concatCost(concCost.max.children, costs[i].max.children[j]);
					}
				} else {
					this.concatCost(concCost.max.children, costs[i].max);
				}
				
				//Concat costs
				if(costs[i].min.type == COST_TYPE.PROD) {
					for(let j = 0; j < costs[i].min.children.length; j++) {
						this.concatCost(concCost.min.children, costs[i].min.children[j]);
					}
				} else {
					this.concatCost(concCost.min.children, costs[i].min);
				}
				
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
		
		//Check if cost contains infinity
		if(cost.type == COST_TYPE.INF) {
			prodCost.splice(0, prodCost.length);
			prodCost.push(cost);
			return;
		}
		
		//Check if prodCost is constant
		if(prodCost[0].type == COST_TYPE.CONST) {
			prodCost.splice(0, prodCost.length);
			prodCost.push(cost);
			return;
		}
		
		//Check if new cost is constant
		if(cost.type == COST_TYPE.CONST) {
			this.reorderCosts(prodCost, true);
			return;
		}
		
		//Transform to polinomic cost
		let costCopy = {...cost};
		if(cost.type != COST_TYPE.POL) {
			costCopy.type = COST_TYPE.POL;
			costCopy.param = cost;
			costCopy.paramExtra = {
				type: COST_TYPE.CONST,
				param: 1
			};
		}
		
		//Set exponent to 1
		let tmpCostParamExtra = costCopy.paramExtra.param;
		costCopy.paramExtra.param = 1;
		
		//Check if cost already exists
		for(let i = 0; i < prodCost.length; i++) {
			
			//Transform prodCost to polynomic
			let prodCostCopy = {...prodCost[i]};
			if(prodCostCopy.type != COST_TYPE.POL) {
				prodCostCopy.type = COST_TYPE.POL;
				prodCostCopy.param = prodCost[i];
				prodCostCopy.paramExtra = {
					type: COST_TYPE.CONST,
					param: 1
				};
			}
			
			//Set exponent to 1
			let tmpProdCostParamExtra = prodCostCopy.paramExtra.param;
			prodCostCopy.paramExtra.param = 1;
			
			//Compare costs
			let compareResult = this.costCompare(costCopy, prodCostCopy);
			prodCostCopy.paramExtra.param = tmpProdCostParamExtra;
			if(compareResult != null && compareResult == 0) {
				
				//Same cost --> Increase exponent
				prodCostCopy.paramExtra.param += tmpCostParamExtra;
				
				//Check if is requried to be added
				if(prodCost[i].type != prodCostCopy.type) {
					prodCost.splice(i, 1);
					prodCost.push(prodCostCopy);
				}
				
				//Reorder costs
				this.reorderCosts(prodCost, true);
				return;
				
			}
			
		}
		
		//Recover previous param extra if required
		if(cost.type == costCopy.type) {
			cost.paramExtra.param = tmpCostParamExtra;
		}
		
		//Cost not found
		prodCost.push(cost);
		this.reorderCosts(prodCost, true);
		
	}
	
	reorderCosts(costs, pruneConst) {
		
		//Reorder
		let koReorder = false;
		for(let i = 0; i < costs.length - 1; i++) {
			let maxIdx = i;
			for(let j = i + 1; j < costs.length; j++) {
				let compareResult = this.costCompare(costs[j], costs[maxIdx]);
				if(compareResult != null) {
					if(compareResult > 0) {
						maxIdx = j;
					}
				} else {
					koReorder = true;
				}
			}
			this.costSwap(costs, maxIdx, i);
		}
		
		//Prune constants
		if(pruneConst) {
			for(let i = costs.length - 1; i > 0; i--) {
				if(costs[i].type == COST_TYPE.CONST) {
					costs.splice(i, 1);
				} else {
					break;
				}
			}
		}
		
		return koReorder;
		
	}
	
	costSwap(costs, i, j) {
		let tmp = costs[i];
		costs[i] = costs[j];
		costs[j] = tmp;
	}
	
	emptyCostCompare(cost1, cost2) {
		if(cost1 == cost2) {
			return 0;
		} else {
			return cost1.order - cost2.order;
		}
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
					} else {
						//Check if can be parsed to int
						let toInt = [parseInt(cost1.param), parseInt(cost2.param)];
						if(!isNaN(toInt[0]) && !isNaN(toInt[1])) {
							return toInt[0] - toInt[1];
						}
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
		return compareResults[0];
		
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
		return compareResults[0];
		
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
				return MSG_COST_CONST.format(cost.param);
				
			case COST_TYPE.LIN:
				return cost.param;
				
			case COST_TYPE.LOG:
				return MSG_COST_LOG.format(this.getHRCost(cost.param), this.getHRCost(cost.paramExtra));
				
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

	isSysFunc(funcName) {
		return typeof this.astSys[funcName] !== UNDEFINED;
	}

}
