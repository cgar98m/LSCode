function createParsePaths(domElement, trees) {
	
	//Create all possible paths
	for(let i = 0; i < trees.length; i++) {
		
		//Create list content and append to parent
		let listItem = document.createElement(LIST_ITEM);
		domElement.appendChild(listItem);
		
		//Create arrow and append to list item
		let arrow = document.createElement(SPAN_ITEM);
		arrow.classList.add(TREE_NODE_ARROW_CLASS);
		arrow.addEventListener(CLICK_ACTION, function() {
			this.parentElement.querySelector(CLASS.format(TREE_NODE_NESTED_CLASS)).classList.toggle(TREE_NODE_ACTIVE_CLASS);
			this.classList.toggle(TREE_NODE_ARROW_DOWN_CLASS);
		});
		arrow.textContent = MSG_TREE.format(i);
		listItem.appendChild(arrow);
		
		//Create sublist item
		let subListItem = document.createElement(SUBLIST_ITEM);
		subListItem.classList.add(TREE_NODE_NESTED_CLASS);
		subListItem.classList.add(TREE_NODE_CLASS);
		listItem.appendChild(subListItem);
		
		//Create subtree
		createParsePathTree(subListItem, trees[i]);
		
	}
	
}

function createParsePathTree(domElement, node) {
	
	//Check null node
	if(node == null) {
		return;
	}
	
	//Create list content and append to parent
	let listItem = document.createElement(LIST_ITEM);
	domElement.appendChild(listItem);
	
	//Check if is a leaf node
	if(typeof node.children === UNDEFINED) {
		listItem.textContent = node.production_id;
	} else {
		
		//Check if has children
		if(node.children.length > 0) {
			
			//Create arrow and append to list item
			let arrow = document.createElement(SPAN_ITEM);
			arrow.classList.add(TREE_NODE_ARROW_CLASS);
			arrow.addEventListener(CLICK_ACTION, function() {
				this.parentElement.querySelector(CLASS.format(TREE_NODE_NESTED_CLASS)).classList.toggle(TREE_NODE_ACTIVE_CLASS);
				this.classList.toggle(TREE_NODE_ARROW_DOWN_CLASS);
			});
			listItem.appendChild(arrow);
			
			//Check if is a FORK node
			if(node.type == NODE_TYPE.FORK) {
				arrow.textContent = node.production_idx;
			} else {
				arrow.textContent = node.production_id;
			}
			
			//Create sublist item
			let subListItem = document.createElement(SUBLIST_ITEM);
			subListItem.classList.add(TREE_NODE_NESTED_CLASS);
			subListItem.classList.add(TREE_NODE_CLASS);
			listItem.appendChild(subListItem);
			
			//Create sublist item for every child
			for(let i = 0; i < node.children.length; i++) {
				createParsePathTree(subListItem, node.children[i]);
			}
			
		} else {
			//Check if is a FORK node
			if(node.type == NODE_TYPE.FORK) {
				listItem.textContent = node.production_idx;
			} else {
				listItem.textContent = node.production_id;
			}
		}

	}
	
}
