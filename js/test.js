/*function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}

var file = loadFile("src/cat.json");
console.log("--- File content ---");
console.log(file);

var modFile = file.replace("/\\/g", "\\\\");
var data = JSON.parse(modFile);
console.log("--- Json content ---");
console.log(data);

//Pre-build of regex
for(let i = 0; i < data['lexic'].length; i++) {
    data['lexic'][i].builtRegex = new RegExp(data['lexic'][i].regex, 'i');
}

//Create lexer
var txt = "tooLong*2*_23";
txt = "Hola\ncaracter\n   98   \n//_patata*22d\n/*comentari\nmultilinia\nmoar";
l = new Lexer(null, data['lexic']);
l.scan(txt);

let outTextArea = document.getElementById("outputText");
outTextArea.textContent = l.tokens;
*/
