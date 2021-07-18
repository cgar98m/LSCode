const RULE_ITEM_TYPE = {
	TERMINAL: 'T',
	PRODUCTION: 'P'
}
const NODE_TYPE = {
	PRODUCTION: 'P',
	FORK: 'F',
	TERMINAL: 'T',
	EPSILON: 'E'
}
const EPSILON = "EPSILON";
const GHOST_INFO = "GHOST TOKEN";

class Parser {
	
	constructor(lexic, grammar, errorHandler) {
		
		//Keep error handler
		this.errorHandler = errorHandler;
		
		//Map grammar by production id
		this.grammarMap = [];
		for(let i = 0; i < grammar.length; i++) {
			this.grammarMap[grammar[i].production_id] = {
				rules: grammar[i].rules
			};
		}
		
		//Classify rule items (lexic = terminal, grammar = production)
		this.ruleItemTypes = [];
		for(let i = 0; i < lexic.length; i++) {
			this.ruleItemTypes[lexic[i].token_id] = RULE_ITEM_TYPE.TERMINAL;
		}
		for(let prodId in this.grammarMap) {
			this.ruleItemTypes[prodId] = RULE_ITEM_TYPE.PRODUCTION;
		}
		
		//Prepare first & follow
		this.firstFollow = new FirstFollow(this.ruleItemTypes, this.grammarMap);
		
		//Empty prediction and parse tree
		this.predTree = [];
		this.parseTree = [];
		
	}
	
