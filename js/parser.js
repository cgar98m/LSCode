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

class Parser {
	
	constructor(lexic, grammar) {
		
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
				break;
			}
			
		}
		
		//Dump predict tree to parse tree and prune predictions
		for(let i = 0; i < newParseTreeList.length; i++) {
			
			//Copy prediction tree
			let predTreeCopy = treeCopy(newParseTreeList[i], null);
			
			//Prune incomplete predictions
			this.#pruneIncompleteProductions(predTreeCopy);
			
			//Prune predictions
			this.#prunePredictions(predTreeCopy);
			
			//Update parse tree list if new parse tree has content
			if(predTreeCopy.children.length > 0) {
				this.parseTree.push(predTreeCopy);
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
	
	#pruneIncompleteProductions(node) {
		//TODO: Post-order prune
	}
	
}
