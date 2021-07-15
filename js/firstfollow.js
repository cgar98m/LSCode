const END_MARKER = "$"

const BASE_PRODUCTION = "CODE";

class FirstFollow {

	/* Available variables:
	 * grammarMap
	 * ruleItemTypes
	 * productions
	 */

	constructor(ruleItemTypes, grammarMap) {
		
		//Map grammar by production id
		this.grammarMap = grammarMap;
		
		//Classify rule items (lexic = terminal, grammar = prodcution)
		this.ruleItemTypes = ruleItemTypes;
		
		//Get first & follow list
		this.productions = [];
		for(let prodId in this.grammarMap) {
			this.productions[prodId] = {
				first: [...new Set(this.#first(this.grammarMap[prodId]))]
			};
		}
		for(let prodId in this.grammarMap) {
			this.productions[prodId].follow = [...new Set(this.#follow(prodId, [prodId]))];
		}
		
	}
	
	#first(prodItem) {
		
		//Check every rule from production
		let firstList = [];
		for(let i = 0; i < prodItem.rules.length; i++) {
			
			//Check every rule item
			let rule = prodItem.rules[i];
			let ruleFirstList = [];
			for(let j = 0; j < rule.length; j++) {
				//Check if rule is a terminal
				let ruleItem = rule[j];
				if(this.ruleItemTypes[ruleItem] == RULE_ITEM_TYPE.TERMINAL) {
					//First found
					ruleFirstList.push(ruleItem);
					break;
				} else if(this.ruleItemTypes[ruleItem] == RULE_ITEM_TYPE.PRODUCTION) {
					
					//Get sub-production first
					ruleFirstList.push(...this.#first(this.grammarMap[ruleItem]));
					
					//Check if production contains epsilon
					if(ruleFirstList.includes(EPSILON)) {
						//Check if is last rule item
						if(j == prodItem.rules[i].length - 1) {
							//First found (end of rule)
							break;
						} else {
							//Partial first found (more production exists) --> Remove epsilon
							ruleFirstList = ruleFirstList.filter(prodId => prodId != EPSILON);
						}
					} else {
						//First found
						break;
					}
						
				} else {
					//Partial first found (end of rule)
					ruleFirstList.push(EPSILON);
					break;
				}
			}
			
			//Dump first list
			firstList.push(...ruleFirstList);
			
		}
		
		return firstList;
		
	}
	
	#follow(targetProdId, visitedProd) {
		
		//Check if is base production
		let followList = [];
		if(targetProdId == BASE_PRODUCTION) {
			followList.push(END_MARKER);
		}
		
		//Loop for productions
		for(let prodId in this.grammarMap) {
			//Loop for production rules
			let prod = this.grammarMap[prodId];
			for(let i = 0; i < prod.rules.length; i++) {
				//Loop for rule items
				let rule = prod.rules[i];
				for(let j = 0; j < rule.length; j++) {
					//Check if current item is desired production
					if(targetProdId == rule[j]) {
						//Check if is last rule item
						if(j == rule.length - 1) {
							//Check if production wasn't visited
							if(!visitedProd.includes(prodId)) {
								//Partial follow (end of rule)
								visitedProd.push(prodId);
								followList.push(...this.#follow(prodId, visitedProd));
							}
						} else {
							
							//Loop on pending rule items
							for(let k = j + 1; k < rule.length; k++) {
								
								//Get next rule item
								let nextItem = rule[k];
								
								//Check if next item is terminal
								if(this.ruleItemTypes[nextItem] == RULE_ITEM_TYPE.TERMINAL) {
									//Follow found
									followList.push(nextItem);
									break;
								} else {
									
									//Get first from next rule item
									let nextItemFollowList = this.productions[nextItem].first.slice();
									
									//Check if contains epsilon
									if(nextItemFollowList.includes(EPSILON)) {
										
										//Remove epsilon and store in follow
										nextItemFollowList = nextItemFollowList.filter(item => item != EPSILON);
										followList.push(...nextItemFollowList);
										
										//Check if is last rule item (if not continue loop)
										if(k == rule.length - 1) {
											//Check if production wasn't visited
											if(!visitedProd.includes(prodId)) {
												//Partial follow (end of rule)
												visitedProd.push(prodId);
												followList.push(...this.#follow(prodId, visitedProd));
											}
										}
										
									} else {
										//Follow found
										followList.push(...nextItemFollowList);
										break;
									}
									
								}
								
							}
							
						}
					}
				}
			}
		}
		
		return followList;
		
	}

}
