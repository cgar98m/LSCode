const INPUT_TEXTAREA_ID = "inputTextArea";
const OUTPUT_TEXTAREA_ID = "outputTextArea";
const INTERPRETE_BUTTON_ID = "interpreteButton";

const LANG_PATH = "src/";
const JSON_TRAIL = ".json";

const LEXIC_ID = "lexic";

var inputTextArea;
var outputTextArea;
var interpreteButton;

var lang;
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

		//Scan input
		lexer.scan(inputTextArea.value);
		
		//Display parsed tokens
		outputTextArea.value = "";
		for(let i = 0; i < lexer.tokens.length; i++) {
			outputTextArea.value += (lexer.tokens[i].id + ": " + lexer.tokens[i].content + "\n");
		}
		
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
				
				//Pre-build regex
				for(let i = 0; i < data[LEXIC_ID].length; i++) {
					data[LEXIC_ID][i].builtRegex = new RegExp(data[LEXIC_ID][i].regex, 'i');
				}
				
				//Create lexer
				lexer = new Lexer(null, data[LEXIC_ID]);
				
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