	parse(tokens) {
		
		//Empty parse tree
		this.error = false;
		this.predTree = [{
			type: NODE_TYPE.PRODUCTION,
			production_id: BASE_PRODUCTION,
			production_idx: 0,
			parentNode: null,
			children: []
		}];
		this.parseTree = [];
		
		//Empty predicted nodes
		this.predNodes = [[]];
		
		//Predict first tokens
		this.#predict(this.predTree[0], this.predNodes[0], null);
		
		//Process input tokens
		let newParseTreeList = [];
		for(let i = 0; i < tokens.length; i++) {
			
			//Get token
			let token = tokens[i];
			
			//Check if token is contained on any prediction tree
			let newPredNodes = [];
			let newPredTrees = [];
			newParseTreeList = [];
			for(let j = 0; j < this.predNodes.length; j++) {
				//Match token to predicted nodes
				let match = this.#matchToken(token, this.predNodes[j]);
				if(match.ok.length > 0) {
					
					//Prune invalid predictions
					for(let k = 0; k < match.ko.length; k++) {
						deepPrune(match.ko[k]);
					}
					
					//Set info to valid predictions
					for(let k = 0; k < match.ok.length; k++) {
						match.ok[k].info = token;
					}
					
					//Generate predict tree for every match
					for(let k = 0; k < match.ok.length; k++) {
						
						//Copy previous predict tree
						let predTreeCopy = treeCopy(this.predTree[j], null);
						linkCopy(predTreeCopy, this.predTree[j]);
						
						//Find matches on new tree
						let matchOkCopy = this.#matchLocate(match.ok, predTreeCopy);
						
						//Prune other valid predictions
						for(let l = 0; l < matchOkCopy.length; l++) {
							if(l != k) {
								deepPrune(matchOkCopy[l]);
							}
						}
						
						//Store provisional parse tree
						let tmpParseTree = treeCopy(predTreeCopy, null);
						linkCopy(tmpParseTree, predTreeCopy);
						newParseTreeList.push(tmpParseTree);
						
						//Predict new tokens
						let tmpPredict = [];
						this.#predictNext(matchOkCopy[k].parentNode, tmpPredict, matchOkCopy[k]);
						
						//Store new prediction (ndoes + tree)
						newPredNodes.push(tmpPredict);
						newPredTrees.push(predTreeCopy);
						
					}
					
				}
			}
			
			//Update predictions (tree + nodes)
			this.predNodes = newPredNodes;
			this.predTree = newPredTrees;
			
			//TODO: Check null predictions
			if(this.predNodes.length == 0) {
				//Unexpected token
				this.errorHandler.newError(ERROR_FONT.PARSER, ERROR_TYPE.ERROR, "Unexpected token in line " + token.line + ", char " + token.offset + " ==> \"" + token.content + "\"");
				break;
			}
			
		}
		
		//Clean parse trees
		let blockCount = [];
		let tmpParseTree = [];
		let okErrorHandlers = [];
		let koErrorHandlers = [];
		for(let i = 0; i < newParseTreeList.length; i++) {
			
			//Copy prediction tree
			let predTreeCopy = treeCopy(newParseTreeList[i], null);
			
			//Prune incomplete predictions
			let treeErrorHandler = new ErrorHandler();
			this.#pruneIncompleteProductions(predTreeCopy, null, treeErrorHandler);
			
			//Prune predictions
			this.#prunePredictions(predTreeCopy);
			
			//Update parse tree list if new parse tree has content
			if(predTreeCopy.children.length > 0) {
				
				//Check if already exist equal tree
				let foundEqualTree = false;
				for(let i = 0; i < tmpParseTree.length; i++) {
					if(compareTrees(tmpParseTree[i], predTreeCopy)) {
						foundEqualTree = true;
						break;
					}
				}
				
				//New parse tree
				if(!foundEqualTree) {
					tmpParseTree.push(predTreeCopy);
					blockCount.push(this.#blockCount(predTreeCopy));
					okErrorHandlers.push(treeErrorHandler);
				}
				
			} else {
				koErrorHandlers.push(treeErrorHandler);
			}
			
		}
		
		//Get largest block tree
		let maxBlockCount = 0;
		let finalErrorHandlers = [];
		for(let i = 0; i < tmpParseTree.length; i++) {
			//Get largest code
			if(blockCount[i] > maxBlockCount) {
				this.parseTree = [tmpParseTree[i]];
				finalErrorHandlers = [okErrorHandlers[i]];
				maxBlockCount = blockCount[i];
			} else if(blockCount[i] == maxBlockCount) {
				this.parseTree.push(tmpParseTree[i]);
				finalErrorHandlers.push(okErrorHandlers[i]);
			}
		}
		
		//Check if no tree was picked
		if(finalErrorHandlers.length == 0) {
			//Dump error handlers
			for(let i = 0; i < koErrorHandlers.length; i++) {
				this.errorHandler.newErrorPack(koErrorHandlers[i].errors.slice(), "TREE " + i);
			}
		} else {
			//Dump error handlers
			for(let i = 0; i < finalErrorHandlers.length; i++) {
				this.errorHandler.newErrorPack(finalErrorHandlers[i].errors.slice(), "TREE " + i);
			}
		}
		
	}
	
	#matchToken(token, list) {
		
		//Search token
		let matches = {
			ok: [],
			ko: []
		};
		for(let i = 0; i < list.length; i++) {
			if(token.token_id == list[i].production_id) {
				matches.ok.push(list[i]);
			} else {
				matches.ko.push(list[i]);
			}
		}
		
		return matches;
		
	}
	
	#matchLocate(matchList, tree) {
		
		//Get paths from matches node tree and locate on new node tree
		let newMatchList = [];
		for(let i = 0; i < matchList.length; i++) {
			newMatchList.push(nodeFromPath(nodePath(matchList[i]).reverse(), tree));
		}
		
