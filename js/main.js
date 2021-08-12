const INPUT_TEXTAREA_ID = "inputTextArea";
const ERROR_TEXTAREA_ID = "errorTextArea";
const OUTPUT_TEXTAREA_ID = "outputTextArea";
const TOKENS_TEXTAREA_ID = "tokensTextArea";

const INTERPRETE_BUTTON_ID = "interpreteButton";

const TAB_ERROR_ID = "tabError";
const TAB_EXECUTION_ID = "tabExecution";
const TAB_COST_ID = "tabCost";
const TAB_DEBUG_CONTAINER_ID = "tabDebugContainer";
const TAB_DEBUG_ID = "tabDebug";
const TAB_TOKENS_ID = "tabTokens";
const TAB_PRED_PARSE_TREE_ID = "tabPredParseTree";
const TAB_PARSE_TREE_ID = "tabParseTree";
const TAB_AST_TREE_ID = "tabAstTree";

const EXECUTION_CONTAINER_ID = "executionContainer";
const CODE_CONTAINER_ID = "codeContainer";
const COST_CONTAINER_ID = "costContainer";
const COST_TEXT_CONTAINER_ID = "costTextContainer";
const PARSE_TREE_CONTAINER_ID = "parseTreeContainer";
const PARSE_TREE_LIST_ID = "parseTreeList";
const PRED_PARSE_TREE_CONTAINER_ID = "predParseTreeContainer";
const PRED_PARSE_TREE_LIST_ID = "predParseTreeList";
const AST_TREE_CONTAINER_ID = "astTreeContainer";
const AST_TREE_LIST_ID = "astTreeList";

const TREE_BUTTON_GROUP_ID = "treeButtons";
const COLLAPSE_BUTTON_ID = "expandButton";
const HIDE_BUTTON_ID = "collapseButton";

const EXECUTION_BUTTON_GROUP_ID = "executionButtons";
const PLAY_BUTTON_ID = "playButton";
const SKIP_BUTTON_ID = "skipButton";
const PAUSE_BUTTON_ID = "pauseButton";
const RELOAD_BUTTON_ID = "reloadButton";

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
const BR_ITEM = "br";
const MARK_ITEM = "mark";
const PRE_ITEM = "pre";
const DIV_ITEM = "div";

const CLASS_ATTR = "class";

const BG_PRIMARY_CLASS = "bg-primary";
const BG_SUCCESS_CLASS = "bg-success";
const PAD_NONE_CLASS = "p-0";
const MARGIN_NONE_CLASS = "m-0";

const LANG_PATH = "lang/";
const JSON_TRAIL = ".json";

const EXECUTION_RATE = 1000;

var inputTextArea;
var errorTextArea;
var outputTextArea;
var tokensTextArea;

var executionContainer;
var codeContainer;
var costContainer;
var costTextContainer;
var predParseTreeContainer;
var predParseTreeList;
var parseTreeContainer;
var parseTreeList;

var interpreteButton;

var tabError;
var tabExecution;
var tabCost;
var tabDebugContainer;
var tabDebug;
var tabTokens;
var tabPredParseTree;
var tabParseTree;

var treeButtons;
var collapseButton;
var hideButton;

var executionButtons;
var playButton;
var skipButton;
var pauseButton;
var reloadButton;

var codeDisplay;
var costDisplay;

var executionQueue;

var viewMode;

var lang;

