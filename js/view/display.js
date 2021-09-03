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
			spanItem.appendChild(this.createSpan(lines[i], null));
			this.content.push({
				src: lines[i],
				html: spanItem,
				mark: null
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
		
		//Mark line
		for(let i = lineStart; i <= lineEnd; i++) {
			if(i == lineStart && i == lineEnd) {
				this.appendMark({
					start: offsetStart,
					end: offsetEnd,
					color: colorClass,
					tip: tipContent
				}, this.content[i]);
			} else if(i == lineStart && i != lineEnd) {
				this.appendMark({
					start: offsetStart,
					end: this.content[i].src.length,
					color: colorClass,
					tip: tipContent
				}, this.content[i]);
			} else if(i != lineStart && i == lineEnd) {
				this.appendMark({
					start: 0,
					end: offsetEnd,
					color: colorClass,
					tip: tipContent
				}, this.content[i]);
			} else {
				this.appendMark({
					start: 0,
					end: this.content[i].src.length,
					color: colorClass,
					tip: tipContent
				}, this.content[i]);
			}
		}
		
		//Update display content
		for(let i = 0; i < this.content.length; i++) {
				
			//Remove line content
			this.removeContentLine(this.content[i]);
			
			//Check if has any mark
			if(this.content[i].mark == null) {
				this.content[i].html.appendChild(this.createSpan(this.content[i].src, null));
			} else {
				this.createPreMark(this.content[i].src, this.content[i].html, this.content[i].mark);
			}
			
		}
		
	}
	
	createPreMark(src, html, mark) {
		
		//Append unmarked text before tooltip
		html.appendChild(this.createSpan(src.substring(0, mark.start), null));
		
		//Append marked text (tooltip)
		let lastEnd = this.createMark(src, html, mark, null);
		
		//Append unmarked text after tooltip
		html.appendChild(this.createSpan(src.substring(lastEnd + 1, src.length), null));
		
	}
	
	createMark(src, html, mark, coreMark) {
		
		//Check if has any sub-tooltip
		if(mark.next != null) {
			
			//Check if exists tooltip before sub-tooltip
			if(mark.start < mark.next.start) {
				if(mark.end < mark.next.start) {
					html.appendChild(this.createTooltip(src.substring(mark.start, mark.end + 1), mark.color, mark.tip));
					if(mark.end + 1 < mark.next.start) {
						if(coreMark == null) {
							html.appendChild(this.createSpan(src.substring(mark.end + 1, mark.next.start), null));
						} else {
							html.appendChild(this.createTooltip(src.substring(mark.end + 1, mark.next.start), coreMark.color, coreMark.tip));
						}
					}
				} else {
					html.appendChild(this.createTooltip(src.substring(mark.start, mark.next.start), mark.color, mark.tip));
				}
			}
			
			//Create sub-tooltip
			let lastEnd = this.createMark(src, html, mark.next, coreMark == null ? mark : coreMark);
			
			//Check if exists tooltip after sub-tooltip
			if(mark.end > lastEnd) {
				html.appendChild(this.createTooltip(src.substring(lastEnd + 1, mark.end + 1), mark.color, mark.tip));
			} else {
				return lastEnd;
			}
			
		} else {
			html.appendChild(this.createTooltip(src.substring(mark.start, mark.end + 1), mark.color, mark.tip));
		}
		
		return mark.end;
		
	}
	
	appendMark(mark, lineContent) {
		mark.next = null;
		if(lineContent.mark == null) {
			lineContent.mark = mark;
		} else {
			this.recAppendMark(mark, lineContent.mark);
		}
	}
	
	recAppendMark(newMark, mark) {
		if(mark.next == null) {
			mark.next = newMark;
		} else {
			this.recAppendMark(newMark, mark.next);
		}
	}
	
	unmarkContent() {
		for(let i = 0; i < this.content.length; i++) {
			this.removeContentLine(this.content[i]);
			this.content[i].mark = null;
			this.content[i].html.appendChild(this.createSpan(this.content[i].src, null));
		}
	}
	
	removeContentLine(line) {
		while(line.html.lastElementChild) {
			line.html.removeChild(line.html.lastElementChild);
		}
	}
	
	createTooltip(anchorContent, colorClass, tipContent) {
		
		//Create tooltip
		let tooltip = this.createDiv([TOOLTIP_CUST_CLASS, colorClass]);
		tooltip.innerHTML = anchorContent.replace(BLANKSPACE_REGEXP, BLANKSPACE_HTML);
		
		//Append tip if exists
		if(tipContent != null && tipContent.length > 0) {
			tooltip.appendChild(this.createSpan(tipContent, TOOLTIP_CUST_TXT_CLASS));
		}
		
		return tooltip;
		
	}
	
	createDiv(classNames) {
		
		//Create div
		let divItem = document.createElement(DIV_ITEM);
		
		//Set info
		for(let i = 0; i < classNames.length; i++) {
			divItem.classList.add(classNames[i]);
		}
		
		return divItem;
		
	}
	
	createSpan(content, className) {
		
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
