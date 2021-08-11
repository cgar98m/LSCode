const TOOLTIP_CLASS = "tooltipCustom";
const TOOLTIP_TEXT_CLASS = "tooltipCustomText";

class Console {

	constructor(codeContainer) {
		
		//Get view elements
		this.codeContainer = codeContainer;
		
		//Reset view and data
		this.clear();
		
	}
	
	clear() {
		this.code = [];
		while(this.codeContainer.lastElementChild) {
			this.codeContainer.removeChild(this.codeContainer.lastElementChild);
		}
	}
	
	setCode(code) {
		
		//Clear code content
		this.clear();
		
		//Split code in lines
		let lines = code.split("\n");
		
		//Process every line
		for(let i = 0; i < lines.length; i++) {
			
			//Create <span> for every line
			let lineSpan = document.createElement(SPAN_ITEM);
			lineSpan.appendChild(this.#createSpan(lines[i], null));
			this.code.push({
				original: lines[i],
				html: lineSpan
			});
			
			//Append to code view
			this.codeContainer.appendChild(lineSpan);
			
			//Append <br>
			this.codeContainer.appendChild(document.createElement(BR_ITEM));
			
		}
		
	}
	
	markCode(lineStart, lineEnd, offsetStart, offsetEnd, color, tip) {
		for(let i = 0; i < this.code.length; i++) {
			
			//Unmark line
			this.#unmarkCodeLine(this.code[i]);
			
			//Check line
			if(i >= lineStart && i <= lineEnd) {
				
				//Unmark line
				this.#removeCodeLine(this.code[i]);
				
				//Check offset
				let msg = this.code[i].original;
				if(i == lineStart && i == lineEnd) {
					this.code[i].html.appendChild(this.#createSpan(msg.substring(0, offsetStart), null));
					this.code[i].html.appendChild(this.#createTooltip(msg.substring(offsetStart, offsetEnd + 1), color, tip));
					this.code[i].html.appendChild(this.#createSpan(msg.substring(offsetEnd + 1, msg.length), null));
				} else if(i == lineStart && i != lineEnd) {
					this.code[i].html.appendChild(this.#createSpan(msg.substring(0, offsetStart), null));
					this.code[i].html.appendChild(this.#createTooltip(msg.substring(offsetStart, msg.length), color, tip));
				} else if(i != lineStart && i == lineEnd) {
					this.code[i].html.appendChild(this.#createTooltip(msg.substring(0, offsetEnd + 1), color, tip));
					this.code[i].html.appendChild(this.#createSpan(msg.substring(offsetEnd + 1, msg.length), null));
				} else {
					this.code[i].html.appendChild(this.#createTooltip(msg.substring(0, msg.length), color, tip));
				}
				
			}
			
		}
	}
	
	unmarkCode() {
		for(let i = 0; i < this.code.length; i++) {
			this.#unmarkCodeLine(this.code[i]);
		}
	}
	
	#unmarkCodeLine(line) {
		this.#removeCodeLine(line);
		line.html.appendChild(this.#createSpan(line.original, null));
	}
	
	#removeCodeLine(line) {
		while(line.html.lastElementChild) {
			line.html.removeChild(line.html.lastElementChild);
		}
	}
	
	#createTooltip(msg, color, tip) {
		
		//Create tooltip
		let tooltip = this.#createDiv([TOOLTIP_CLASS, color]);
		tooltip.textContent = msg;
		
		//Append tip
		if(tip.length > 0) {
			tooltip.appendChild(this.#createSpan(tip, TOOLTIP_TEXT_CLASS));
		}
		
		return tooltip;
		
	}
	
	#createDiv(classNames) {
		
		//Create div
		let divItem = document.createElement(DIV_ITEM);
		
		//Set info
		for(let i = 0; i < classNames.length; i++) {
			divItem.classList.add(classNames[i]);
		}
		
		return divItem;
		
	}
	
	#createSpan(msg, className) {
		
		//Create span
		let spanItem = document.createElement(SPAN_ITEM);
		
		//Set info
		spanItem.textContent = msg;
		if(className != null) {
			spanItem.classList.add(className);
		}
		
		return spanItem;
		
	}
	
	#createMark(msg, color, className) {
		
		//Create mark
		let markItem = document.createElement(MARK_ITEM);
		
		//Set info
		markItem.textContent = msg;
		if(className != null) {
			markItem.classList.add(className);
		}
		
		return markItem;
		
	}
	
	#createPreformattedText(msg) {
		let preItem = document.createElement(PRE_ITEM);
		preItem.textContent = msg;
		preItem.classList.add(PAD_NONE_CLASS);
		preItem.classList.add(MARGIN_NONE_CLASS);
		return preItem;
	}
	
}
