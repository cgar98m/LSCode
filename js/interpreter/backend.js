class BackEnd {

	constructor(interpreteConsole, costDisplay, costConsole) {
		
		//Create interpreter
		this.interpreter = new Interpreter(interpreteConsole);
		
		//Create cost analyzer
		//this.costAnalyzer = new Cost(costDisplay, costConsole);
		
	}
	
	updateCodeRun(astTree, astFunc, astSys) {
		this.interpreter.setCode(astTree, astFunc, astSys);
	}
	
	updateCost(astTree, astFunc, astSys) {
		//this.costAnalyzer.setCode(astTree, astFunc, astSys);
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
