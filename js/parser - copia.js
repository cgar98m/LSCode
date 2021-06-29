const EPSILON = "NULL";
const BASE_PRODUCTION = "CODE";
const END_MARKER = "$"

const PRODUCTION_NODE = 0;
const FORK_NODE = 1;
const LEAF_NODE = 2;
const EPSILON_NODE = 3;

class Parser {
	
	constructor(grammar) {
		
		//TODO: Pre-build first & follow
		this.grammar = grammar;
		this.firstFollow = [];
		this.#firstCalc();
		this.#followCalc();
		
		//Empty prediction and parse tree
		this.predTree = null;
		this.parseTree = null;
		
	}
	
	parse(tokens) {
		
		//Empty parse tree
		this.error = false;
		this.predTree = {
			type: PRODUCTION_NODE,
			production_id: BASE_PRODUCTION,
			production_idx: 0,
			parentNode: null,
			children: []
		};
		this.parseTree = null;
		
		//Empty predicted nodes
		this.predictedNodes = [];
		
		//Predict first tokens
		this.#predict(this.predTree, this.predictedNodes);
		
		//Process input tokens
		for(let i = 0; i < tokens.length; i++) {
			
			//Get token
			let token = tokens[i];
			
			//Check if token is contained on prediction
			let matches = this.#match(token, this.predictedNodes);
			if(matches.ok.length > 0) {
								
				//Get invalid prediction and prune predict tree
				for(let j = 0; j < matches.ko.length; j++) {
					
					//Prune node
					this.#prune(matches.ko[j]);
					
					//Check linked node
					if(matches.ko[j].linkNode != null) {
						
						//Remove linked node
						let linkedNode = matches.ko[j].linkNode;
						linkedNode.linkedChildren.splice(linkedNode.linkedChildren.indexOf(matches.ko[j]), 1);
						
						//Check total nodes
						if(linkedNode.linkedChildren.length == 0) {
							//Prune linked node
							this.#prune(matches.ko[j].linkNode);
						}
						
					}
					
				}
				
				//Predict next token
				this.predictedNodes = [];
				for(let j = 0; j < matches.ok.length; j++) {
					
					//Update node data
					matches.ok[j].info = token;
					
					//Predict next token
					let tmpPredict = [];
					this.#predictNext(matches.ok[j].parentNode, tmpPredict);
					
					//Link predicted nodes to match
					for(let k = 0; k < tmpPredict.length; k++) {
						tmpPredict[k].linkNode = matches.ok[j];
						matches.ok[j].linkedChildren.push(tmpPredict[k]);
					}
					
					//Update predicted nodes
					this.predictedNodes.push(...tmpPredict);
					
				}
				
			} else {
				//TODO: Process error
				this.error = true;
				return;
			}
			
		}
		
		//TODO: Dump predict tree to parse tree and prune predictions
		let predTreeCopy = this.#treeDeepCopy(this.predTree, null);
		this.#prunePredictions(predTreeCopy);
		this.parseTree = predTreeCopy;
		
	}
	
	#firstCalc() {
		
