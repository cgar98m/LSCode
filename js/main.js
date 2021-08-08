const INPUT_TEXTAREA_ID = "inputTextArea";
const ERROR_TEXTAREA_ID = "errorTextArea";
const TOKENS_TEXTAREA_ID = "tokensTextArea";
const INTERPRETE_BUTTON_ID = "interpreteButton";

const TAB_ERROR_ID = "tabError";
const TAB_DEBUG_CONTAINER_ID = "tabDebugContainer";
const TAB_DEBUG_ID = "tabDebug";
const TAB_TOKENS_ID = "tabTokens";
const TAB_PRED_PARSE_TREE_ID = "tabPredParseTree";
const TAB_PARSE_TREE_ID = "tabParseTree";
const TAB_AST_TREE_ID = "tabAstTree";

const PARSE_TREE_CONTAINER_ID = "parseTreeContainer";
const PARSE_TREE_LIST_ID = "parseTreeList";
const PRED_PARSE_TREE_CONTAINER_ID = "predParseTreeContainer";
const PRED_PARSE_TREE_LIST_ID = "predParseTreeList";
const AST_TREE_CONTAINER_ID = "astTreeContainer";
const AST_TREE_LIST_ID = "astTreeList";

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

const DROPDOWN_MENU = '.dropdown-toggle';

const LIST_ITEM = "li";
const SUBLIST_ITEM = "ul";
const SPAN_ITEM = "span";

const LANG_PATH = "lang/";
const JSON_TRAIL = ".json";

var inputTextArea;
var errorTextArea;
var tokensTextArea;

var predParseTreeContainer;
var predParseTreeList;
var parseTreeContainer;
var parseTreeList;

var interpreteButton;

var tabError;
var tabDebugContainer;
var tabDebug;
var tabTokens;
var tabPredParseTree;
var tabParseTree;

var collapseButton;
var hideButton;

var viewMode;

var lang;

var errorHandler;
var frontEnd;
var lexer;

var debugMode;

const VIEW_MODE = {
	ERROR: 'E',
	TOKENS: 'T',
	PREDICTION: 'P',
	SINTAX: 'S',
	AST: 'A'
}
var dropdownList;

