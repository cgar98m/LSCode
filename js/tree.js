function treeCopy(nodeSource, parentNode) {

	//Check null node
	let tree = null;
	if(nodeSource != null) {
	
		//Copy all values (references included) and modify parent
		tree = {
			...nodeSource
		}
		tree.parentNode = parentNode;
		
		//Modify children if exist
		if(typeof nodeSource.children !== "undefined") {
			//Get children copies
			tree.children = [];
			for(let i = 0; i < nodeSource.children.length; i++) {
				tree.children.push(treeCopy(nodeSource.children[i], tree));
			}
		}
	
	}

	return tree;

}

function linkCopy(targetTree, sourceTree) {
		
	//Get leaf nodes from target and source (must be equal)
	let targetLeafes = leafes(targetTree);
	let sourceLeafes = leafes(sourceTree);
	
	//Link every leaf to correspondant node on target tree
	for(let i = 0; i < sourceLeafes.length; i++) {
		
		//Get path from linked node
		let path = nodePath(sourceLeafes[i].linkNode);
		
		//Link target node
		targetLeafes[i].linkNode = this.nodeFromPath(path.reverse(), targetTree);
		
		//Link children nodes
		targetLeafes[i].linkedChildren = [];
		for(let j = 0; j < sourceLeafes[i].linkedChildren.length; j++) {
			
			//Get path from linked node
			let path = nodePath(sourceLeafes[i].linkedChildren[j]);
			
			//Link target node
			let linkNode = this.nodeFromPath(path.reverse(), targetTree);
			if(linkNode != null) {
				targetLeafes[i].linkedChildren.push(linkNode);
			}
			
		}
		
	}
	
}

function leafes(node) {
		
	//Check node type
	let leafNodes = [];
	if(typeof node.children === "undefined") {
		leafNodes.push(node);
	} else {
		//Visit children
		for(let i = 0; i < node.children.length; i++) {
			leafNodes.push(...leafes(node.children[i]));
		}
	}
	
	return leafNodes;
	
}

function nodePath(node) {
		
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
			if(parentNode.children[i] == node) {
				path.push(i);
				break;
			}
		}
		
		//Append missing indexs
		path.push(...nodePath(parentNode));
		
	}
	
	return path;
	
}

function nodeFromPath(path, nodeTree) {
	
	//Check null path (other paths considered as valid)
	if(path.length == 0) {
		return null;
	}
	
	//Follow path
	let node = nodeTree;
	for(let i = 0; i < path.length; i++) {
		node = node.children[path[i]];
	}
	
	return node;
	
}

function deepPrune(node) {
	//Check valid node
	if(node != null) {
		
		//Prune branch
		prune(node);
		
		//Check if has a linked node
		if(node.linkNode != null) {
			
			//Prune node from linked node
			node.linkNode.linkedChildren.splice(node.linkNode.linkedChildren.indexOf(node), 1);
			
			//Deep prune linked node if was last link
			if(node.linkNode.linkedChildren.length == 0) {
				deepPrune(node.linkNode);
			}
			
			//Prune link node from node
			node.linkNode = null;
			
		}
		
	}
}

function prune(node) {
	//Check valid node
	if(node != null) {
		//Check null parent
		let parentNode = node.parentNode;
		if(parentNode != null) {
			
			//Remove node
			pruneNode(node);
			
			//Prune parent node if has no children
			if(parentNode.children.length == 0) {
				prune(parentNode);
			}
			
		}
	}
}

function pruneNode(node) {
	node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1);
	node.parentNode = null;
}

function compareTrees(targetTree, sourceTree) {
	
	//Get leafes from both trees (real content)
	let targetLeafes = leafes(targetTree);
	let sourceLeafes = leafes(sourceTree);
	
	//Compare leafes amount
	if(targetLeafes.length != sourceLeafes.length) {
		return false;
	}
	
	//Compare leafes paths
	for(let i = 0; i < targetLeafes.length; i++) {
		
		//Get leaf path
		let targetPath = nodePath(targetLeafes[i]);
		let sourcePath = nodePath(sourceLeafes[i]);
		
		//Compare path length
		if(targetPath.length != sourcePath.length) {
			return false;
		}
		
		//Compare leafes' path
		for(let j = 0; j < targetPath.length; j++) {
			if(targetPath[j] != sourcePath[j]) {
				return false;
			}
		}
	
	}
	
	//Equal trees
	return true;
	
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
				node.context = contextCopy(astSource.context, context);
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
			node.context = contextCopy(astSource.context, context);
			
			//Update children
			node.children.push(astParamCopy(astSource.children[0], node.context));
			node.children.push(astReturnTypeCopy(astSource.children[1]));
			node.children.push(astContentCopy(astSource.children[2], node.context, true));
			node.children.push(astValueCopy(astSource.children[3], node.context));
			
			break;
			
	}
	
	return node;
	
}

function contextCopy(context, parentContext) {
	
	//Create new context
	let contextCopy = {...context};
	
	//Update parent context
	contextCopy.parentContext = parentContext;
	
	//Update vars
	contextCopy.vars = [];
	let varKeys = Object.keys(context.vars);
	for(let i = 0; i < varKeys.length; i++) {
		contextCopy.vars[varKeys[i]] = {...context.vars[varKeys[i]]};
	}
	
	return contextCopy;
	
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
		paramNodeCopy.info = locateVar(paramNode.children[i].info.content, context);
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

function locateVar(varName, context) {
		
	//Check if var exists in current context
	if(typeof context.vars[varName] !== "undefined") {
		return context.vars[varName];
	}
	
	//Check parent contexts
	if(context.parentContext != null) {
		return locateVar(varName, context.parentContext);
	}
	
	//Var not found
	return null;
	
}