		//Loop for every production
		for(let i = 0; i < this.grammar.length; i++) {
			
			//Focus on single production
			let prod =  this.grammar[i];
			
			//Get first
			this.firstFollow.push({
				production_id: prod.production_id,
				first: [...new Set(this.#first(prod))]
			});
			
		}
		
	}
	
	#first(prod) {
		
		//Check every rule
		let localFirsts = [];
		for(let i = 0; i < prod.rules.length; i++) {
			
			//Check every production/terminal in rule
			let prodFirst = [];
			for(let j = 0; j < prod.rules[i].length; j++) {
				
				//Get production/terminal
				let ruleItem = prod.rules[i][j];
				
				//Check if is terminal
				if(this.#isTerminal(ruleItem)) {
					//First found
					prodFirst.push(ruleItem);
					break;
				} else {
					//Check if is production
					if(ruleItem == EPSILON) {
						//Partial first found (end of rule)
						prodFirst.push(EPSILON);
						break;
					} else {
						
						//Get sub-production first
						prodFirst.push(...this.#first(this.#getProduction(ruleItem)));
						
						//Check if production contains epsilon
						if(this.#hasEpsilon(prodFirst)) {
							//Check if is last production/terminal of current rule
							if(j == prod.rules[i].length - 1) {
								//Partial first found (end of rule)
								break;
							} else {
								//Partial first found (more production exists) --> Remove epsilon
								this.#removeEpsilon(prodFirst);
							}
						} else {
							//First found
							break;
						}
						
					}
				}
				
			}
			
			//Dump firsts
			localFirsts.push(...prodFirst);
			
		}
		
		return localFirsts;
		
	}
	
	#followCalc() {
		
		//Loop for every production
		for(let i = 0; i < this.grammar.length; i++) {
			
			//Focus on single production
			let prod =  this.grammar[i];
			
			//Get follow
			this.firstFollow[i].follow = [...new Set(this.#follow(prod.production_id, [prod.production_id]))];
			
		}
		
	}
	
	#follow(prodId, visitedProd) {
		
		//Check if is base production
		let localFollows = [];
		if(prodId == BASE_PRODUCTION) {
			localFollows.push(END_MARKER);
		}
		
		//Check every rule that contains current production
		for(let i = 0; i < this.grammar.length; i++) {
			
			//Get production
			let prod = this.grammar[i];
			
			//Loop for rules
			for(let j = 0; j < prod.rules.length; j++) {
				
				//Get rule
				let rule = prod.rules[j];
				
				//Loop for rule items
				for(let k = 0; k < rule.length; k++) {
					//Check if current item is desired production
					if(prodId == rule[k]) {
						
						//Check if is last rule item
						if(k == rule.length - 1) {
							//Check if production wasn't visited
							if(!visitedProd.includes(prod.production_id)) {
								visitedProd.push(prod.production_id);
								localFollows.push(...this.#follow(prod.production_id, visitedProd));
							}
						} else {
							
							//Loop on pending rule items
							for(let l = k + 1; l < rule.length; l++) {
								
								//Get next item
								let nextProd = rule[l];
								
								//Check if next item is terminal
								if(this.#isTerminal(nextProd)) {
									//Follow found
									localFollows.push(nextProd);
									break;
								} else {
									
									//Get first from next rule item
									let tmpFollows = this.#getFirst(nextProd);
									
									//Check if contains epsilon
									if(tmpFollows.includes(EPSILON)) {
										
										//Remove epsilon and store in follow
										this.#removeEpsilon(tmpFollows);
										localFollows.push(...tmpFollows);
										
										//Check if is last rule item (if not continue loop)
										if(l == rule.length - 1) {
											//Check if production wasn't visited
											if(!visitedProd.includes(prod.production_id)) {
												visitedProd.push(prod.production_id);
												localFollows.push(...this.#follow(prod.production_id, visitedProd));
											}
										}
										
									} else {
										//Follow found
										localFollows.push(...tmpFollows);
										break;
									}
									
								}
								
							}
							
						}
						
					}
				}
				
			}
			
		}
		
		return localFollows;
		
	}
	
	#isTerminal(ruleItem) {
		
		//Check epsilon
		if(EPSILON == ruleItem) {
			return false;
		}
		
		//Check production ids
		for(let i = 0; i < this.grammar.length; i++) {
			if(this.grammar[i].production_id == ruleItem) {
				return false;
			}
		}
		
		//Terminal
		return true;
		
	}
	
	#getProduction(ruleItem) {
		
		//Find production
		for(let i = 0; i < this.grammar.length; i++) {
			if(this.grammar[i].production_id == ruleItem) {
				return this.grammar[i];
			}
		}
		
		//No production match found
		return null;
		
	}
	
	#hasEpsilon(prodFirst) {
		
		//Check epsilon existance
		for(let i = 0; i < prodFirst.length; i++) {
			if(prodFirst[i] == EPSILON) {
				return true;
			}
		}
		
		//Epsilon not found
		return false;
		
	}
	