var errorHandler;
var frontEnd;
var backEnd;

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
	
	//Disable execution
	executionQueue = null;
	
	//Set default view mode
	viewMode = VIEW_MODE.TOKENS;
	
	//Get text areas
	inputTextArea = document.getElementById(INPUT_TEXTAREA_ID);
	errorTextArea = document.getElementById(ERROR_TEXTAREA_ID);
	tokensTextArea = document.getElementById(TOKENS_TEXTAREA_ID);
	
	//Get execution items
	executionContainer = document.getElementById(EXECUTION_CONTAINER_ID);
	codeContainer = document.getElementById(CODE_CONTAINER_ID);
	outputTextArea = document.getElementById(OUTPUT_TEXTAREA_ID);
	costContainer = document.getElementById(COST_CONTAINER_ID);
	costTextContainer = document.getElementById(COST_TEXT_CONTAINER_ID);
	
	//Get predict parse tree list items
	predParseTreeContainer = document.getElementById(PRED_PARSE_TREE_CONTAINER_ID);
	predParseTreeList = document.getElementById(PRED_PARSE_TREE_LIST_ID);
	
	//Get parse tree list items
	parseTreeContainer = document.getElementById(PARSE_TREE_CONTAINER_ID);
	parseTreeList = document.getElementById(PARSE_TREE_LIST_ID);
	
	//Get ast tree list items
	astTreeContainer = document.getElementById(AST_TREE_CONTAINER_ID);
	astTreeList = document.getElementById(AST_TREE_LIST_ID);
	
	//Get button groups
	treeButtons = document.getElementById(TREE_BUTTON_GROUP_ID);
	executionButtons = document.getElementById(EXECUTION_BUTTON_GROUP_ID);
	
	//Get interprete button and link action
	interpreteButton = document.getElementById(INTERPRETE_BUTTON_ID);
	interpreteButton.onclick = function() {

		//Disable all buttons
		interpreteButton.disabled = true;
		playButton.disabled = true;
		skipButton.disabled = true;
		pauseButton.disabled = true;
		reloadButton.disabled = true;
		
		//Disable interval
		clearInterval(executionQueue);

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
		
		//Clear previous execution output
		outputTextArea.value = "";
		
		//Check if no critical error was found (valid code)
		if(errorHandler.criticalErrors == 0) {
			
			//Update views
			errorTextArea.value += "[Info] No critical errors found";
			codeDisplay.setContent(inputTextArea.value);
			costDisplay.setContent(inputTextArea.value);
			
			//Prepare back end and code execution
			backEnd.updateInfo(frontEnd.semantica.astTree, frontEnd.semantica.funcAstTree, frontEnd.semantica.sysFunc);
			prepareCodeRun();		
			
		} else {
			
			//Clear views
			codeDisplay.clear();
			costDisplay.clear();
			
			//Update buttons
			playButton.disabled = true;
			skipButton.disabled = true;
			pauseButton.disabled = true;
			reloadButton.disabled = true;
			
		}
		
		//Enable button
		interpreteButton.disabled = false;
		
	};
	
	//Get play button and link action
	playButton = document.getElementById(PLAY_BUTTON_ID);
	playButton.onclick = function() {
		
		//Disable button
		playButton.disabled = true;
		skipButton.disabled = true;
		
		//Execute code
		backEnd.runNext();
		
		//Update marked code
		codeDisplay.unmarkContent();
		let nextExe = backEnd.nextRunnable();
		if(nextExe != null) {
			codeDisplay.markContent(nextExe.lineStart, nextExe.lineEnd, nextExe.offsetStart, nextExe.offsetEnd, BG_COLOR_CLASSES[4], null);
			playButton.disabled = false;
			skipButton.disabled = false;
		} else {
			playButton.disabled = true;
			skipButton.disabled = true;
		}
		
	}
	
	//Get play button and link action
	skipButton = document.getElementById(SKIP_BUTTON_ID);
	skipButton.onclick = function() {
		
		//Disable button and enable pause
		skipButton.disabled = true;
		pauseButton.disabled = false;		
		
		//Create execution queue
		executionQueue = setInterval(codeRun, EXECUTION_RATE);
		
	}
	
	//Get play button and link action
	pauseButton = document.getElementById(PAUSE_BUTTON_ID);
	pauseButton.onclick = function() {
		
		//Disable button and enable play & skip
		pauseButton.disabled = true;
		playButton.disabled = false;
		skipButton.disabled = false;
		
		//Disable pause and update others
		pauseButton.disabled = true;
		if(backEnd.nextRunnable() == null) {
			playButton.disabled = true;
			skipButton.disabled = true;
		} else {
			playButton.disabled = false;
			skipButton.disabled = false;
		}
		
		//Stop execution
		clearInterval(executionQueue);
		
	}
	
	reloadButton = document.getElementById(RELOAD_BUTTON_ID);
	reloadButton.onclick = function() {
		
		//Disable button
		reloadButton.disabled = true;
		
		//Reset code status
		backEnd.resetRun();
		
		//Clear previous execution output
		outputTextArea.value = "";
		
		//Stop execution
		prepareCodeRun();
		
	}
	
	//Get tab bar items
	tabError = document.getElementById(TAB_ERROR_ID);
	tabExecution = document.getElementById(TAB_EXECUTION_ID);
	tabCost = document.getElementById(TAB_COST_ID);
	tabDebugContainer = document.getElementById(TAB_DEBUG_CONTAINER_ID);
	tabDebug = document.getElementById(TAB_DEBUG_ID);
	tabTokens = document.getElementById(TAB_TOKENS_ID);
	tabPredParseTree = document.getElementById(TAB_PRED_PARSE_TREE_ID);
	tabParseTree = document.getElementById(TAB_PARSE_TREE_ID);
	tabAstTree = document.getElementById(TAB_AST_TREE_ID);
	
	//Get collapse button and link action
	collapseButton = document.getElementById(COLLAPSE_BUTTON_ID);
	collapseButton.onclick = function() {
		
		//Disable button
		collapseButton.disabled = true;
		
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
		
		//Enable button
		collapseButton.disabled = false;
		
	}
	
	//Get hide button and link action
	hideButton = document.getElementById(HIDE_BUTTON_ID);
	hideButton.onclick = function() {
		
		//Disable button
		hideButton.disabled = true;
		
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
		
		//Enable button
		hideButton.disabled = false;
		
	}
	
	//Link click actions
	tabError.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.ERROR;
		
		//Display errors and hide others
		executionContainer.classList.remove(DISP_FLEX_CLASS);
		executionContainer.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_FLEX_CLASS);
		costContainer.classList.add(DISP_NONE_CLASS);
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
		tabExecution.classList.remove(ACTIVE_CLASS);
		tabCost.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.remove(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide buttons
		treeButtons.classList.add(DISP_NONE_CLASS);
		executionButtons.classList.add(DISP_NONE_CLASS);
		
	}
	tabExecution.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.ERROR;
		
		//Display errors and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_FLEX_CLASS);
		costContainer.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_FLEX_CLASS);
		astTreeContainer.classList.add(DISP_NONE_CLASS);
		executionContainer.classList.remove(DISP_NONE_CLASS);
		executionContainer.classList.add(DISP_FLEX_CLASS);
		
		//Mark error tab
		tabError.classList.remove(ACTIVE_CLASS);
		tabExecution.classList.add(ACTIVE_CLASS);
		tabCost.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.remove(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide tree buttons
		treeButtons.classList.add(DISP_NONE_CLASS);
		
		//Show exec buttons
		executionButtons.classList.remove(DISP_NONE_CLASS);
		
	}
	tabCost.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.ERROR;
		
		//Display errors and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		executionContainer.classList.remove(DISP_FLEX_CLASS);
		executionContainer.classList.add(DISP_NONE_CLASS);
		tokensTextArea.classList.remove(DISP_FLEX_CLASS);
		tokensTextArea.classList.add(DISP_NONE_CLASS);
		predParseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		predParseTreeContainer.classList.add(DISP_NONE_CLASS);
		parseTreeContainer.classList.remove(DISP_FLEX_CLASS);
		parseTreeContainer.classList.add(DISP_NONE_CLASS);
		astTreeContainer.classList.remove(DISP_FLEX_CLASS);
		astTreeContainer.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_NONE_CLASS);
		costContainer.classList.add(DISP_FLEX_CLASS);
		
		//Mark error tab
		tabError.classList.remove(ACTIVE_CLASS);
		tabExecution.classList.remove(ACTIVE_CLASS);
		tabCost.classList.add(ACTIVE_CLASS);
		tabDebug.classList.remove(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide buttons
		treeButtons.classList.add(DISP_NONE_CLASS);
		executionButtons.classList.add(DISP_NONE_CLASS);
		
	}
	tabTokens.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.TOKENS;
		
		//Display tokens and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		executionContainer.classList.remove(DISP_FLEX_CLASS);
		executionContainer.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_FLEX_CLASS);
		costContainer.classList.add(DISP_NONE_CLASS);
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
		tabExecution.classList.remove(ACTIVE_CLASS);
		tabCost.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.add(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide buttons
		treeButtons.classList.add(DISP_NONE_CLASS);
		executionButtons.classList.add(DISP_NONE_CLASS);
		
	}
	tabPredParseTree.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.PREDICTION;
		
		//Display parse tree and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		executionContainer.classList.remove(DISP_FLEX_CLASS);
		executionContainer.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_FLEX_CLASS);
		costContainer.classList.add(DISP_NONE_CLASS);
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
		tabExecution.classList.remove(ACTIVE_CLASS);
		tabCost.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.add(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide exec buttons
		executionButtons.classList.add(DISP_NONE_CLASS);
		
		//Show tree buttons
		treeButtons.classList.remove(DISP_NONE_CLASS);
		
	}
	tabParseTree.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.SINTAX;
		
		//Display parse tree and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		executionContainer.classList.remove(DISP_FLEX_CLASS);
		executionContainer.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_FLEX_CLASS);
		costContainer.classList.add(DISP_NONE_CLASS);
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
		tabExecution.classList.remove(ACTIVE_CLASS);
		tabCost.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.add(ACTIVE_CLASS);
		tabAstTree.classList.remove(ACTIVE_CLASS);
		
		//Hide exec buttons
		executionButtons.classList.add(DISP_NONE_CLASS);
		
		//Show tree buttons
		treeButtons.classList.remove(DISP_NONE_CLASS);
		
	}
	tabAstTree.onclick = function() {
		
		//Update view mode
		viewMode = VIEW_MODE.AST;
		
		//Display ast tree and hide others
		errorTextArea.classList.remove(DISP_FLEX_CLASS);
		errorTextArea.classList.add(DISP_NONE_CLASS);
		executionContainer.classList.remove(DISP_FLEX_CLASS);
		executionContainer.classList.add(DISP_NONE_CLASS);
		costContainer.classList.remove(DISP_FLEX_CLASS);
		costContainer.classList.add(DISP_NONE_CLASS);
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
		tabExecution.classList.remove(ACTIVE_CLASS);
		tabCost.classList.remove(ACTIVE_CLASS);
		tabDebug.classList.add(ACTIVE_CLASS);
		tabTokens.classList.remove(ACTIVE_CLASS);
		tabPredParseTree.classList.remove(ACTIVE_CLASS);
		tabParseTree.classList.remove(ACTIVE_CLASS);
		tabAstTree.classList.add(ACTIVE_CLASS);
		
		//Hide exec buttons
		executionButtons.classList.add(DISP_NONE_CLASS);
		
		//Show tree buttons
		treeButtons.classList.remove(DISP_NONE_CLASS);
		
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
				backEnd = new BackEnd(outputTextArea);
				
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
				executionContainer.classList.remove(DISP_FLEX_CLASS);
				executionContainer.classList.add(DISP_NONE_CLASS);
				costContainer.classList.remove(DISP_FLEX_CLASS);
				costContainer.classList.add(DISP_NONE_CLASS);
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
				tabExecution.classList.remove(ACTIVE_CLASS);
				tabCost.classList.remove(ACTIVE_CLASS);
				tabDebug.classList.remove(ACTIVE_CLASS);
				tabTokens.classList.remove(ACTIVE_CLASS);
				tabPredParseTree.classList.remove(ACTIVE_CLASS);
				tabParseTree.classList.remove(ACTIVE_CLASS);
				tabAstTree.classList.remove(ACTIVE_CLASS);
				
				//Hide buttons
				treeButtons.classList.add(DISP_NONE_CLASS);
				executionButtons.classList.add(DISP_NONE_CLASS);
				
			}
		}
		
	}
	
	//Create execution and cost code display
	codeDisplay = new Display(codeContainer);
	costDisplay = new Display(costTextContainer);
	
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
		let codeItem = createArrowElement(domElement, "CODE");
		createAstTreePath(createSubListElement(codeItem), codeNode);
	}
	
	//Check no funcs
	let funcs = Object.keys(funcNodeList);
	if(funcs.length == 0) {
		return;
	}
	
	//Create function list tree
	let funcListItem = createArrowElement(domElement, "FUNCTIONS");
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
				let actionItem = createArrowElement(domElement, "context");
				let actionSubListItem = createSubListElement(actionItem);
				
				//Create sublist item for every child
				for(let i = 0; i < node.children.length; i++) {
					createAstTreePath(actionSubListItem, node.children[i]);
				}
				
			} else {
				createListElement(domElement, "context");
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
						let codeNode = createArrowElement(loopSubListItem, "loopCode");
						createAstTreePath(createSubListElement(codeNode), node.children[1].children[0]);
					}
					
					break;
					
				case SEMANTICA_KEYS.FUNC_CALL:
					createCallPath(domElement, node, node.ref);
					break;
					
				default:	//Undefined case
					createListElement(domElement, "undefined");
					break;
					
			}
			break;
			
		case AST_NODE.FUNC:
			
			//Create func item
			let funcItem = createArrowElement(domElement, node.funcName + "()");
			let funcSubListItem = createSubListElement(funcItem);
		
			//Create info nodes
			createParamListPath(funcSubListItem, node.children[0]);
			createReturnTypePath(funcSubListItem, node.children[1]);
			if(node.children[2].children.length != 0) {
				let codeNode = createArrowElement(funcSubListItem, "funcCode");
				createAstTreePath(createSubListElement(codeNode), node.children[2].children[0]);
			}
			createReturnDataPath(funcSubListItem, node.children[3]);
			
			break;
			
		default:	//Undefined case
			createListElement(domElement, "undefined");
			break;
			
	}
}

