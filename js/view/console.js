class Console {

	constructor(console) {
		this.console = console;
		this.clear();
	}

	clear() {
		this.console.value = EMPTY;
	}

	displayMsg(msg, scollUpdate) {
		
		//Set message
		if(this.console.value.length > 0) {
			this.console.value += LINE_BREAK;
		}
		this.console.value += msg;
		
		//Update scroll position if desired
		if(scollUpdate) {
			this.console.scrollTop = this.console.scrollHeight;
		}
		
	}

}
