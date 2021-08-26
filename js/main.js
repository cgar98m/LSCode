const LANG_CAT = "cat";

const LANG_PATH = "lang/";
const JSON_EXT = ".json";

const EXECUTION_RATE = 500;

//Code window
var codeInTextArea;
var codeInErrorTextArea;
var codeInterpreteButton;

//Execution window
var executionTab;
var executionWindow;
var executionContainer;
var executionConsoleTextArea;
var executionBtnGrp;
var playButton;
var skipButton;
var pauseButton;
var replayButton;

//Cost window
var costTab;
var costWindow;
var costCodeContainer;
var costConsoleTextArea;

//Debug tab components
var debugTabContainer;
var debugTab;

//Tokens window
var tokensTab;
var tokensWindow;
var tokensTextArea;

//Prediction window
var predictionTab;
var predictionWindow;
var predictionRootList;
var predictionBtnGrp;
var predictionExpandBtn;
var predictionCollapseBtn;

//Parse window
var parseTab;
var parseWindow;
var parseRootList;
var parseBtnGrp;
var parseExpandBtn;
var parseCollapseBtn;

//AST window
var astTab;
var astWindow;
var astRootList;
var astBtnGrp;
var astExpandBtn;
var astCollapseBtn;

//Displays
var executionDisplay;
var costDisplay;

//Consoles
var codeInConsole;
var executionConsole;
var tokensConsole;
var costConsole;

//Interprete
var lang;
var errorHandler;
var frontEnd;
var backEnd;

//Code auto run auxiliar
var executionQueue;

//Debug mode toggler
var debugMode;

//Main
window.onload = function() {
	
	//Disable auto run by default
	executionQueue = null;
	
	//Link all DOM elements
	linkDOM();
	
	//Prepare windows
	linkWindows();
	
	//Prepare displays and consoles
	linkDisplays();
	linkConsoles();
	
	//Prepare buttons
	linkButtons();
	
	//Prepare interpreter
	linkInterpreter();
	
}

function linkDOM() {

	//Link code input items
	codeInTextArea = document.getElementById(CODE_INPUT_TEXTAREA_ID);
	codeInErrorTextArea = document.getElementById(CODE_INPUT_ERROR_TEXTAREA_ID);
	codeInterpreteButton = document.getElementById(CODE_INTERPRETE_BUTTON_ID);

	//Link execution items
	executionTab = document.getElementById(TAB_EXECUTION_ID);
	executionWindow = document.getElementById(EXECUTION_WINDOW_ID);
	executionContainer = document.getElementById(EXECUTION_CODE_CONTAINER_ID);
	executionConsoleTextArea = document.getElementById(EXECUTION_CONSOLE_TEXTAREA_ID);
	executionBtnGrp = document.getElementById(EXECUTION_BUTTON_GROUP_ID);
	playButton = document.getElementById(PLAY_BUTTON_ID);
	skipButton = document.getElementById(SKIP_BUTTON_ID);
	pauseButton = document.getElementById(PAUSE_BUTTON_ID);
	replayButton = document.getElementById(REPLAY_BUTTON_ID);

	//Link cost items
	costTab = document.getElementById(TAB_COST_ID);
	costWindow = document.getElementById(COST_WINDOW_ID);
	costCodeContainer = document.getElementById(COST_CODE_CONTAINER_ID);
	costConsoleTextArea = document.getElementById(COST_CONSOLE_TEXTAREA_ID);

	//Link debug tab items
	debugTabContainer = document.getElementById(TAB_DEBUG_CONTAINER_ID);
	debugTab = document.getElementById(TAB_DEBUG_ID);

	//Link token items
	tokensTab = document.getElementById(TAB_TOKENS_ID);
	tokensWindow = document.getElementById(TOKENS_WINDOW_ID);
	tokensTextArea = document.getElementById(TOKENS_CONSOLE_TEXTAREA_ID);

	//Link prediction items
	predictionTab = document.getElementById(TAB_PREDICTION_ID);
	predictionWindow = document.getElementById(PREDICTION_WINDOW_ID);
	predictionRootList = document.getElementById(PREDICTION_ROOT_LIST_ID);
	predictionBtnGrp = document.getElementById(PREDICTION_BTN_GRP_ID);
	predictionExpandBtn = document.getElementById(PREDICTION_EXPAND_BTN_ID);
	predictionCollapseBtn = document.getElementById(PREDICTION_COLLAPSE_BTN_ID);

	//Link parse items
	parseTab = document.getElementById(TAB_PARSE_ID);
	parseWindow = document.getElementById(PARSE_WINDOW_ID);
	parseRootList = document.getElementById(PARSE_ROOT_LIST_ID);
	parseBtnGrp = document.getElementById(PARSE_BTN_GRP_ID);
	parseExpandBtn = document.getElementById(PARSE_EXPAND_BTN_ID);
	parseCollapseBtn = document.getElementById(PARSE_COLLAPSE_BTN_ID);

	//Link AST items
	astTab = document.getElementById(TAB_AST_ID);
	astWindow = document.getElementById(AST_WINDOW_ID);
	astRootList = document.getElementById(AST_ROOT_LIST_ID);
	astBtnGrp = document.getElementById(AST_BTN_GRP_ID);
	astExpandBtn = document.getElementById(AST_EXPAND_BTN_ID);
	astCollapseBtn = document.getElementById(AST_COLLAPSE_BTN_ID);

}

