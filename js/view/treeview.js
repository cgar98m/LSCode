function createListElement(domElement, textContent) {
	let listItem = document.createElement(LIST_ITEM);
	listItem.textContent = textContent;
	domElement.appendChild(listItem);
	return listItem;
}

function createArrowElement(domElement, textContent) {
	
	//Create list item
	let listItem = createListElement(domElement, EMPTY);
	
	//Create arrow and append to list item
	let arrow = document.createElement(SPAN_ITEM);
	arrow.classList.add(TREE_NODE_ARROW_CLASS);
	arrow.addEventListener(CLICK_ACTION, function() {
		this.parentElement.querySelector(CLASS.format(TREE_NODE_NESTED_CLASS)).classList.toggle(TREE_NODE_ACTIVE_CLASS);
		this.classList.toggle(TREE_NODE_ARROW_DOWN_CLASS);
	});
	listItem.appendChild(arrow);
	arrow.textContent = textContent;
	
	return listItem;
	
}

function createSubListElement(listItem) {
	let subListItem = document.createElement(SUBLIST_ITEM);
	subListItem.classList.add(TREE_NODE_NESTED_CLASS);
	subListItem.classList.add(TREE_NODE_CLASS);
	listItem.appendChild(subListItem);
	return subListItem;
}

function clearTree(tree) {
	while(tree.lastElementChild) {
		tree.removeChild(tree.lastElementChild);
	}
}

function expandButtonAction(btn, tree) {
	return function() {
		
		//Disable button
		btn.disabled = true;
		
		//Expand all tree items
		let expandableItems = tree.getElementsByClassName(TREE_NODE_ARROW_CLASS);
		for(let i = 0; i < expandableItems.length; i++) {
			expandableItems[i].parentElement.querySelector(CLASS.format(TREE_NODE_NESTED_CLASS)).classList.add(TREE_NODE_ACTIVE_CLASS);
			expandableItems[i].classList.add(TREE_NODE_ARROW_DOWN_CLASS);
		}
		
		//Enable button
		btn.disabled = false;
		
	}
}

function collapseButtonAction(btn, tree) {
	return function() {
		
		//Disable button
		btn.disabled = true;
		
		//Collapse all tree items
		let collapsableItems = tree.getElementsByClassName(TREE_NODE_ARROW_CLASS);
		for(let i = 0; i < collapsableItems.length; i++) {
			collapsableItems[i].parentElement.querySelector(CLASS.format(TREE_NODE_NESTED_CLASS)).classList.remove(TREE_NODE_ACTIVE_CLASS);
			collapsableItems[i].classList.remove(TREE_NODE_ARROW_DOWN_CLASS);
		}
		
		//Enable button
		btn.disabled = false;
		
	}
}
