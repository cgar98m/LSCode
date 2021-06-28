const EPSILON = "NULL";
const BASE_PRODUCTION = "CODE";
const END_MARKER = "$"

const PRODUCTION_NODE = 0;
const FORK_NODE = 1;
const LEAF_NODE = 2;

class Parser {
	
	constructor(grammar) {
		
		//TODO: Pre-build first & follow
		this.grammar = grammar;
		this.firstFollow = [];
		this.#firstCalc();
		this.#followCalc();
		
		//Empty parse tree
		this.parseTree = null;
		
	}
	
	parse(tokens) {
		
		//Prepare predict tree
		this.#preparePrediction();
		this.finalGroup = this.#predict(this.rootNode, this.predictedNodes);
		
		//Process input tokens
		for(let i = 0; i < tokens.length; i++) {
			
			//Get token
			let token = tokens[i];
			
			//Check if token is contained on prediction
			let matches = this.#match(token, this.predictedNodes);
			if(matches.ok.length > 0) {
				
				//Get invalid prediction and prune predict tree
				for(let j = 0; j < matches.ko.length; j++) {
					this.#prune(matches.ko[j]);
				}
				
				//Predict next token
				this.predictedNodes = [];
				for(let j = 0; j < matches.ok.length; j++) {
					
					//Update node data
					matches.ok[j].data.info = token;
					
					//Predict next token
					/*let tmpPredict = [];
					this.#predictNext(matches.ok[j].parentNode, tmpPredict);
					this.predictedNodes.push(...tmpPredict);*/
					
				}
				
			} else {
				//TODO: Process error
				this.error = true;
				return;
			}
			
		}
		
		//TODO
		this.parseTree = this.rootNode;
		
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
	
	#preparePrediction() {
	
		//Empty parse tree
		this.error = false;
		this.parseTree = null;
	
		//Prepare root node
		this.rootNode = {
			type: PRODUCTION_NODE,
			group: 0,
			data: {
				production_id: BASE_PRODUCTION
			},
			parentNode: null,
			children: []
		};
		
		//Prepare relation tree
		this.relationTree = {
			group: 0,
			parentNode: null,
			children: []
		};
		
		//Empty predicted nodes
		this.predictedNodes = [];
	
	}
	
	#predict(node, prediction) {
		
		//Check if is terminal
		if(!this.#isTerminal(node.data.production_id)) {
			
			//Get production
			let production = this.#getProduction(node.data.production_id);
			
			//Process every production rule
			for(let i = 0; i < production.rules.length; i++) {
				
				//Check production and iterate if predict contains null
				let rule = production.rules[i];
				for(let j = 0; j < rule.length; j++) {
					
					//Get production from rule
					let prod = rule[j];
					
					//Check epsilon
					if(prod == EPSILON) {
						//Incomplete predict
						prediction.push(null);
						break;
					} else {
						
						//Create fork node
						let forkNode = {
							type: FORK_NODE,
							group: tmpGroup,
							data: {
								production_id: production.production_id,
								production_idx: i
							},
							parentNode: node,
							children: []
						};
						
						//Append fork node to parent
						node.children.push(forkNode);
						
						//Update relationTree
						let locatedGroupNode = this.#locateNode(this.relationTree, nextGroup);
						locatedGroupNode.children.push({
							group: tmpGroup,
							parentNode: locatedGroupNode, 
							children: []
						});
						
						//Check if is terminal
						if(this.#isTerminal(prod)) {
							
							//Add leaf node
							let leafNode = {
								type: LEAF_NODE,
								group: tmpGroup,
								data: {
									production_id: prod
								},
								parentNode: forkNode
							};
							forkNode.children.push(leafNode);
							
							//Add predicted node
							prediction.push(leafNode);
							
							//Complete predict
							break;
							
						} else {
							
							//Add production node
							let productionNode = {
								type: PRODUCTION_NODE,
								group: tmpGroup,
								data: {
									production_id: prod
								},
								parentNode: forkNode,
								children: []
							};
							forkNode.children.push(productionNode);
							
							//Get null node count
							let tmpNull = prediction.filter(x => x == null).length;
							
							//Expand production
							tmpGroup = this.#predict(productionNode, prediction);
							
							//Check if null wasn't added
							if(tmpNull == prediction.filter(x => x == null).length) {
								//Complete predict
								break;
							}
							
						}
						
					}
					
				}
				
			}
			
			//Update group
			this.finalGroup = tmpGroup;
			
		}
		
	}
	
	#match(token, prediction) {
		
		//Search matches
		let matches = {
			ok: [],
			ko: []
		};
		for(let i = 0; i < prediction.length; i++) {
			if(token.token_id == prediction[i].data.production_id) {
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
		
		//Check null node
		if(node == null) {
			
			//Check node type
			if(node.type == FORK_NODE) {
			
				//Get grammar rule
				let rule = this.#getProduction(node.data.production_id)[node.data.production_idx];
			
				//Loop on next productions predict
				for(let i = node.children.length; i < rule.length; i++) {
					
					//Check if is terminal
					if(this.#isTerminal(rule[i])) {
						
						//Add leaf node
						let leafNode = {
							type: LEAF_NODE,
							group: ++this.finalGroup,
							data: {
								production_id: rule[i]
							},
							parentNode: node
						};
						node.children.push(leafNode);
						
						//Add predicted node
						prediction.push(leafNode);
						
						//Complete predict
						return;
						
					} else if(rule[i] == EPSILON) {
						//Incomplete prediction: visit parent
						this.#predictNext(node.parentNode, prediction);
						return;
					} else {
						
						//Add production node
						let productionNode = {
							type: PRODUCTION_NODE,
							group: ++this.finalGroup,
							data: {
								production_id: rule[i]
							},
							parentNode: node,
							children: []
						};
						node.children.push(productionNode);
						
						//Get null node count
						let tmpNull = prediction.filter(x => x == null).length;
						
						//Expand production
						tmpGroup = this.#predict(productionNode, prediction);
						
						//Check if null wasn't added
						if(tmpNull == prediction.filter(x => x == null).length) {
							//Complete predict
							return;
						}
						
					}
					
				}
				
				//Incomplete prediction: visit parent
				this.#predictNext(node.parentNode, prediction);
			
			} else {
				
				//Get grammar rule
				let rule = this.#getProduction(node.data.production_id);
				
				//Loop on next productions predict
				for(let i = node.children.length; i < rule.length; i++) {
					
				}
				
			}
		
		}
		
	}
	
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
