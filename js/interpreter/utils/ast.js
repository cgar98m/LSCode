const AST_NODE = {
	STRUCT: "struct",
	ACTION: "action",
	FUNC: "func",
	INFO_HEADER: "infoHeader",
	INFO: "info",
	EXPRESSION: "expression",
	VALUE: "value",
	ID: "id",
	FUNC_EXP: "funcExp"
}

function astCopy(astSource, context, fromFunc) {
	
	//Copy content
	let node = {...astSource};
	
	//Check node type
	node.children = [];
	switch(node.type) {
		
		case AST_NODE.STRUCT:
			
			//Update context
			if(!fromFunc) {
				node.context = astContextCopy(astSource.context, context);
			} else {
				node.context = context;
			}
			
			//Update children
			for(let i = 0; i < astSource.children.length; i++) {
				node.children.push(astCopy(astSource.children[i], node.context, false));
			}
			
			break;
			
		case AST_NODE.ACTION:
		
			//Update context
			node.context = context;
		
			//Check semantica
			switch(node.semantica) {
				
				case SEMANTICA_KEYS.VAR_ASSIGN:
					node.children.push(astVarCopy(astSource.children[0]));
					node.children.push(astValueCopy(astSource.children[1], node.context));
					break;
					
				case SEMANTICA_KEYS.FORK:
				case SEMANTICA_KEYS.LOOP:
					node.children.push(astValueCopy(astSource.children[0], node.context));
					node.children.push(astContentCopy(astSource.children[1], node.context, false));
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					for(let i = 0; i < astSource.children.length; i++) {
						node.children.push(astExpCopy(astSource.children[i], node.context));
					}
					break;
					
			}
			break;
			
		case AST_NODE.FUNC:
			
			//Update context
			node.context = astContextCopy(astSource.context, context);
			
			//Update children
			node.children.push(astParamCopy(astSource.children[0], node.context));
			node.children.push(astReturnTypeCopy(astSource.children[1]));
			node.children.push(astContentCopy(astSource.children[2], node.context, true));
			node.children.push(astValueCopy(astSource.children[3], node.context));
			
			break;
			
	}
	
	return node;
	
}

function astVarCopy(varNode) {
	
	//Create info header node
	let varHeader = {
		type: AST_NODE.INFO_HEADER,
		children: []
	};
	
	//Create var position nodes
	for(i = 0; i < varNode.children.length; i++) {
		
		//Create position node
		let posNode = {
			type: AST_NODE.INFO_HEADER,
			children: []
		};
		varHeader.children.push(posNode);
		
		//Create var nodes
		for(let j = 0; j < varNode.children[i].children.length; j++) {
			posNode.children.push({...varNode.children[i].children[j]});
		}
		
	}
	
	return varHeader;
	
}

function astValueCopy(node, context) {
	
	//Create info header node
	let headerNode = {...node};
	
	//Update children (expressions)
	headerNode.children = [];
	for(let i = 0; i < node.children.length; i++) {
		headerNode.children.push(astExpCopy(node.children[i], context));
	}
	
	return headerNode;
	
}

function astContentCopy(node, context, fromFunc) {
	
	//Create info header node
	let contentHeader = {
		type: AST_NODE.INFO_HEADER,
		children: []
	};
	
	//Append cases
	for(let i = 0; i < node.children.length; i++) {
		contentHeader.children.push(astCopy(node.children[i], context, fromFunc));
	}
	
	return contentHeader;
	
}

function astParamCopy(paramNode, context) {
	
	//Create info header node
	let paramsHeader = {
		type: AST_NODE.INFO_HEADER,
		children: []
	};
	
	//Create param nodes
	for(i = 0; i < paramNode.children.length; i++) {
		let paramNodeCopy = {...paramNode.children[i]};
		paramNodeCopy.info = astLocateVar(paramNode.children[i].info.content, context);
		paramsHeader.children.push(paramNodeCopy);
	}
	
	return paramsHeader;
	
}

function astReturnTypeCopy(typeNode, context) {
	
	//Create info header node
	let typesHeader = {
		type: AST_NODE.INFO_HEADER,
		children: []
	};
	
	//Create type nodes
	for(i = 0; i < typeNode.children.length; i++) {
		let typeCopy = {...typeNode.children[i]};
		typeCopy.info = {...typeNode.children[i].info};
		typesHeader.children.push(typeCopy);
	}
	
	return typesHeader;
	
}

function astExpCopy(astExp, context) {
	
	//Copy content
	let node = {...astExp};
	
	//Check node type
	switch(node.type) {
		
		case AST_NODE.EXPRESSION:
			node.children = [];
			for(let i = 0; i < astExp.children.length; i++) {
				node.children.push(astExpCopy(astExp.children[i], context));
			}
			break;
			
		case AST_NODE.VALUE:
			node.value = {...astExp.value};
			break;
			
		case AST_NODE.FUNC_EXP:
			
			//Update call
			node.call = {...astExp.call};
			
			//Update params
			node.children = [];
			for(let i = 0; i < astExp.children.length; i++) {
				node.children.push(astExpCopy(astExp.children[i], context));
			}
			
			break;
			
	}
	
	return node;
	
}

function astContextCopy(context, parentContext) {
	
	//Create new context
	let astContextCopy = {...context};
	
	//Update parent context
	astContextCopy.parentContext = parentContext;
	
	//Update vars
	astContextCopy.vars = [];
	let varKeys = Object.keys(context.vars);
	for(let i = 0; i < varKeys.length; i++) {
		astContextCopy.vars[varKeys[i]] = {...context.vars[varKeys[i]]};
	}
	
	return astContextCopy;
	
}

function astLocateVar(varName, context) {
		
	//Check if var exists in current context
	if(typeof context.vars[varName] !== UNDEFINED) {
		return context.vars[varName];
	}
	
	//Check parent contexts
	if(context.parentContext != null) {
		return astLocateVar(varName, context.parentContext);
	}
	
	//Var not found
	return null;
	
}

function astExistsVar(varName, context) {
		
	//Check if var exists in current context
	if(typeof context.vars[varName] !== UNDEFINED) {
		return true;
	}
	
	//Check parent contexts
	if(context.parentContext != null) {
		return astExistsVar(varName, context.parentContext);
	}
	
	//Var not found
	return false;
	
}

function locateExpFunc(exp) {
	//Check current node
	if(exp.type == AST_NODE.FUNC_EXP) {
		return exp;
	} else {
		//Visit children (must be 1!)
		return locateExpFunc(exp.children[0]);
	}
}