		return newMatchList;
		
	}
	
	#predictNext(node, prediction, linkNode) {
		//Check valid node
		if(node != null) {
		
			//Check node type
			if(node.type == NODE_TYPE.FORK) {
				
				//Get production rule
				let rule = this.grammarMap[node.production_id].rules[node.production_idx];
			
				//Visit parent if all rule items were visited
				let visitParent = (node.children.length == rule.length);
				
				//Loop on non-visited rule items
				let newLinkNode = linkNode;
				for(let i = node.children.length; i < rule.length; i++) {
					//Check rule item type
					if(this.ruleItemTypes[rule[i]] == RULE_ITEM_TYPE.TERMINAL) {
						
						//Add TERMINAL node
						let leafNode = {
							type: NODE_TYPE.TERMINAL,
							production_id: rule[i],
							production_idx: i,
							parentNode: node,
							linkNode: newLinkNode,
							linkedChildren: []
						};
						node.children.push(leafNode);
						
						//Add to link node if possible
						if(newLinkNode != null) {
							newLinkNode.linkedChildren.push(leafNode);
						}
						
						//Add predicted node
						prediction.push(leafNode);
						
						//Complete predict
						break;
						
					} else if(rule[i] == EPSILON) {
						
						//Add EPSILON node
						let epsilonNode = {
							type: NODE_TYPE.EPSILON,
							production_id: rule[i],
							production_idx: i,
							parentNode: node,
							linkNode: newLinkNode,
							linkedChildren: []
						};
						node.children.push(epsilonNode);
						
						//Add to link node if possible
						if(newLinkNode != null) {
							newLinkNode.linkedChildren.push(epsilonNode);
						}
						
						//Add predicted node
						prediction.push(epsilonNode);
						
						//Incomplete prediction: visit parent
						newLinkNode = epsilonNode;
						visitParent = true;
						break;
						
					} else {
						
						//Add production node
						let productionNode = {
							type: NODE_TYPE.PRODUCTION,
							production_id: rule[i],
							production_idx: i,
							parentNode: node,
							children: []
						};
						node.children.push(productionNode);
						
						//Expand production and check if is a complete predict
						let tmpLinkNode = this.#predict(productionNode, prediction, newLinkNode);
						if(tmpLinkNode == null) {
							//Complete predict
							break;
						} else {
							
							//Update link node
							newLinkNode = tmpLinkNode;
							
							//Check if is last rule item
							if(i == rule.length - 1) {
								visitParent = true;
							}
							
						}
						
					}
				}
				
				//Check if parent visit is required
				if(visitParent) {
					//Incomplete prediction: visit parent
					this.#predictNext(node.parentNode, prediction, newLinkNode);
				}
			
			} else {
				//Visit parent
				this.#predictNext(node.parentNode, prediction, linkNode);
			}
		
		} else {
			//Prune link node (it's an EPSILON node)
			prune(linkNode);
		}
	}
	
	#predict(node, prediction, linkNode) {
		
		//Undefined new link node
		let newLinkNode = null;
		
		//Process every production rule
		let production = this.grammarMap[node.production_id];
		for(let i = 0; i < production.rules.length; i++) {
			
			//Create fork node and append to parent
			let forkNode = {
				type: NODE_TYPE.FORK,
				production_id: node.production_id,
				production_idx: i,
				parentNode: node,
				children: []
			};
			node.children.push(forkNode);
			
			//Check rule and iterate if predict contains null
			let rule = production.rules[i];
			for(let j = 0; j < rule.length; j++) {
				
				//Get production from rule
				let ruleItem = rule[j];
				
				//Check rule item type
				if(this.ruleItemTypes[ruleItem] == RULE_ITEM_TYPE.TERMINAL) {
					
					//Add TERMINAL node
					let leafNode = {
						type: NODE_TYPE.TERMINAL,
						production_id: ruleItem,
						production_idx: j,
						parentNode: forkNode,
						linkNode: linkNode,
						linkedChildren: []
					};
					forkNode.children.push(leafNode);
					
					//Add to link node if possible
					if(linkNode != null) {
						linkNode.linkedChildren.push(leafNode);
					}
					
					//Add predicted node
					prediction.push(leafNode);
					
					//Complete predict
					newLinkNode = null;
					break;
					
				} else if(ruleItem == EPSILON) {
					
					//Add EPSILON node
					let epsilonNode = {
						type: NODE_TYPE.EPSILON,
						production_id: ruleItem,
						production_idx: j,
						parentNode: forkNode,
						linkNode: linkNode,
						linkedChildren: []
					};
					forkNode.children.push(epsilonNode);
					
					//Add to link node if possible
					if(linkNode != null) {
						linkNode.linkedChildren.push(epsilonNode);
					}
					
					//Incomplete predict
					newLinkNode = epsilonNode;
					break;
					
				} else {
					
					//Add production node
					let productionNode = {
						type: NODE_TYPE.PRODUCTION,
						production_id: ruleItem,
						production_idx: j,
						parentNode: forkNode,
						children: []
					};
					forkNode.children.push(productionNode);
					
					//Expand production
					newLinkNode = this.#predict(productionNode, prediction, newLinkNode == null ? linkNode : newLinkNode);
					
					//Check if prediction is complete
					if(newLinkNode == null) {
						//Complete predict
						break;
					}
					
				}
				
			}
			
		}
		
		return newLinkNode;
		
	}
	
	#prunePredictions(rootNode) {
		
		//Check null node
		if(rootNode == null) {
			return;
		}
		
		//Prune leaves that has no info at all
		let leafList = leafes(rootNode);
		for(let i = 0; i < leafList.length; i++) {
			if(typeof leafList[i].info === "undefined") {
				prune(leafList[i]);
			}
		}
		
	}
	
	#pruneIncompleteProductions(node, token, errorHandler) {
		
		//Check non-leaf node
		if(typeof node.children !== "undefined") {
			
			//Expand node tree
			let children = node.children.slice();
			for(let i = 0; i < children.length; i++) {
				token = this.#pruneIncompleteProductions(children[i], token, errorHandler);
			}
			
			//Check fork children
			if(node.type == NODE_TYPE.FORK) {
					
				//Get rule
				let rule = this.grammarMap[node.production_id].rules[node.production_idx];
				
				//Try to fill missing rule items
				while(node.children.length < rule.length) {
					
					//Get next missing rule item
					let ruleItem = rule[node.children.length];
					
					//Check rule item type
					if(this.ruleItemTypes[ruleItem] == RULE_ITEM_TYPE.TERMINAL) {
						//TERMINAL: Cannot fill missing rule items
						this.#incompleteError(token, ruleItem, errorHandler);
						break;
					} else if(this.ruleItemTypes[ruleItem] == RULE_ITEM_TYPE.PRODUCTION) {
						//PRODUCTION: Check if first contains an EPSILON
						let ruleItemFirst = this.firstFollow.productions[ruleItem].first;
						if(ruleItemFirst.find(item => item == EPSILON)) {
							//Create EPSILON node
							node.children.push({
								type: NODE_TYPE.EPSILON,
								production_id: EPSILON,
								production_idx: node.children.length,
								parentNode: node,
								linkNode: null,
								linkedChildren: []
							});
						} else {
							//Cannot fill missing rule items
							this.#incompleteError(token, ruleItem, errorHandler);
							break;
						}
					} else {
						//EPSILON: Create ghost node
						node.children.push({
							type: NODE_TYPE.EPSILON,
							production_id: ruleItem,
							production_idx: node.children.length,
							parentNode: node,
							linkNode: null,
							linkedChildren: []
						});
					}
					
				}
				
				//Prune incomplete rule set if requried
				if(node.children.length < rule.length) {
					pruneNode(node);
				}
					
			} else {
				//Prune production node if remains no children
				if(node.children.length == 0) {
					if(node.parentNode != null) {
						pruneNode(node);
					}
				}
			}
			
		} else {
			if(typeof node.info !== "undefined") {
				token = node.info;
			}
		}
		
		return token;
		
	}
	
	#incompleteError(token, ruleItem, errorHandler) {
		if(token != null && errorHandler.errors.length == 0) {
			errorHandler.newError(ERROR_FONT.PARSER, ERROR_TYPE.WARNING, "Expected \"" + ruleItem + "\" after \"" + token.content + "\" in line " + token.line + ", char " + token.offset);
		}
	}
	
	#blockCount(node) {
		
		//Check children if possible
		let count = 0;
		if(typeof node.children !== "undefined") {
			
			//Post-order tree navigation
			for(let i = 0; i < node.children.length; i++) {
				count += this.#blockCount(node.children[i]);
			}
			
			//Check if is a block node
			if(node.type == NODE_TYPE.PRODUCTION && node.production_id == PROD_CODE_BLOCK) {
				count++;
			}
			
		}
		
		return count;
		
	}
	
}