function linkWindows() {

	let windows = [];
	
	//Link execution window
	windows.push(new WindowView(null, executionTab, executionWindow, executionBtnGrp));
	
	//Link cost window
	windows.push(new WindowView(null, costTab, costWindow, null));
	
	//Link token window
	windows.push(new WindowView(debugTab, tokensTab, tokensWindow, null));
	
	//Link prediction window
	windows.push(new WindowView(debugTab, predictionTab, predictionWindow, predictionBtnGrp));
	
	//Link parse window
	windows.push(new WindowView(debugTab, parseTab, parseWindow, parseBtnGrp));
	
	//Link AST window
	windows.push(new WindowView(debugTab, astTab, astWindow, astBtnGrp));
	
	//Link tab actions
	for(let i = 0; i < windows.length; i++) {
		windows[i].tab.onclick = tabAction(windows, i);
	}
	
	//Link debug action
	debugMode = debugAction(windows);

}

function linkDisplays() {
	executionDisplay = new Display(executionContainer);
	costDisplay = new Display(costCodeContainer);
}

function linkConsoles() {
	codeInConsole = new Console(codeInErrorTextArea);
	executionConsole = new Console(executionConsoleTextArea);
	costConsole = new Console(costConsoleTextArea);
	tokensConsole = new Console(tokensTextArea);
}

function linkButtons() {

	//Link interprete action
	codeInterpreteButton.onclick = function() {

		//Disable button
		codeInterpreteButton.disabled = true;

		//Reset view (interpretation related view)
		clearPreviousRequest();

		//Scan input
		frontEnd.process(codeInTextArea.value);
		
		//Check empty code
		let tokens = frontEnd.tokens();
		if(tokens.length == 0) {
			codeInConsole.displayMsg(ERROR_NO_CODE, false);
		} else {
		
			//Display parsed tokens
			for(let i = 0; i < tokens.length; i++) {
				tokensConsole.displayMsg(MSG_TOKEN.format(tokens[i].token_id, tokens[i].content), false);
			}
			
			//Display prediction and parse tree
			createParsePaths(predictionRootList, frontEnd.predTree());
			createParsePaths(parseRootList, frontEnd.parseTree());
			
			//Create AST tree
			let astTree = frontEnd.astTree();
			let funcAstTree = frontEnd.funcAstTree();
			let sysAstTree = frontEnd.sysAstTree();
			createAstTree(astRootList, astTree, funcAstTree);
			
			//Display errors
			for(let i = 0; i < errorHandler.errors.length; i++) {
				let error = errorHandler.errors[i];
				codeInConsole.displayMsg(ERROR_GENERIC.format(error.type, error.msg));
			}
			
			//Check if any critical error was found
			if(errorHandler.criticalErrors == 0) {
				
				//Notify users
				codeInConsole.displayMsg(MSG_NO_CRIT_ERR, false);
				
				//Check if code can be run
				if(astTree != null) {
					backEnd.updateCodeRun(astTree, funcAstTree, sysAstTree);
					executionDisplay.setContent(codeInTextArea.value);
					prepareCodeRun();
				}
				
				//Check if code can be cost analyzed
				if(astTree != null || funcAstTree != null) {
					costDisplay.setContent(codeInTextArea.value);
					//backEnd.updateCost(astTree, funcAstTree, sysAstTree);
				}
				
			}
		
		}
		
		//Enable button
		codeInterpreteButton.disabled = false;
		
	};
	
	//Link play action
	playButton.onclick = function() {
		if(codeRun()) {
			playButton.disabled = false;
			skipButton.disabled = false;
		}
	}
	
	//Link skip action
	skipButton.onclick = function() {
		
		//Disable any run mode and enable pause
		playButton.disabled = true;
		skipButton.disabled = true;
		pauseButton.disabled = false;		
		
		//Create execution queue
		executionQueue = setInterval(codeRun, EXECUTION_RATE);
		
	}
	
	//Link pause action
	pauseButton.onclick = function() {
		
		//Disable pause and enable any play mode
		pauseButton.disabled = true;
		playButton.disabled = false;
		skipButton.disabled = false;
		
		//Stop execution
		clearInterval(executionQueue);
		
		//Check if is there any runnable code
		if(backEnd.nextRunnable() == null) {
			playButton.disabled = true;
			skipButton.disabled = true;
		}
		
	}
	
	//Link replay action
	replayButton.onclick = function() {
		
		//Disable button
		replayButton.disabled = true;
		
		//Reset execution status
		backEnd.resetRun();
		
		//Prepare run
		prepareCodeRun();
		
	}
	
	//Link expand tree buttons
	predictionExpandBtn.onclick = expandButtonAction(predictionExpandBtn, predictionWindow);
	parseExpandBtn.onclick = expandButtonAction(parseExpandBtn, parseWindow);
	astExpandBtn.onclick = expandButtonAction(astExpandBtn, astWindow);
	
	//Link collapse tree buttons
	predictionCollapseBtn.onclick = collapseButtonAction(predictionCollapseBtn, predictionWindow);
	parseCollapseBtn.onclick = collapseButtonAction(parseCollapseBtn, parseWindow);
	astCollapseBtn.onclick = collapseButtonAction(astCollapseBtn, astWindow);

}

