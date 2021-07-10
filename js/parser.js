//const EPSILON = "EPSILON";
//const BASE_PRODUCTION = "CODE";
//const END_MARKER = "$"
const RULE_ITEM_TYPE = {
	TERMINAL: 'T',
	PRODUCTION: 'P'
}

const EPSILON = "EPSILON";

const PRODUCTION_NODE = 0;
const FORK_NODE = 1;
const LEAF_NODE = 2;
const EPSILON_NODE = 3;

class Parser {
	
	constructor(lexic, grammar) {
		
		//TODO: Pre-build first & follow
		this.grammar = grammar;
		
		//Map grammar by production id
		this.grammarMap = [];
		for(let i = 0; i < grammar.length; i++) {
			this.grammarMap[grammar[i].production_id] = {
				rules: grammar[i].rules
			};
		}
		
		//Classify rule items (lexic = terminal, grammar = prodcution)
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
			type: PRODUCTION_NODE,
			production_id: BASE_PRODUCTION,
			production_idx: 0,
			parentNode: null,
			children: []
		}];
		this.parseTree = [];
		
		//Empty predicted nodes
		this.predictedNodes = [[]];
		
		//Predict first tokens
		this.#predict(this.predTree[0], this.predictedNodes[0], null);
		
		//Process input tokens
		for(let i = 0; i < tokens.length; i++) {
			
			//Get token
			let token = tokens[i];
			
			//Check if token is contained on any prediction tree
			let newPredictions = [];
			let newPredTrees = [];
			for(let j = 0; j < this.predictedNodes.length; j++) {
				
				//Match to predicted nodes
				let match = this.#match(token, this.predictedNodes[j]);
				
				//Check if at least one match was found
				if(match.ok.length > 0) {
					
					//Prune invalid predictions
					for(let k = 0; k < match.ko.length; k++) {
						this.#deepPrune(match.ko[k]);
					}
					
					//Set info to valid predictions
					for(let k = 0; k < match.ok.length; k++) {
						match.ok[k].info = token;
					}
					
					//Generate tree for every match and predict new tokens
					for(let k = 0; k < match.ok.length; k++) {
						
						//Copy previous predict tree (linked nodes excluded)
						let predTreeCopy = this.#treeDeepCopy(this.predTree[j], null);
						
						//Copy linked nodes on new tree
						this.#treeRelink(predTreeCopy, this.predTree[j]);
						
						//Find matches on new tree
						let matchesCopy = this.#matchesLocate(match.ok, predTreeCopy);
						
						//Prune other valid predictions
						for(let l = 0; l < matchesCopy.length; l++) {
							if(l != k) {
								this.#deepPrune(matchesCopy[l]);
							}
						}
						
						//Predict new tokens
						let tmpPredict = [];
						this.#predictNext(matchesCopy[k].parentNode, tmpPredict, matchesCopy[k]);
						
						//Store new prediction (tree + nodes)
						newPredictions.push(tmpPredict);
						newPredTrees.push(predTreeCopy);
						
					}
					
				}
				
			}
			
			//Update predictions (tree + nodes)
			this.predictedNodes = newPredictions;
			this.predTree = newPredTrees;
			
			//Check null predictions
			if(this.predictedNodes.length == 0) {
				//TODO: Error management
				break;
			}
			
		}
		
		//TODO: Dump predict tree to parse tree and prune predictions
		for(let i = 0; i < this.predTree.length; i++) {
			let predTreeCopy = this.#treeDeepCopy(this.predTree[i], null);
			this.#prunePredictions(predTreeCopy);
			this.parseTree.push(predTreeCopy);
		}
		
	}
	
	#predict(node, prediction, linkNode) {
		
		//New link node as null
		let newLinkNode = null;
		
		//Get production
		//let tmpProduction = this.#getProduction(node.production_id);
		let production = this.grammarMap[node.production_id];
		
		//Process every production rule
		for(let i = 0; i < production.rules.length; i++) {
			
			//Create fork node and append to parent
			let forkNode = {
				type: FORK_NODE,
				production_id: node.production_id,
				production_idx: i,
				parentNode: node,
				children: []
			};
			node.children.push(forkNode);
			
			//Check production and iterate if predict contains null
			let rule = production.rules[i];
			for(let j = 0; j < rule.length; j++) {
				
				//Get production from rule
				let prod = rule[j];
				
				//Check terminal production
				//if(this.#isTerminal(prod)) {
				if(this.ruleItemTypes[prod] == RULE_ITEM_TYPE.TERMINAL) {
					
					//Add LEAF node
					let leafNode = {
						type: LEAF_NODE,
						production_id: prod,
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
					
				} else if(prod == EPSILON) {
					
					//Add EPSILON node
					let epsilonNode = {
						type: EPSILON_NODE,
						production_id: prod,
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
						type: PRODUCTION_NODE,
						production_id: prod,
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
	
	#match(token, prediction) {
		
		//Search matches
		let matches = {
			ok: [],
			ko: []
		};
		for(let i = 0; i < prediction.length; i++) {
			if(token.token_id == prediction[i].production_id) {
				matches.ok.push(prediction[i]);
			} else {
				matches.ko.push(prediction[i]);
			}
		}
		
		return matches;
		
	}
	
	#treeRelink(targetTree, sourceTree) {
		
		//Get LEAF and EPSILON nodes from target and source (same amount)
		let targetLeaves = this.#leafLocate(targetTree);
		let sourceLeaves = this.#leafLocate(sourceTree);
		
		//Re-link every leaf on target tree
		for(let i = 0; i < sourceLeaves.length; i++) {
			
			//Get path form linked node
			let path = this.#nodePath(sourceLeaves[i].linkNode);
			
			//Re-link node
			targetLeaves[i].linkNode = this.#nodeFromPath(path.reverse(), targetTree);
			
			//Re-link children nodes
			targetLeaves[i].linkedChildren = [];
			for(let j = 0; j < sourceLeaves[i].linkedChildren.length; j++) {
				
				//Get path form linked node
				let path = this.#nodePath(sourceLeaves[i].linkedChildren[j]);
				
				//Re-link node
				let newNode = this.#nodeFromPath(path.reverse(), targetTree);
				if(newNode != null) {
					targetLeaves[i].linkedChildren.push(newNode);
				}
				
			}
			
		}
		
	}
	
	#matchesLocate(matches, nodeTree) {
		
		//Get paths from matches node tree and locate on new node tree
		let newMatches = [];
		for(let i = 0; i < matches.length; i++) {
			let path = this.#nodePath(matches[i]);
			newMatches.push(this.#nodeFromPath(path.reverse(), nodeTree));
			//newMatches.push(this.#nodeFromPath(this.#nodePath(matches[i]), nodeTree));
		}
		
		return newMatches;
		
	}
	
	#nodePath(node) {
		
		//Check null node
		if(node == null) {
			return [];
		}
		
		//Prepare path
		let path = [];
		
		//Check null node parent
		let parentNode = node.parentNode;
		if(parentNode != null) {
			
			//Locate index in parent node
			for(let i = 0; i < parentNode.children.length; i++) {
				if(parentNode.children[i].production_idx == node.production_idx) {
					path.push(i);
					break;
				}
			}
			
			//Append missing indexs
			path.push(...this.#nodePath(parentNode));
			
		}
		
		return path;
		
	}
	
	#nodeFromPath(path, nodeTree) {
		
		//Check null path
		if(path.length == 0) {
			return null;
		}
		
		//Loop on path
		let node = nodeTree;
		for(let i = 0; i < path.length; i++) {
			node = node.children[path[i]];
		}
		
		return node;
		
	}
	
	#deepPrune(node) {
		//Check valid node
		if(node != null) {
			
			//Prune branch
			this.#prune(node);
			
			//Try to prune linked node
			if(node.linkNode != null) {
				
				//Prune node from linked node
				node.linkNode.linkedChildren.splice(node.linkNode.linkedChildren.indexOf(node), 1);
				
				//Check if was last link
				if(node.linkNode.linkedChildren.length == 0) {
					this.#deepPrune(node.linkNode);
				}
				
				//Prune link node
				node.linkNode = null;
				
			}
			
		}
	}
	
	#prune(node) {
		//Check valid node
		if(node != null) {
			
			//Get parent node
			let parentNode = node.parentNode;
			
			//Check null parent
			if(parentNode != null) {
				
				//Remove child
				parentNode.children.splice(parentNode.children.indexOf(node), 1);
				node.parentNode = null;
				
				//Check if has no remaining child
				if(parentNode.children.length == 0) {
					this.#prune(parentNode);
				}
				
			}
			
		}
	}
	
	#predictNext(node, prediction, linkNode) {
		
		//Check valid node
		if(node != null) {
		
			//Check node type
			let visitParent = false;
			if(node.type == FORK_NODE) {
				
				//Get grammar rule
				//let rule = this.#getProduction(node.production_id).rules[node.production_idx];
				let rule = this.grammarMap[node.production_id].rules[node.production_idx];
			
				//Visit parent if all productions where visited
				visitParent = (node.children.length == rule.length);
				
				//Loop on next productions predict
				let newLinkNode = linkNode;
				for(let i = node.children.length; i < rule.length; i++) {
					
					//Check production type
					//if(this.#isTerminal(rule[i])) {
					if(this.ruleItemTypes[rule[i]] == RULE_ITEM_TYPE.TERMINAL) {
						
						//Add leaf node
						let leafNode = {
							type: LEAF_NODE,
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
							type: EPSILON_NODE,
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
							type: PRODUCTION_NODE,
							production_id: rule[i],
							production_idx: i,
							parentNode: node,
							children: []
						};
						node.children.push(productionNode);
						
						//Expand production and check if EPSILON was resolved
						let tmpLinkNode = this.#predict(productionNode, prediction, newLinkNode);
						if(tmpLinkNode == null) {
							//Complete predict
							break;
						} else {
							
							//Update link node
							newLinkNode = tmpLinkNode;
							
							//Check last rule item
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
			/*//Add linkNode node to prediction (EPSILON node)
			prediction.push(linkNode);*/
			//Prune link node (it's an EPSILON node)
			this.#prune(linkNode);
		}
		
	}
	
	#treeDeepCopy(nodeSource, parentNode) {
	
		let treeCopy = null;
	
		//Check null node
		if(nodeSource != null) {
		
			//Copy all non-referenced values
			treeCopy = {
				type: nodeSource.type,
				production_id: nodeSource.production_id,
				production_idx: nodeSource.production_idx,
				parentNode: parentNode,
			};
			
			//Check if info exists
			if(typeof nodeSource.info !== "undefined") {
				treeCopy.info = nodeSource.info;
			}
			
			//Check PRODUCTION and FORK node types
			if(nodeSource.type == PRODUCTION_NODE || nodeSource.type == FORK_NODE) {
				//Get children copies
				treeCopy.children = [];
				for(let i = 0; i < nodeSource.children.length; i++) {
					treeCopy.children.push(this.#treeDeepCopy(nodeSource.children[i], treeCopy));
				}
			}
		
		}
	
		return treeCopy;
	
	}
	
	#prunePredictions(rootNode) {
		
		//Check null node
		if(rootNode == null) {
			return;
		}
		
		//Get LEAF and EPSILON nodes
		let leaves = this.#leafLocate(rootNode);
		
		//Prune leaves that has no info at all
		for(let i = 0; i < leaves.length; i++) {
			//Check if .info doesn't exist to prune them
			if(typeof leaves[i].info === "undefined") {
				this.#prune(leaves[i]);
			}
		}
		
		//TODO: Do something with incomplete productions
		
	}
	
	#leafLocate(node) {
		
		//Check node type
		let leafNodes = [];
		if(node.type == LEAF_NODE || node.type == EPSILON_NODE) {
			leafNodes.push(node);
		} else {
			//Visit children
			for(let i = 0; i < node.children.length; i++) {
				leafNodes.push(...this.#leafLocate(node.children[i]));
			}
		}
		
		return leafNodes;
		
	}
	
}
