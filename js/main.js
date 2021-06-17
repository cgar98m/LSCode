const INPUT_TEXTAREA_ID = "inputTextArea";
const OUTPUT_TEXTAREA_ID = "outputTextArea";
const INTERPRETE_BUTTON_ID = "interpreteButton";

const LANG_PATH = "src/";
const JSON_TRAIL = ".json";

var inputTextArea;
var outputTextArea;
var interpreteButton;

var lang;

var frontEnd;
var lexer;

//Main
window.onload = function() {
	
	//Get text areas
	inputTextArea = document.getElementById(INPUT_TEXTAREA_ID);
	outputTextArea = document.getElementById(OUTPUT_TEXTAREA_ID);
	
	//Get interprete button, disable and link action
	interpreteButton = document.getElementById(INTERPRETE_BUTTON_ID);
	interpreteButton.disabled = true;
	interpreteButton.onclick = function() {

		//Disable button
		interpreteButton.disabled = true;

		//Scan input
		frontEnd.process(inputTextArea.value);
		
		//TODO: Replace outputTextArea.value for interprete results
		//Display parsed tokens
		outputTextArea.value = "";
		for(let i = 0; i < frontEnd.lexer.tokens.length; i++) {
			outputTextArea.value += (frontEnd.lexer.tokens[i].token_id + ": " + frontEnd.lexer.tokens[i].content + "\n");
		}
		//ENDTODO
		
		//Enable button
		interpreteButton.disabled = false;
		
	};
	
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
