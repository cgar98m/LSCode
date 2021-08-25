function createAstTree(domElement, codeNode, funcNodeList) {
	
	//Check null info
	if(codeNode == null) {
		return;
	}
	
	//Get code actions
	let actions = codeNode.children;
	if(actions.length > 0) {
		let codeItem = createArrowElement(domElement, MSG_CODE);
		createAstTreePath(createSubListElement(codeItem), codeNode);
	}
	
	//Check no funcs
	let funcs = Object.keys(funcNodeList);
	if(funcs.length == 0) {
		return;
	}
	
	//Create function list tree
	let funcListItem = createArrowElement(domElement, MSG_FUNCS);
	let funcSubListItem = createSubListElement(funcListItem);
	
	//Explore all possible functions
	for(let i = 0; i < funcs.length; i++) {
		createAstTreePath(funcSubListItem, funcNodeList[funcs[i]]);
	}
	
}

function createAstTreePath(domElement, node) {
	//Check node type
	switch(node.type) {
		
		case AST_NODE.STRUCT:
			if(node.children.length > 0) {
				
				//Create struct item
				let actionItem = createArrowElement(domElement, MSG_CONTEXT);
				let actionSubListItem = createSubListElement(actionItem);
				
				//Create sublist item for every child
				for(let i = 0; i < node.children.length; i++) {
					createAstTreePath(actionSubListItem, node.children[i]);
				}
				
			} else {
				createListElement(domElement, MSG_CONTEXT);
			}
			break;
			
		case AST_NODE.ACTION:
			switch(node.semantica) {
				
				case SEMANTICA_KEYS.VAR_ASSIGN:
				
					//Create assign node
					let assignItem = createArrowElement(domElement, node.semantica);
					let assignSubListItem = createSubListElement(assignItem);
				
					//Create info nodes
					createVarListPath(assignSubListItem, node.children[0]);
					createExpressionListPath(assignSubListItem, node.children[1]);
					
					break;
					
				case SEMANTICA_KEYS.FORK:
				
					//Create fork item
					let forkItem = createArrowElement(domElement, node.semantica);
					let forkSubListItem = createSubListElement(forkItem);
					
					//Create info nodes
					createConditionPath(forkSubListItem, node.children[0]);
					createIfCasesPath(forkSubListItem, node.children[1]);
					
					break;
					
				case SEMANTICA_KEYS.LOOP:
				
					//Create loop node
					let loopItem = createArrowElement(domElement, node.semantica);
					let loopSubListItem = createSubListElement(loopItem);
					
					//Create info nodes
					createConditionPath(loopSubListItem, node.children[0]);
					if(node.children[1].children.length != 0) {
						let codeNode = createArrowElement(loopSubListItem, MSG_LOOP_CONTENT);
						createAstTreePath(createSubListElement(codeNode), node.children[1].children[0]);
					}
					
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					createCallPath(domElement, node, node.ref);
					break;
					
				default:	//Undefined case
					createListElement(domElement, UNDEFINED);
					break;
					
			}
			break;
			
		case AST_NODE.FUNC:
			
			//Create func item
			let funcItem = createArrowElement(domElement, node.funcName);
			let funcSubListItem = createSubListElement(funcItem);
		
			//Create info nodes
			createParamListPath(funcSubListItem, node.children[0]);
			createReturnTypePath(funcSubListItem, node.children[1]);
			if(node.children[2].children.length != 0) {
				let codeNode = createArrowElement(funcSubListItem, MSG_FUNC_CONTENT);
				createAstTreePath(createSubListElement(codeNode), node.children[2].children[0]);
			}
			createReturnDataPath(funcSubListItem, node.children[3]);
			
			break;
			
		default:	//Undefined case
			createListElement(domElement, UNDEFINED);
			break;
			
	}
}

function createConditionPath(domElement, node) {
	
	//Create condition item
	let conditionItem = createArrowElement(domElement, MSG_CONDITION);
	
	//Create expression item
	createExpressionPath(createSubListElement(conditionItem), node.children[0]);
	
}

function createIfCasesPath(domElement, node) {
	
	//Check if exists any context
	if(node.children.length == 0) {
		return;
	}
	
	//Create as context item as required
	for(let i = 0; i < node.children.length; i++) {
		//Create case item
		let caseItem = createArrowElement(domElement, MSG_CASE.format(node.children[i].conditionCase));
		createAstTreePath(createSubListElement(caseItem), node.children[i]);
	}
	
}