//Main
window.onload = function() {
	
	//Set default view mode
	viewMode = VIEW_MODE.TOKENS;
	
	//Get text areas
	inputTextArea = document.getElementById(INPUT_TEXTAREA_ID);
	errorTextArea = document.getElementById(ERROR_TEXTAREA_ID);
	tokensTextArea = document.getElementById(TOKENS_TEXTAREA_ID);
	
	//Get predict parse tree list items
	predParseTreeContainer = document.getElementById(PRED_PARSE_TREE_CONTAINER_ID);
	predParseTreeList = document.getElementById(PRED_PARSE_TREE_LIST_ID);
	
	//Get parse tree list items
	parseTreeContainer = document.getElementById(PARSE_TREE_CONTAINER_ID);
	parseTreeList = document.getElementById(PARSE_TREE_LIST_ID);
	
	//Get ast tree list items
	astTreeContainer = document.getElementById(AST_TREE_CONTAINER_ID);
	astTreeList = document.getElementById(AST_TREE_LIST_ID);
	
	//Get interprete button and link action
	interpreteButton = document.getElementById(INTERPRETE_BUTTON_ID);
	interpreteButton.onclick = function() {

		//Disable button
		interpreteButton.disabled = true;

		//Clear previous errors
		errorHandler.clear();

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
		//Remove previous AST tree
		while(astTreeList.lastElementChild) {
			astTreeList.removeChild(astTreeList.lastElementChild);
		}
		
		//Create new prediction and parse tree
		createParsePaths(predParseTreeList, frontEnd.parser.predTree);
		createParsePaths(parseTreeList, frontEnd.parser.parseTree);
		
		//Create AST tree
		createAstTree(astTreeList, frontEnd.semantica.astTree, frontEnd.semantica.funcAstTree);
		
		//Display errors
		errorTextArea.value = "";
		for(let i = 0; i < errorHandler.errors.length; i++) {
			let error = errorHandler.errors[i];
			errorTextArea.value += ("[" + error.type + " - " + error.font + "] " + error.msg + "\n");
		}
		
		//TODO: Display execution
		
		//Enable button
		interpreteButton.disabled = false;
		
	};
	
	//Get tab bar items
	tabError = document.getElementById(TAB_ERROR_ID);
	tabDebugContainer = document.getElementById(TAB_DEBUG_CONTAINER_ID);
	tabDebug = document.getElementById(TAB_DEBUG_ID);
	tabTokens = document.getElementById(TAB_TOKENS_ID);
	tabPredParseTree = document.getElementById(TAB_PRED_PARSE_TREE_ID);
	tabParseTree = document.getElementById(TAB_PARSE_TREE_ID);
	tabAstTree = document.getElementById(TAB_AST_TREE_ID);
	
	//Get collapse button and link action
	collapseButton = document.getElementById(COLLAPSE_BUTTON_ID);
	collapseButton.onclick = function() {
		
		//Get selected tree list
		let tree;
		if(viewMode == VIEW_MODE.PREDICTION) {
			tree = predParseTreeContainer;
		} else if(viewMode == VIEW_MODE.SINTAX) {
			tree = parseTreeContainer;
		} else {
			tree = astTreeContainer;
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
		if(viewMode == VIEW_MODE.PREDICTION) {
			tree = predParseTreeContainer;
		} else if(viewMode == VIEW_MODE.SINTAX) {
			tree = parseTreeContainer;
		} else {
			tree = astTreeContainer;
		}
		
		//Select all nested arrow items
		let arrowItems = tree.getElementsByClassName(TREE_LIST_ARROW_CLASS);
		for(let i = 0; i < arrowItems.length; i++) {
			arrowItems[i].parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.remove(ACTIVE_TREE_LIST_CLASS);
			arrowItems[i].classList.remove(TREE_LIST_ARROW_DOWN_CLASS);
		}
		
	}
	
	//Link click actions
	tabError.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.ERROR;
		
		//Display errors and hide others
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_FLEX_CLASS);
		astTreeContainer.classList.add(DISP_NONE_CLASS);
		errorTextArea.classList.remove(DISP_NONE_CLASS);
		errorTextArea.classList.add(DISP_FLEX_CLASS);
		
		//Mark error tab
		tabError.classList.add(ACTIVE_CLASS);
		tabDebug.classList.remove(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide buttons
		collapseButton.classList.add(DISP_NONE_CLASS);
		hideButton.classList.add(DISP_NONE_CLASS);
		
	}
	tabTokens.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.TOKENS;
		
		//Display tokens and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_FLEX_CLASS);
		astTreeContainer.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_NONE_CLASS);
		tokensTextArea.classList.add(DISP_FLEX_CLASS);
		
		//Mark tokens tab
		tabError.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.add(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide buttons
		collapseButton.classList.add(DISP_NONE_CLASS);
		hideButton.classList.add(DISP_NONE_CLASS);
		
	}
	tabPredParseTree.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.PREDICTION;
		
		//Display parse tree and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_FLEX_CLASS);
		astTreeContainer.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_NONE_CLASS);
		predParseTreeContainer.classList.add(DISP_FLEX_CLASS);
		
		//Mark prediction tab
		tabError.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.add(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Show buttons
		collapseButton.classList.remove(DISP_NONE_CLASS);
		hideButton.classList.remove(DISP_NONE_CLASS);
		
	}
	tabParseTree.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.SINTAX;
		
		//Display parse tree and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_FLEX_CLASS);
		astTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_NONE_CLASS);
		parseTreeContainer.classList.add(DISP_FLEX_CLASS);
		
		//Mark parse tab
		tabError.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.add(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Show buttons
		collapseButton.classList.remove(DISP_NONE_CLASS);
		hideButton.classList.remove(DISP_NONE_CLASS);
		
	}
	tabAstTree.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.AST;
		
		//Display ast tree and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_NONE_CLASS);
		astTreeContainer.classList.add(DISP_FLEX_CLASS);
		
		//Mark ast tab
		tabError.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.add(ACTIVE_CLASS);
		
		//Show buttons
		collapseButton.classList.remove(DISP_NONE_CLASS);
		hideButton.classList.remove(DISP_NONE_CLASS);
		
	}
	
	//TODO: Prepare interpreter depending on language
	lang = "cat";
	let xhr = new XMLHttpRequest();
	xhr.open("GET", LANG_PATH + lang + JSON_TRAIL, true);
	xhr.onload = function(error) {
		//Check status
		if(xhr.readyState === 4) {
			if(xhr.status === 200) {
				
				//Get file data
				let data = JSON.parse(xhr.responseText.replace("/\\/g", "\\\\"));
				
				//Create error handler
				errorHandler = new ErrorHandler();
				
				//Create front end
				frontEnd = new FrontEnd(data, errorHandler);
				
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
	
	debugMode = function() {
		
		//Toggle debug tab
		tabDebugContainer.classList.toggle(DISP_NONE_CLASS);
		
		//Check if debug mode window was shown
		if(tabDebugContainer.classList.contains(DISP_NONE_CLASS)) {
			if(viewMode != VIEW_MODE.ERROR) {
				
				//Update view mode
				viewMode = VIEW_MODE.ERROR;
				
				//Display errors and hide others
				tokensTextArea.classList.remove(DISP_FLEX_CLASS);
				tokensTextArea.classList.add(DISP_NONE_CLASS);
				predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
				predParseTreeContainer.classList.add(DISP_NONE_CLASS);
				parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
				parseTreeContainer.classList.add(DISP_NONE_CLASS);
				astTreeContainer.classList.remove(DISP_FLEX_CLASS);
				astTreeContainer.classList.add(DISP_NONE_CLASS);
				errorTextArea.classList.remove(DISP_NONE_CLASS);
				errorTextArea.classList.add(DISP_FLEX_CLASS);
				
				//Mark error tab
				tabError.classList.add(ACTIVE_CLASS);
				tabDebug.classList.remove(ACTIVE_CLASS);
				tabTokens.classList.remove(ACTIVE_CLASS);
				tabPredParseTree.classList.remove(ACTIVE_CLASS);
				tabParseTree.classList.remove(ACTIVE_CLASS);
				tabAstTree.classList.remove(ACTIVE_CLASS);
				
				//Hide buttons
				collapseButton.classList.add(DISP_NONE_CLASS);
				hideButton.classList.add(DISP_NONE_CLASS);
				
			}
		}
		
	}
	
}

function createParsePaths(domElement, trees) {
	
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
	if(typeof node.children === "undefined") {
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
			
			//Check if is a FORK node
			if(node.type == NODE_TYPE.FORK) {
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

function createAstTree(domElement, codeNode, funcNodeList) {
	
	//Check null info
	if(codeNode == null) {
		return;
	}
	
	//Get code actions
	let actions = codeNode.children;
	if(actions.length > 0) {
		
		//Create core code item
		let codeItem = document.createElement(LIST_ITEM);
		domElement.appendChild(codeItem);
		
		//Create arrow and append to list item
		let actionListArrow = document.createElement(SPAN_ITEM);
		actionListArrow.classList.add(TREE_LIST_ARROW_CLASS);
		actionListArrow.addEventListener("click", function() {
			this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
			this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
		});
		actionListArrow.textContent = "CODE";
		codeItem.appendChild(actionListArrow);
			
		//Create context item
		let contextItem = document.createElement(SUBLIST_ITEM);
		contextItem.classList.add(NESTED_TREE_LIST_CLASS);
		contextItem.classList.add(TREE_LIST);
		codeItem.appendChild(contextItem);
		
		//Create subtree
		createAstTreePath(contextItem, codeNode);
		
	}
	
	//Get functions
	let funcs = Object.keys(funcNodeList);
	if(funcs.length == 0) {
		return;
	}
	
	//Create function list tree
	let funcListItem = document.createElement(LIST_ITEM);
	domElement.appendChild(funcListItem);
	
	//Create arrow and append to list item
	let funcListArrow = document.createElement(SPAN_ITEM);
	funcListArrow.classList.add(TREE_LIST_ARROW_CLASS);
	funcListArrow.addEventListener("click", function() {
		this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
		this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
	});
	funcListArrow.textContent = "FUNCTIONS";
	funcListItem.appendChild(funcListArrow);
	
	//Explore all possible functions
	for(let i = 0; i < funcs.length; i++) {
		
		//Create function item
		let funcItem = document.createElement(SUBLIST_ITEM);
		funcItem.classList.add(NESTED_TREE_LIST_CLASS);
		funcItem.classList.add(TREE_LIST);
		funcListItem.appendChild(funcItem);
		
		//Create subtree
		createAstTreePath(funcItem, funcNodeList[funcs[i]]);
		
	}
	
}

function createAstTreePath(domElement, node) {
	
	//TODO
	
	//Check null node
	if(node == null) {
		return;
	}
	
	//Create list content and append to parent
	let listItem = document.createElement(LIST_ITEM);
	domElement.appendChild(listItem);
	
	//Check node type
	switch(node.type) {
		
		case AST_NODE.STRUCT:
			if(node.children.length > 0) {
				
				//Create arrow and append to list item
				let arrow = document.createElement(SPAN_ITEM);
				arrow.classList.add(TREE_LIST_ARROW_CLASS);
				arrow.addEventListener("click", function() {
					this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
					this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
				});
				listItem.appendChild(arrow);
				arrow.textContent = "CONTEXT";
				
				//Create sublist item
				let subListItem = document.createElement(SUBLIST_ITEM);
				subListItem.classList.add(NESTED_TREE_LIST_CLASS);
				subListItem.classList.add(TREE_LIST);
				listItem.appendChild(subListItem);
				
				//Create sublist item for every child
				for(let i = 0; i < node.children.length; i++) {
					createAstTreePath(subListItem, node.children[i]);
				}
				
			} else {
				listItem.textContent = "CONTEXT";
			}
			break;
			
		case AST_NODE.ACTION:
			switch(node.semantica) {
				
				case SEMANTICA_KEYS.VAR_ASSIGN:
				
					//Create arrow and append to list item
					let arrow = document.createElement(SPAN_ITEM);
					arrow.classList.add(TREE_LIST_ARROW_CLASS);
					arrow.addEventListener("click", function() {
						this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
						this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
					});
					listItem.appendChild(arrow);
					arrow.textContent = node.semantica;
					
					//Create sublist item
					let subListItem = document.createElement(SUBLIST_ITEM);
					subListItem.classList.add(NESTED_TREE_LIST_CLASS);
					subListItem.classList.add(TREE_LIST);
					listItem.appendChild(subListItem);
				
					//Create info nodes
					createVarListPath(subListItem, node.children[0]);
					createExpressionListPath(subListItem, node.children[1]);
					
					break;
					
				case SEMANTICA_KEYS.FORK:
					break;
					
				case SEMANTICA_KEYS.LOOP:
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					break;
					
			}
			break;
			
		case AST_NODE.FUNC:
			break;
			
	}
	
}

function createVarListPath(domElement, node) {
	
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
	listItem.appendChild(arrow);
	arrow.textContent = "vars";
	
	//Create sublist item
	let subListItem = document.createElement(SUBLIST_ITEM);
	subListItem.classList.add(NESTED_TREE_LIST_CLASS);
	subListItem.classList.add(TREE_LIST);
	listItem.appendChild(subListItem);
	
	//Create sublist item for every var position
	for(let i = 0; i < node.children.length; i++) {
		createVarPositionPath(subListItem, node.children[i], i);
	}
	
}

function createVarPositionPath(domElement, node, position) {
	
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
	listItem.appendChild(arrow);
	arrow.textContent = "position " + position;
	
	//Create sublist item
	let subListItem = document.createElement(SUBLIST_ITEM);
	subListItem.classList.add(NESTED_TREE_LIST_CLASS);
	subListItem.classList.add(TREE_LIST);
	listItem.appendChild(subListItem);
	
	//Create sublist item for every var
	for(let i = 0; i < node.children.length; i++) {
		let varListItem = document.createElement(LIST_ITEM);
		subListItem.appendChild(varListItem);
		varListItem.textContent = node.children[i].content + ": " + node.children[i].type;
	}
	
}

function createExpressionListPath(domElement, node) {
	
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
	listItem.appendChild(arrow);
	arrow.textContent = "expressions";
	
	//Create sublist item
	let subListItem = document.createElement(SUBLIST_ITEM);
	subListItem.classList.add(NESTED_TREE_LIST_CLASS);
	subListItem.classList.add(TREE_LIST);
	listItem.appendChild(subListItem);
	
	//Create sublist item for every var position
	for(let i = 0; i < node.children.length; i++) {
		createExpressionPath(subListItem, node.children[i]);
	}
	
}

function createExpressionPath(domElement, node) {
	//Check node type
	let listItem = document.createElement(LIST_ITEM);
	switch(node.type) {
		case AST_NODE.EXPRESSION:
			//Check if has any operation assigned
			if(typeof node.operation === "undefined") {
				createExpressionPath(domElement, node.children[0]);
			} else {
				
				//Append list item
				domElement.appendChild(listItem);
				
				//Create arrow and append to list item
				let arrow = document.createElement(SPAN_ITEM);
				arrow.classList.add(TREE_LIST_ARROW_CLASS);
				arrow.addEventListener("click", function() {
					this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
					this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
				});
				listItem.appendChild(arrow);
				arrow.textContent = node.operation;
				
				//Create sublist item
				let subListItem = document.createElement(SUBLIST_ITEM);
				subListItem.classList.add(NESTED_TREE_LIST_CLASS);
				subListItem.classList.add(TREE_LIST);
				listItem.appendChild(subListItem);
				
				//Create sublist item for every var position
				for(let i = 0; i < node.children.length; i++) {
					createExpressionPath(subListItem, node.children[i]);
				}
				
			}
			break;
		
		case AST_NODE.VALUE:
			domElement.appendChild(listItem);
			listItem.textContent = node.value.content;
			break;
			
		case AST_NODE.ID:
			domElement.appendChild(listItem);
			listItem.textContent = node.ref.content;
			break;
			
		case AST_NODE.FUNC_EXP:
		
			//Append list item
			domElement.appendChild(listItem);
				
			//Create arrow and append to list item
			let arrow = document.createElement(SPAN_ITEM);
			arrow.classList.add(TREE_LIST_ARROW_CLASS);
			arrow.addEventListener("click", function() {
				this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
				this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
			});
			listItem.appendChild(arrow);
			arrow.textContent = node.call.content;
			
			//Create sublist item
			let subListItem = document.createElement(SUBLIST_ITEM);
			subListItem.classList.add(NESTED_TREE_LIST_CLASS);
			subListItem.classList.add(TREE_LIST);
			listItem.appendChild(subListItem);
			
			//Create sublist item for every param
			for(let i = 0; i < node.children.length; i++) {
				createExpressionPath(subListItem, node.children[i]);
			}
			
			break;
			
	}
}
