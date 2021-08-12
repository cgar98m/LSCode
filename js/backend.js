class BackEnd {

	constructor(console) {
		
		//Create interpreter
		this.interpreter = new Interpreter(console);
		
		//Create cost analyzer
		//TODO
		
	}
	
	updateInfo(astTree, astFunc, astSys) {
		this.interpreter.setCode(astTree, astFunc, astSys);
		//TODO
	}
	
	nextRunnable() {
		return this.interpreter.runnableCode();
	}
	
	runNext() {
		this.interpreter.runNext();
	}
	
	resetRun() {
		this.interpreter.resetStatus();
	}

}
