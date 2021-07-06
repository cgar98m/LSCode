const INPUT_TEXTAREA_ID = "inputTextArea";
const TOKENS_TEXTAREA_ID = "tokensTextArea";
const INTERPRETE_BUTTON_ID = "interpreteButton";
const TAB_TOKENS_ID = "tabTokens";
const TAB_PRED_PARSE_TREE_ID = "tabPredParseTree";
const TAB_PARSE_TREE_ID = "tabParseTree";
const PARSE_TREE_CONTAINER_ID = "parseTreeContainer";
const PARSE_TREE_LIST_ID = "parseTreeList";
const PRED_PARSE_TREE_CONTAINER_ID = "predParseTreeContainer";
const PRED_PARSE_TREE_LIST_ID = "predParseTreeList";
const COLLAPSE_BUTTON_ID = "expandButton";
const HIDE_BUTTON_ID = "collapseButton";

const ACTIVE_CLASS = "active";
const DISABLED_CLASS = "disabled";
const DISP_NONE_CLASS = "d-none";
const DISP_FLEX_CLASS = "d-flex";

const TREE_LIST = "treeList";
const TREE_LIST_ARROW_CLASS = "treeListArrow";
const TREE_LIST_ARROW_DOWN_CLASS = "treeListArrowDown";
const NESTED_TREE_LIST_CLASS = "nestedTreeList";
const ACTIVE_TREE_LIST_CLASS = "activeTreeList";

const LIST_ITEM = "li";
const SUBLIST_ITEM = "ul";
const SPAN_ITEM = "span";

const LANG_PATH = "src/";
const JSON_TRAIL = ".json";

var inputTextArea;

var tokensTextArea;

var predParseTreeContainer;
var predParseTreeList;
var parseTreeContainer;
var parseTreeList;

var interpreteButton;

var tabTokens;
var tabPredParseTree;
var tabParseTree;

var collapseButton;
var hideButton;

var lang;

var frontEnd;
var lexer;