function linkInterpreter() {
	
	//Set default language (dynamic in the future)
	lang = LANG_CAT;
	
	//Prepare interpreter ruleset request
	let xhr = new XMLHttpRequest();
	xhr.open(GET_PROTOCOL, LANG_PATH + lang + JSON_EXT, true);
	xhr.onload = function(error) {
		//Check status
		if(xhr.readyState === 4) {
			if(xhr.status === 200) {
				
				//Get file data
				let data = JSON.parse(xhr.responseText.replace(BACK_SLASH_REGEXP, BACK_SLASH + BACK_SLASH));
				
				//Create error handler
				errorHandler = new ErrorHandler();
				
				//Create interpreter components
				frontEnd = new FrontEnd(data, errorHandler);
				backEnd = new BackEnd(executionConsole/*, costDisplay, costConsole*/);
				
				//Enable button
				codeInterpreteButton.disabled = false;
				
			} else {
				console.log(xhr.statusText);
				alert(ERROR_LANG);
			}
		}
	}
	xhr.onerror = function(error) {
		console.log(xhr.statusText);
		alert(ERROR_LANG);
	}
	
	//Send request
	xhr.send();
	
}

function clearPreviousRequest() {
	
	//Disable execution buttons
	playButton.disabled = true;
	skipButton.disabled = true;
	pauseButton.disabled = true;
	replayButton.disabled = true;
	
	//Disable code auto run
	clearInterval(executionQueue);
	
	//Clear consoles
	codeInConsole.clear();
	executionConsole.clear();
	tokensConsole.clear();
	costConsole.clear();
	
	//Clear displays
	executionDisplay.clear();
	costDisplay.clear();
	
	//Clear previous trees
	clearTree(predictionRootList);
	clearTree(parseRootList);
	clearTree(astRootList);
	
	//Clear previous errors
	errorHandler.clear();
	
}

function prepareCodeRun() {
	
	//Stop execution
	clearInterval(executionQueue);
	
	//Unmark code
	executionDisplay.unmarkContent();
	
	//Mark first execution item
	let firstExe = backEnd.nextRunnable();
	if(firstExe != null) {
		executionDisplay.markContent(firstExe.lineStart, firstExe.lineEnd, firstExe.offsetStart, firstExe.offsetEnd, BG_COLOR_CLASSES[4], null);
		playButton.disabled = false;
		skipButton.disabled = false;
		pauseButton.disabled = true;
		replayButton.disabled = false;
	} else {
		playButton.disabled = true;
		skipButton.disabled = true;
		pauseButton.disabled = true;
		replayButton.disabled = true;
	}
	
}

function codeRun() {
	
	//Disable any run mode and enable pause
	playButton.disabled = true;
	skipButton.disabled = true;
	pauseButton.disabled = false;
	
	//Execute code
	backEnd.runNext();
	
	//Update marked code
	executionDisplay.unmarkContent();
	let nextExe = backEnd.nextRunnable();
	if(nextExe != null) {
		executionDisplay.markContent(nextExe.lineStart, nextExe.lineEnd, nextExe.offsetStart, nextExe.offsetEnd, BG_COLOR_CLASSES[4], null);
		return true;
	} else {
			
		//Disable pause button
		pauseButton.disabled = true;
		
		//Stop execution
		clearInterval(executionQueue);
		return false;
		
	}
	
}

function tabAction(windows, tabIdx) {
	return function() {
		
		//Hide all
		for(let i = 0; i < windows.length; i++) {
			windows[i].hide();
		}
		
		//Display selected tab
		windows[tabIdx].show();
		
	}
}

function debugAction(windows) {
	return function() {
		
		//Get execution tab window index
		let executionTabIdx = null;
		for(let i = 0; i < windows.length; i++) {
			if(windows[i].tab == executionTab) {
				executionTabIdx = i;
				break;
			}
		}
		
		//Check valid index
		if(executionTabIdx == null) {
			return;
		}
		
		//Select execution tab
		tabAction(windows, executionTabIdx)();
		
		//Toggle debug tab status
		debugTabContainer.classList.toggle(DISP_NONE_CLASS);
	
	}
}