function createConditionPath(domElement, node) {
	
	//Create condition item
	let conditionItem = createArrowElement(domElement, "condition");
	
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
		let caseItem = createArrowElement(domElement, "case " + node.children[i].conditionCase);
		createAstTreePath(createSubListElement(caseItem), node.children[i]);
	}
	
}

function createParamListPath(domElement, node) {
	//Check if has any var
	if(node.children.length == 0) {
		createListElement(domElement, "params");
	} else {
		
		//Create params item
		let paramsItem = createArrowElement(domElement, "params");
		let paramsSubListItem = createSubListElement(paramsItem);
		
		//Create node for every param
		for(let i = 0; i < node.children.length; i++) {
			createListElement(paramsSubListItem, node.children[i].info.content + ": " + node.children[i].info.type);
		}
		
	}
}

function createReturnTypePath(domElement, node) {
	//Check if has any return type
	if(node.children.length == 0) {
		createListElement(domElement, "returnTypes");
	} else {
		
		//Create params item
		let returnItem = createArrowElement(domElement, "returnTypes");
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
		createListElement(domElement, "returnData");
	} else {
		
		//Create return item
		let returnItem = createArrowElement(domElement, "returnData");
		let returnSubListItem = createSubListElement(returnItem);
		
		//Create sublist item for every return expression
		for(let i = 0; i < node.children.length; i++) {
			let expressionItem = createArrowElement(returnSubListItem, "expresion " + i);
			createExpressionPath(createSubListElement(expressionItem), node.children[i]);
		}
		
	}
}

