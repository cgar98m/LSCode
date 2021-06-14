function loadFile(filePath) {
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
alert("--- File content ---");
alert(file);

var data = JSON.parse(file);
alert("--- Json content ---");
alert(data);