function createParamListPath(domElement, node) {
	//Check if has any var
	if(node.children.length == 0) {
		createListElement(domElement, "params");
	} else {
		
		//Create params item
		let paramsItem = createArrowElement(domElement, MSG_PARAMS);
		let paramsSubListItem = createSubListElement(paramsItem);
		
		//Create node for every param
		for(let i = 0; i < node.children.length; i++) {
			createListElement(paramsSubListItem, MSG_VAR_INFO.format(node.children[i].info.content, node.children[i].info.type));
		}
		
	}
}

function createReturnTypePath(domElement, node) {
	//Check if has any return type
	if(node.children.length == 0) {
		createListElement(domElement, MSG_RETURN_TYPE);
	} else {
		
		//Create params item
		let returnItem = createArrowElement(domElement, MSG_RETURN_TYPE);
		let returnSubListItem = createSubListElement(returnItem);
		
		//Create node for every param
		for(let i = 0; i < node.children.length; i++) {
			createListElement(returnSubListItem, node.children[i].info.type);
		}
		
	}
}

function createReturnDataPath(domElement, node) {
	//Check if has any return data
	if(node.children.length == 0) {
		createListElement(domElement, MSG_RETURN_DATA);
	} else {
		
		//Create return item
		let returnItem = createArrowElement(domElement, MSG_RETURN_DATA);
		let returnSubListItem = createSubListElement(returnItem);
		
		//Create sublist item for every return expression
		for(let i = 0; i < node.children.length; i++) {
			let expressionItem = createArrowElement(returnSubListItem, MSG_EXPRESSION.format(i));
			createExpressionPath(createSubListElement(expressionItem), node.children[i]);
		}
		
	}
}

function createVarListPath(domElement, node) {
	
	//Create var list item
	let varListItem = createArrowElement(domElement, MSG_VARS);
	let subListItem = createSubListElement(varListItem);
	
	//Create sublist item for every var position
	for(let i = 0; i < node.children.length; i++) {
		
		//Set var position info
		let varPositionItem = createArrowElement(subListItem, MSG_POSITION.format(i));
		let varPositionSubListItem = createSubListElement(varPositionItem);
		
		//Create var items
		for(let j = 0; j < node.children[i].children.length; j++) {
			createListElement(varPositionSubListItem, MSG_VAR_INFO.format(node.children[i].children[j].content, node.children[i].children[j].type));
		}
		
	}
	
}

function createExpressionListPath(domElement, node) {
	
	//Create expression list item
	let expressionListItem = createArrowElement(domElement, MSG_EXPRESSIONS);
	let subListItem = createSubListElement(expressionListItem);
	
	//Create sublist item for every var position
	for(let i = 0; i < node.children.length; i++) {
		let expressionItem = createArrowElement(subListItem, MSG_EXPRESSION.format(i));
		createExpressionPath(createSubListElement(expressionItem), node.children[i]);
	}
	
}

function createExpressionPath(domElement, node) {
	//Check node type
	switch(node.type) {
		case AST_NODE.EXPRESSION:
		case AST_NODE.UNARY_EXPRESSION:
			//Check if has any operation assigned
			if(typeof node.operation === UNDEFINED) {
				createExpressionPath(domElement, node.children[0]);
			} else {
				
				//Set operation item
				let operationItem = createArrowElement(domElement, node.operation);
				let operationSubListItem = createSubListElement(operationItem);
				
				//Create sublist item for every var position
				for(let i = 0; i < node.children.length; i++) {
					createExpressionPath(operationSubListItem, node.children[i]);
				}
				
			}
			break;
		
		case AST_NODE.VALUE:
			let valueItem = createArrowElement(domElement, MSG_CONST);
			let valueSubListItem = createSubListElement(valueItem);
			createListElement(valueSubListItem, node.value.content);
			break;
			
		case AST_NODE.ID:
			let varItem = createArrowElement(domElement, MSG_VAR);
			let varSubListItem = createSubListElement(varItem);
			createListElement(varSubListItem, node.ref.content);
			break;
			
		case AST_NODE.FUNC_EXP:
			createCallPath(domElement, node, node.call.content);
			break;
			
		default:	//Undefined case
			createListElement(domElement, UNDEFINED);
			break;
			
	}
}

function createCallPath(domElement, node, callName) {
	
	//Create call node
	let callBaseItem = createArrowElement(domElement, MSG_CALL);
	let callBaseSubListItem = createSubListElement(callBaseItem);
	
	//Check if has params
	if(node.children.length == 0) {
		createListElement(callBaseSubListItem, callName);
	} else {
		//Create sublist item for every param
		let callItem = createArrowElement(callBaseSubListItem, callName);
		let callSubListItem = createSubListElement(callItem);
		for(let i = 0; i < node.children.length; i++) {
			let paramItem = createArrowElement(callSubListItem, MSG_PARAM.format(i));
			createExpressionPath(createSubListElement(paramItem), node.children[i]);
		}
	}
	
}