function createVarListPath(domElement, node) {
	
	//Create var list item
	let varListItem = createArrowElement(domElement, "vars");
	let subListItem = createSubListElement(varListItem);
	
	//Create sublist item for every var position
	for(let i = 0; i < node.children.length; i++) {
		
		//Set var position info
		let varPositionItem = createArrowElement(subListItem, "position " + i);
		let varPositionSubListItem = createSubListElement(varPositionItem);
		
		//Create var items
		for(let j = 0; j < node.children[i].children.length; j++) {
			createListElement(varPositionSubListItem, node.children[i].children[j].content + ": " + node.children[i].children[j].type);
		}
		
	}
	
}

function createExpressionListPath(domElement, node) {
	
	//Create expression list item
	let expressionListItem = createArrowElement(domElement, "expressions");
	let subListItem = createSubListElement(expressionListItem);
	
	//Create sublist item for every var position
	for(let i = 0; i < node.children.length; i++) {
		let expressionItem = createArrowElement(subListItem, "expresion " + i);
		createExpressionPath(createSubListElement(expressionItem), node.children[i]);
	}
	
}

function createExpressionPath(domElement, node) {
	//Check node type
	switch(node.type) {
		case AST_NODE.EXPRESSION:
		case AST_NODE.UNARY_EXPRESSION:
			//Check if has any operation assigned
			if(typeof node.operation === "undefined") {
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
			let valueItem = createArrowElement(domElement, "const");
			let valueSubListItem = createSubListElement(valueItem);
			createListElement(valueSubListItem, node.value.content);
			break;
			
		case AST_NODE.ID:
			let varItem = createArrowElement(domElement, "var");
			let varSubListItem = createSubListElement(varItem);
			createListElement(varSubListItem, node.ref.content);
			break;
			
		case AST_NODE.FUNC_EXP:
			createCallPath(domElement, node, node.call.content);
			break;
			
		default:	//Undefined case
			createListElement(domElement, "undefined");
			break;
			
	}
}

function createCallPath(domElement, node, callName) {
	
	//Create call node
	let callBaseItem = createArrowElement(domElement, "funcCall");
	let callBaseSubListItem = createSubListElement(callBaseItem);
	
	//Check if has params
	if(node.children.length == 0) {
		createListElement(callBaseSubListItem, callName + "()");
	} else {
		//Create sublist item for every param
		let callItem = createArrowElement(callBaseSubListItem, callName + "()");
		let callSubListItem = createSubListElement(callItem);
		for(let i = 0; i < node.children.length; i++) {
			let paramItem = createArrowElement(callSubListItem, "param " + i);
			createExpressionPath(createSubListElement(paramItem), node.children[i]);
		}
	}
	
}

function createListElement(domElement, textContent) {
	let listItem = document.createElement(LIST_ITEM);
	listItem.textContent = textContent;
	domElement.appendChild(listItem);
	return listItem;
}

function createArrowElement(domElement, textContent) {
	
	//Create list item
	let listItem = createListElement(domElement, "");
	
	//Create arrow and append to list item
	let arrow = document.createElement(SPAN_ITEM);
	arrow.classList.add(TREE_LIST_ARROW_CLASS);
	arrow.addEventListener("click", function() {
		this.parentElement.querySelector("." + NESTED_TREE_LIST_CLASS).classList.toggle(ACTIVE_TREE_LIST_CLASS);
		this.classList.toggle(TREE_LIST_ARROW_DOWN_CLASS);
	});
	listItem.appendChild(arrow);
	arrow.textContent = textContent;
	
	return listItem;
	
}

function createSubListElement(listItem) {
	let subListItem = document.createElement(SUBLIST_ITEM);
	subListItem.classList.add(NESTED_TREE_LIST_CLASS);
	subListItem.classList.add(TREE_LIST);
	listItem.appendChild(subListItem);
	return subListItem;
}

function prepareCodeRun() {
	
	//Stop execution
	clearInterval(executionQueue);
	
	//Unmark code
	codeDisplay.unmarkContent();
	
	//Mark first execution item
	let firstExe = backEnd.nextRunnable();
	if(firstExe != null) {
		codeDisplay.markContent(firstExe.lineStart, firstExe.lineEnd, firstExe.offsetStart, firstExe.offsetEnd, BG_COLOR_CLASSES[4], null);
		playButton.disabled = false;
		skipButton.disabled = false;
		pauseButton.disabled = true;
		reloadButton.disabled = false;
	} else {
		playButton.disabled = true;
		skipButton.disabled = true;
		pauseButton.disabled = true;
		reloadButton.disabled = true;
	}
	
}

function codeRun() {
	
	//Execute code
	backEnd.runNext();
	
	//Update marked code
	codeDisplay.unmarkContent();
	let nextExe = backEnd.nextRunnable();
	if(nextExe != null) {
		codeDisplay.markContent(nextExe.lineStart, nextExe.lineEnd, nextExe.offsetStart, nextExe.offsetEnd, BG_COLOR_CLASSES[4], null);
	} else {
			
		//Disable all buttons
		playButton.disabled = true;
		skipButton.disabled = true;
		pauseButton.disabled = true;
		reloadButton.disabled = false;
		
		//Stop execution
		clearInterval(executionQueue);
		
	}
	
}
