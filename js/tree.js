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
			
			//Deep prune linked ndoe if was last link
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