	#removeEpsilon(prodFirst) {
		//Find epsilon location
		for(let i = 0; i < prodFirst.length; i++) {
			if(prodFirst[i] == EPSILON) {
				prodFirst.splice(i, 1);
			}
		}
	}
	
	#getFirst(prodId) {
		//Locate production
		for(let i = 0; i < this.firstFollow.length; i++) {
			if(this.firstFollow[i].production_id == prodId) {
				return this.firstFollow[i].first.slice();
			}
		}
	}
	
	#predict(node, prediction) {
		
		//Get production
		let production = this.#getProduction(node.production_id);
		
		//Process every production rule
		for(let i = 0; i < production.rules.length; i++) {
			
			//Check production and iterate if predict contains null
			let rule = production.rules[i];
			for(let j = 0; j < rule.length; j++) {
				
				//Get production from rule
				let prod = rule[j];
				
				//Create fork node and append to parent
				let forkNode = {
					type: FORK_NODE,
					production_id: production.production_id,
					production_idx: i,
					parentNode: node,
					children: []
				};
				node.children.push(forkNode);
				
				//Check terminal production
				if(this.#isTerminal(prod)) {
					
					//Add leaf node
					let leafNode = {
						type: LEAF_NODE,
						production_id: prod,
						production_idx: j,
						parentNode: forkNode,
						linkNode: null,
						linkedChildren: []
					};
					forkNode.children.push(leafNode);
					
					//Add predicted node
					prediction.push(leafNode);
					
					//Complete predict
					break;
					
				} else if(prod == EPSILON) {
					
					//Add EPSILON node
					let epsilonNode = {
						type: EPSILON_NODE,
						production_id: prod,
						production_idx: j,
						parentNode: forkNode,
						linkNode: null,
						linkedChildren: []
					};
					forkNode.children.push(epsilonNode);
					
					//Add predicted node
					prediction.push(epsilonNode);
					
					//Incomplete predict
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
					
					//Get null node count
					let epsilonCount = prediction.filter(x => x.type == EPSILON_NODE).length;
					
					//Expand production
					this.#predict(productionNode, prediction);
					
					//Check if EPSILON wasn't added
					if(epsilonCount == prediction.filter(x => x.type == EPSILON_NODE).length) {
						//Complete predict
						break;
					}
					
				}
				
			}
			
		}
		
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
	
	#prune(node) {
		
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
	
	#locateNode(nodeTree, group) {
		
		//Check current node
		if(nodeTree.group == group) {
			return nodeTree;
		}
		
		//Check children nodes
		for(let i = 0; i < nodeTree.children.length; i++) {
			if(nodeTree.children[i].group == group) {
				return nodeTree.children[i];
			} else {
				let tmpNode = this.#locateNode(nodeTree.children[i], group);
				if(tmpNode != null) {
					return tmpNode;
				}
			}
		}
		
		//Node not found
		return null;
		
	}
	
	#predictNext(node, prediction) {
		
		//Check valid node
		if(node != null) {
		
			//Check node type
			let visitParent = false;
			if(node.type == FORK_NODE) {
			
				//Get grammar rule
				let rule = this.#getProduction(node.production_id).rules[node.production_idx];
			
				//Visit parent if all productions where visited
				visitParent = node.children.length == rule.length ? true : false;
			
				//Loop on next productions predict
				for(let i = node.children.length; i < rule.length; i++) {
					
					//Check production type
					if(this.#isTerminal(rule[i])) {
						
						//Add leaf node
						let leafNode = {
							type: LEAF_NODE,
							production_id: rule[i],
							production_idx: i,
							parentNode: node,
							linkNode: null,
							linkedChildren: []
						};
						node.children.push(leafNode);
						
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
							linkNode: null,
							linkedChildren: []
						};
						node.children.push(epsilonNode);
						
						//Add predicted node
						prediction.push(epsilonNode);
						
						//Incomplete prediction: visit parent
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
						
						//Get null node count
						let epsilonCount = prediction.filter(x => x.type == EPSILON_NODE).length;
						
						//Expand production
						this.#predict(productionNode, prediction);
						
						//Check if EPSILON wasn't added
						if(epsilonCount == prediction.filter(x => x.type == EPSILON_NODE).length) {
							//Complete predict
							break;
						} else {
							//Check last production
							if(i == rule.length - 1) {
								visitParent = true;
							}
						}
						
					}
					
				}
				
				//Check if parent visit is required
				if(visitParent) {
					//Incomplete prediction: visit parent
					this.#predictNext(node.parentNode, prediction);
				}
			
			} else {
				
				//Get grammar production
				let production = this.#getProduction(node.production_id);
				
				//Visit parent if all rules where visited
				visitParent = node.children.length == production.rules.length ? true : false;
				
				//Loop on next rules
				for(let i = node.children.length; i < production.rules.length; i++) {
					
					//Check production and iterate if predict contains null
					let rule = production.rules[i];
					for(let j = 0; j < rule.length; j++) {
						
						//Get production from rule
						let prod = rule[j];
						
						//Create fork node and append to parent
						let forkNode = {
							type: FORK_NODE,
							production_id: production.production_id,
							production_idx: i,
							parentNode: node,
							children: []
						};
						node.children.push(forkNode);
						
						//Check terminal production
						if(this.#isTerminal(prod)) {
							
							//Add leaf node
							let leafNode = {
								type: LEAF_NODE,
								production_id: prod,
								production_idx: j,
								parentNode: forkNode,
								linkNode: null,
								linkedChildren: []
							};
							forkNode.children.push(leafNode);
							
							//Add predicted node
							prediction.push(leafNode);
							
							//Complete predict
							break;
							
						} else if(prod == EPSILON) {
							
							//Add EPSILON node
							let epsilonNode = {
								type: EPSILON_NODE,
								production_id: prod,
								production_idx: j,
								parentNode: forkNode,
								linkNode: null,
								linkedChildren: []
							};
							forkNode.children.push(epsilonNode);
							
							//Add predicted node
							prediction.push(epsilonNode);
							
							//Incomplete predict
							visitParent = true;
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
							
							//Get null node count
							let epsilonCount = prediction.filter(x => x.type == EPSILON_NODE).length;
							
							//Expand production
							this.#predict(productionNode, prediction);
							
							//Check if EPSILON wasn't added
							if(epsilonCount == prediction.filter(x => x.type == EPSILON_NODE).length) {
								//Complete predict
								break;
							} else {
								//Check last production
								if(j == rule.length - 1) {
									visitParent = true;
								}
							}
							
						}
						
					}
					
				}
				
				//Check if parent visit is required
				if(visitParent) {
					//Incomplete prediction: visit parent
					this.#predictNext(node.parentNode, prediction);
				}
				
			}
		
		}
		
	}
	
	#treeDeepCopy(nodeSource, parentNode) {
	
		let treeCopy = null;
	
		//Check null node
		if(nodeSource != null) {
		
			//Copy all values
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
	
	/**************
	*** UTILITY ***
	**************/
	
	firstFinder(prodId) {
		for(let i = 0; i < this.firstFollow.length; i++) {
			if(prodId == this.firstFollow[i].production_id) {
				return this.firstFollow[i].first;
			}
		}
		return [];
	}
	
	followFinder(prodId) {
		for(let i = 0; i < this.firstFollow.length; i++) {
			if(prodId == this.firstFollow[i].production_id) {
				return this.firstFollow[i].follow;
			}
		}
		return [];
	}
	
	productionFinder(prodId) {
		
		//Get grammar
		let grammarItem = this.#getProduction(prodId);
		
		//Check null
		if(grammarItem == null) {
			return [];
		} else {
			return grammarItem.rules;
		}
		
	}
	
}
