class WindowView {

	constructor(parentTab, tab, container, btnGrp) {
		this.parentTab = parentTab;
		this.tab = tab;
		this.container = container;
		this.btnGrp = btnGrp;
	}
	
	show() {
		
		//Mark parent tab if exists
		if(this.parentTab != null) {
			this.parentTab.classList.add(ACTIVE_CLASS);
		}
		
		//Mark tab
		this.tab.classList.add(ACTIVE_CLASS);
		
		//Show container
		this.container.classList.remove(DISP_NONE_CLASS);
		this.container.classList.add(DISP_FLEX_CLASS);
		
		//Show button group if exists
		if(this.btnGrp != null) {
			this.btnGrp.classList.remove(DISP_NONE_CLASS);
		}
		
	}
	
	hide() {
		
		//Unmark parent tab if exists
		if(this.parentTab != null) {
			this.parentTab.classList.remove(ACTIVE_CLASS);
		}
		
		//Unmark tab
		this.tab.classList.remove(ACTIVE_CLASS);
		
		//Hide container
		this.container.classList.remove(DISP_FLEX_CLASS);
		this.container.classList.add(DISP_NONE_CLASS);
		
		//Hide button group if exists
		if(this.btnGrp != null) {
			this.btnGrp.classList.add(DISP_NONE_CLASS);
		}
		
	}

}
