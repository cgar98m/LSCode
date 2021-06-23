const EPSILON = "NULL";
const BASE_PRODUCTION = "CODE";
const END_MARKER = "$"

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
		for(let i = 0; i < this.grammar.length; i++) {
			if(prodId == this.grammar[i].production_id) {
				return this.grammar[i].rules;
			}
		}
		return [];
	}
	
}
