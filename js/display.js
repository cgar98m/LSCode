const LINE_BREAK = "\n";

const BLANKSPACE_REGEXP = / /g;
const BLANKSPACE_HTML = "&nbsp";

class Display {

	constructor(displayContainer) {
		
		//Get view elements
		this.displayContainer = displayContainer;
		
		//Reset view
		this.clear();
		
	}
	
	clear() {
		this.content = [];
		while(this.displayContainer.lastElementChild) {
			this.displayContainer.removeChild(this.displayContainer.lastElementChild);
		}
	}
	
	setContent(content) {
		
		//Clear content
		this.clear();
		
		//Split content in lines
		let lines = content.split(LINE_BREAK);
		
		//Process every line
		for(let i = 0; i < lines.length; i++) {
			
			//Create span for every line
			let spanItem = document.createElement(SPAN_ITEM);
			spanItem.appendChild(this.#createSpan(lines[i], null));
			this.content.push({
				src: lines[i],
				html: spanItem
			});
			
			//Append span to view
			this.displayContainer.appendChild(spanItem);
			
			//Append line jump if required
			if(i < lines.length - 1) {
				this.displayContainer.appendChild(document.createElement(BR_ITEM));
			}
			
		}
		
	}
	
	markContent(lineStart, lineEnd, offsetStart, offsetEnd, colorClass, tipContent) {
		for(let i = 0; i < this.content.length; i++) {
			//Check line
			if(i >= lineStart && i <= lineEnd) {
				
				//Remove line content
				this.#removeContentLine(this.content[i]);
				
				//Check offset
				let contentSrc = this.content[i].src;
				if(i == lineStart && i == lineEnd) {
					this.content[i].html.appendChild(this.#createSpan(contentSrc.substring(0, offsetStart), null));
					this.content[i].html.appendChild(this.#createTooltip(contentSrc.substring(offsetStart, offsetEnd + 1), colorClass, tipContent));
					this.content[i].html.appendChild(this.#createSpan(contentSrc.substring(offsetEnd + 1, contentSrc.length), null));
				} else if(i == lineStart && i != lineEnd) {
					this.content[i].html.appendChild(this.#createSpan(contentSrc.substring(0, offsetStart), null));
					this.content[i].html.appendChild(this.#createTooltip(contentSrc.substring(offsetStart, contentSrc.length), colorClass, tipContent));
				} else if(i != lineStart && i == lineEnd) {
					this.content[i].html.appendChild(this.#createTooltip(contentSrc.substring(0, offsetEnd + 1), colorClass, tipContent));
					this.content[i].html.appendChild(this.#createSpan(contentSrc.substring(offsetEnd + 1, contentSrc.length), null));
				} else {
					this.content[i].html.appendChild(this.#createTooltip(contentSrc.substring(0, contentSrc.length), colorClass, tipContent));
				}
				
			}
		}
	}
	
	unmarkContent() {
		for(let i = 0; i < this.content.length; i++) {
			this.#removeContentLine(this.content[i]);
			this.content[i].html.appendChild(this.#createSpan(this.content[i].src, null));
		}
	}
	
	#removeContentLine(line) {
		while(line.html.lastElementChild) {
			line.html.removeChild(line.html.lastElementChild);
		}
	}
	
	#createTooltip(anchorContent, colorClass, tipContent) {
		
		//Create tooltip
		let tooltip = this.#createDiv([TOOLTIP_CLASS, colorClass]);
		tooltip.innerHTML = anchorContent.replace(BLANKSPACE_REGEXP, BLANKSPACE_HTML);
		
		//Append tip if exists
		if(tipContent != null && tipContent.length > 0) {
			tooltip.appendChild(this.#createSpan(tipContent, TOOLTIP_TEXT_CLASS));
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
	
	#createSpan(content, className) {
		
		//Create span
		let spanItem = document.createElement(SPAN_ITEM);
		
		//Set info
		spanItem.innerHTML = content.replace(BLANKSPACE_REGEXP, BLANKSPACE_HTML);
		if(className != null) {
			spanItem.classList.add(className);
		}
		
		return spanItem;
		
	}
	
}