//Main
window.onload = function() {
	
	//Get text areas
	inputTextArea = document.getElementById(INPUT_TEXTAREA_ID);
	tokensTextArea = document.getElementById(TOKENS_TEXTAREA_ID);
	
	//Get predict parse tree list items
	predParseTreeContainer = document.getElementById(PRED_PARSE_TREE_CONTAINER_ID);
	predParseTreeList = document.getElementById(PRED_PARSE_TREE_LIST_ID);
	
	//Get parse tree list items
	parseTreeContainer = document.getElementById(PARSE_TREE_CONTAINER_ID);
	parseTreeList = document.getElementById(PARSE_TREE_LIST_ID);
	
	//Get interprete button and link action
	interpreteButton = document.getElementById(INTERPRETE_BUTTON_ID);
	interpreteButton.onclick = function() {

		//Disable button
		interpreteButton.disabled = true;

		//Scan input
		frontEnd.process(inputTextArea.value);
		
		//Display parsed tokens
		tokensTextArea.value = "";
		for(let i = 0; i < frontEnd.lexer.tokens.length; i++) {
			tokensTextArea.value += (frontEnd.lexer.tokens[i].token_id + ": " + frontEnd.lexer.tokens[i].content + "\n");
		}
		
		//Remove previous prediction parse tree
		while(predParseTreeList.lastElementChild) {
			predParseTreeList.removeChild(predParseTreeList.lastElementChild);
		}
		//Remove previous parse tree
		while(parseTreeList.lastElementChild) {
			parseTreeList.removeChild(parseTreeList.lastElementChild);
		}
		
		//Create new prediction and parse tree
		createPaths(predParseTreeList, frontEnd.parser.predTree);
		createPaths(parseTreeList, frontEnd.parser.parseTree);
		
		//TODO: Display more info and execution
		
		//Enable button
		interpreteButton.disabled = false;
		
	};
	
	//Get tab bar items
	tabTokens = document.getElementById(TAB_TOKENS_ID);
	tabPredParseTree = document.getElementById(TAB_PRED_PARSE_TREE_ID);
	tabParseTree = document.getElementById(TAB_PARSE_TREE_ID);
	
	//Get collapse button and link action
	collapseButton = document.getElementById(COLLAPSE_BUTTON_ID);
	collapseButton.onclick = function() {
		
		//Get selected tree list
		let tree;
		if(tabPredParseTree.classList.contains(ACTIVE_CLASS)) {
			tree = predParseTreeContainer;
		} else {
			tree = parseTreeContainer;
		}
		
		//Select all nested arrow items
		let arrowItems = tree.getElementsByClassName(TREE_LIST_ARROW_CLASS);
		for(let i = 0; i < arrowItems.length; i++) {
			arrowItems[i].parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.add(ACTIVE_TREE_LIST_CLASS);
			arrowItems[i].classList.add(TREE_LIST_ARROW_DOWN_CLASS);
		}
		
	}
	
	//Get hide button and link action
	hideButton = document.getElementById(HIDE_BUTTON_ID);
	hideButton.onclick = function() {
		
		//Get selected tree list
		let tree;
		if(tabPredParseTree.classList.contains(ACTIVE_CLASS)) {
			tree = predParseTreeContainer;
		} else {
			tree = parseTreeContainer;
		}
		
		//Select all nested arrow items
		let arrowItems = tree.getElementsByClassName(TREE_LIST_ARROW_CLASS);
		for(let i = 0; i < arrowItems.length; i++) {
			arrowItems[i].parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.remove(ACTIVE_TREE_LIST_CLASS);
			arrowItems[i].classList.remove(TREE_LIST_ARROW_DOWN_CLASS);
		}
		
	}
	
	//Link click actions
	tabTokens.onclick = function() {
		
		//Display tokens and hide others
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_NONE_CLASS);
		tokensTextArea.classList.add(DISP_FLEX_CLASS);
		
		//Update tab bar
		tabTokens.classList.add(DISABLED_CLASS);
		tabTokens.classList.add(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(DISABLED_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(DISABLED_CLASS);
		
		//Hide buttons
		collapseButton.classList.add(DISP_NONE_CLASS);
		hideButton.classList.add(DISP_NONE_CLASS);
		
	}
	tabPredParseTree.onclick = function() {
		
		//Display parse tree and hide others
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_NONE_CLASS);
		predParseTreeContainer.classList.add(DISP_FLEX_CLASS);
		
		//Update tab bar
		tabPredParseTree.classList.add(DISABLED_CLASS);
		tabPredParseTree.classList.add(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(DISABLED_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabTokens.classList.remove(DISABLED_CLASS);
		
		//Show buttons
		collapseButton.classList.remove(DISP_NONE_CLASS);
		hideButton.classList.remove(DISP_NONE_CLASS);
		
	}
	tabParseTree.onclick = function() {
		
		//Display parse tree and hide others
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_NONE_CLASS);
		parseTreeContainer.classList.add(DISP_FLEX_CLASS);
		
		//Update tab bar
		tabParseTree.classList.add(DISABLED_CLASS);
		tabParseTree.classList.add(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(DISABLED_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabTokens.classList.remove(DISABLED_CLASS);
		
		//Show buttons
		collapseButton.classList.remove(DISP_NONE_CLASS);
		hideButton.classList.remove(DISP_NONE_CLASS);
		
	}
	
	//Set default view
	tabTokens.classList.add(ACTIVE_CLASS);
	tabParseTree.classList.remove(DISABLED_CLASS);
	tabPredParseTree.classList.remove(DISABLED_CLASS);
	
	//TODO: Prepare interprete depending on language
	lang = "cat";
	let xhr = new XMLHttpRequest();
	xhr.open("GET", LANG_PATH + lang + JSON_TRAIL, true);
	xhr.onload = function(error) {
		//Check status
		if(xhr.readyState === 4) {
			if(xhr.status === 200) {
				
				//Get file data
				let data = JSON.parse(xhr.responseText.replace("/\\/g", "\\\\"));
				
				//Create front end
				frontEnd = new FrontEnd(data);
				
				//TODO: Create back end
				
				//Enable button
				interpreteButton.disabled = false;
				
			} else {
				console.log(xhr.statusText);
			}
		}
	}
	xhr.onerror = function(error) {
		console.log(xhr.statusText);
	}
	xhr.send();
	
}

function createPaths(domElement, trees) {
	
	//Create all possible paths
	for(let i = 0; i < trees.length; i++) {
		
		//Create list content and append to parent
		let listItem = document.createElement(LIST_ITEM);
		domElement.appendChild(listItem);
		
		//Create arrow and append to list item
		let arrow = document.createElement(SPAN_ITEM);
		arrow.classList.add(TREE_LIST_ARROW_CLASS);
		arrow.addEventListener("click", function() {
			this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
			this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
		});
		arrow.textContent = "PATH " + i;
		listItem.appendChild(arrow);
		
		//Create sublist item
		let subListItem = document.createElement(SUBLIST_ITEM);
		subListItem.classList.add(NESTED_TREE_LIST_CLASS);
		subListItem.classList.add(TREE_LIST);
		listItem.appendChild(subListItem);
		
		//Create subtree
		createTree(subListItem, trees[i]);
		
	}
	
}

function createTree(domElement, node) {
	
	//Check null node
	if(node == null) {
		return;
	}
	
	//Create list content and append to parent
	let listItem = document.createElement(LIST_ITEM);
	domElement.appendChild(listItem);
	
	//Check if is LEAF node
	if(node.type == LEAF_NODE || node.type == EPSILON_NODE) {
		listItem.textContent = node.production_id;
	} else {
		
		//Check if has children
		if(node.children.length > 0) {
			
			//Create arrow and append to list item
			let arrow = document.createElement(SPAN_ITEM);
			arrow.classList.add(TREE_LIST_ARROW_CLASS);
			arrow.addEventListener("click", function() {
				this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
				this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
			});
			listItem.appendChild(arrow);
			
			//Check if is FORK node
			if(node.type == FORK_NODE) {
				arrow.textContent = node.production_idx;
			} else {
				arrow.textContent = node.production_id;
			}
			
			//Create sublist item
			let subListItem = document.createElement(SUBLIST_ITEM);
			subListItem.classList.add(NESTED_TREE_LIST_CLASS);
			subListItem.classList.add(TREE_LIST);
			listItem.appendChild(subListItem);
			
			//Create sublist item for every child
			for(let i = 0; i < node.children.length; i++) {
				createTree(subListItem, node.children[i]);
			}
			
		} else {
			//Check if is FORK node
			if(node.type == FORK_NODE) {
				listItem.textContent = node.production_idx;
			} else {
				listItem.textContent = node.production_id;
			}
		}

	}
	
}
