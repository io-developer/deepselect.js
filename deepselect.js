/**
 * Configurable deep selects
 * Not requires jQuery or other libs
 * @author Sergey Sedyshev
 * @repo https://github.com/io-developer/deepselect.js 
 * @see find more on github https://github.com/io-developer
 */
 
var deepselect = function( options ) {
	return deepselect.create(options);
};

deepselect.events = {
	"select": "deepselectSelect"
	, "selectStart": "deepselectStart"
	, "selectComplete": "deepselectSelectComplete"
};

deepselect.cssClasses = {
	"main": "deepselect"
	, "node": "deepselect-node"
	, "nodeContainer": "deepselect-node-container"
	, "nodeOption": "deepselect-node-option"
};

deepselect.create = function( options ) {

	var dataProvider = options.dataProvider || new deepselect.DataProvider(options.data);
	
	var cssClasses = [];
	var userCssClasses = options.cssClasses || [];
	for (var k in deepselect.cssClasses) {
		cssClasses[k] = userCssClasses[k] || deepselect.cssClasses[k];
	}
	
	var root = document.createElement("div");
	root.className = cssClasses["main"];
	
	var renderer = new deepselect.Renderer(root, cssClasses, options.enableLabels, options.label, options.labelSelectable, options.labelValue);
	var controller = new deepselect.Controller(dataProvider, root, renderer);
	
	root.isCompleted = controller.isCompleted;
	root.currentIndexes = controller.currentIndexes;
	root.currentValues = controller.currentValues;
	
	root.controller = function() {
		return controller;
	};
	
	root.onSelect = function( listener ) {
		root.addEventListener(deepselect.events["select"], listener.bind(root));
	};
	
	root.onSelectStart = function( listener ) {
		root.addEventListener(deepselect.events["selectStart"], listener.bind(root));
	};
	
	root.onSelectComplete = function( listener ) {
		root.addEventListener(deepselect.events["selectComplete"], listener.bind(root));
	};
	
	return root;
};

deepselect.Controller = function( dataProvider, dispatcher, renderer ) {
	var that = this;
	
	var isIE = window.navigator.userAgent.indexOf('MSIE ') > -1;
	var completed = false;
	var selectStarted = false;
	var currentIndexes = [];
	var currentItems = [];
	var currentValues = [];
	var selectCounter = 0;
	
	that.isCompleted = function() {
		return completed;
	};
	
	that.getRenderer = function() {
		return renderer;
	};
	
	that.getDataProvider = function() {
		return dataProvider;
	};
	
	that.currentIndexes = function( indexes ) {
		if (indexes) {
			that.selectByIndexes( indexes );
		}
		updateCurrents();
		return currentIndexes.concat();
	};
	
	that.currentValues = function( values ) {
		if (values) {
			that.selectByValues( values );
		}
		updateCurrents();
		return currentValues.concat();
	};
	
	that.selectByIndexes = function( indexes ) {
		that.handleSelectAt(indexes.slice(0, indexes.length - 1));
		that.handleSelectAt(indexes.slice(0, indexes.length));
		renderer.setSelectedIndexes(indexes);
	};
	
	that.selectByValues = function( values ) {
		that.selectByIndexes(dataProvider.getIndexesByVals(values));
	};
	
	that.handleSelectAt = function( indexes ) {
		indexes = indexes || [];
		
		var lastIndex = indexes[indexes.length - 1];
		var items = dataProvider.getItemsAt(indexes);
		if (!items && lastIndex >= 0) {
			return;
		}
		
		var i = -1;
		var l = Math.min(indexes.length, currentIndexes.length);
		while (++i < l && indexes[i] == currentIndexes[i]) {}
		var j = --i;
		l = currentIndexes.length;
		while (++j < l) {
			currentIndexes.pop();
			renderer.popNode();
		}
		var lastItemsNode = null;
		l = indexes.length;
		while (++i < l) {
			var index = indexes[i];
			currentIndexes.push(index);
			lastItemsNode = renderItems(currentIndexes.concat());
		}
		if (l == 0) {
			currentIndexes = [];
			renderer.popNode();
			lastItemsNode = renderItems(currentIndexes.concat());
		}
		
		++selectCounter;
		if (lastItemsNode) {
			arguments.callee(indexes.concat(renderer.isEnableLabels() ? -1 : 0));
		}
		--selectCounter;
		
		if (selectCounter == 0) {
			completed = !lastItemsNode;
			dispatchSelect();
			if (completed) {
				dispatchSelectComplete();
			}
		}
	};
	
	function updateCurrents() {
		currentItems = [];
		currentValues = [];
		var realVals = renderer.getValues();
		var i = -1;
		var l = currentIndexes.length;
		while (++i < l) {
			var item = dataProvider.getItemAt(currentIndexes.slice(0, i + 1));
			currentItems.push(item);
			currentValues.push(item ? item.value : realVals[i]);
		}
	}
	
	function renderItems( indexes ) {
		var item = dataProvider.getItemAt(indexes);
		var itemsNode = renderer.addNode(item);
		if (itemsNode) {
			addListeners(itemsNode, indexes);
		}
		return itemsNode;
	}
	
	function addListeners( itemsNode, indexes ) {
		var n = renderer.isEnableLabels() ? 1 : 0;
		itemsNode.addEventListener("change", function(e) {
			var ind = itemsNode.selectedIndex - n;
			that.handleSelectAt(indexes.concat(ind));
		});
	}
	
	function createEvent( name ) {
		var e;
		if (document.createEvent) {
			e = document.createEvent("Event");
			e.initEvent(name, true, false);
		} else {
			e = new Event(name);
		}
		return e;
	}
	
	function dispatch( name ) {
		var e = createEvent(name);
		
		e.selectedIndexes = currentIndexes.concat();
		e.selectedItems = currentItems.concat();
		e.selectedValues = currentValues.concat();
		
		dispatcher.dispatchEvent(e);
	}
	
	function dispatchSelect() {
		updateCurrents();
		dispatch(deepselect.events["select"]);
		if (selectStarted) {
			selectStarted = true;
			dispatch(deepselect.events["selectStart"]);
		}
	}
	
	function dispatchSelectComplete() {
		selectStarted = false;
		updateCurrents();
		dispatch(deepselect.events["selectComplete"]);
	}
	
	that.handleSelectAt();
};

deepselect.Renderer = function( root, cssClasses, enableLabels, label, labelSelectable, labelValue ) {
	var that = this;
	
	var renderedNodes = [];
	var renderedContainers = [];
	
	cssClasses = cssClasses || deepselect.cssClasses;
	label = label || "Choose...";
	labelValue = labelValue || "";
	
	that.isEnableLabels = function() {
		return enableLabels;
	};
	
	that.getValues = function() {
		var vals = [];
		var i = -1;
		var l = renderedNodes.length;
		while (++i < l) {
			var node = renderedNodes[i];
			if (node) {
				vals.push(node.value);
			}
		}
		return vals;
	};
	
	that.setSelectedIndexes = function( indexes ) {
		var n = enableLabels ? 1 : 0;
		var i = -1;
		var l = Math.min(indexes.length, renderedNodes.length);
		while (++i < l) {
			var node = renderedNodes[i];
			node.selectedIndex = indexes[i] + n;
		}
	}
	
	that.popNode = function() {
		if (renderedContainers.length > 0) {
			renderedNodes.pop();
			child = renderedContainers.pop();
			if (child) {
				root.removeChild(child);
			}
		}
	};
	
	that.addNode = function( data ) {
		var node = null;
		var items = (data ? data.items : null) || [];
		var l = items.length;
		if (l > 0) {
			node = document.createElement("select");
			node.className = cssClasses["node"];
			if (enableLabels) {
				var t = {};
				t.name = data.label || label;
				t.value = data.labelValue !== undefined ? data.labelValue : labelValue;
				t.selected = true;
				t.disabled = !(data.labelSelectable !== undefined ? data.labelSelectable : labelSelectable);
				node.appendChild(that.renderNodeItem(t));
			}
			var i = -1;
			while (++i < l) {
				node.appendChild(that.renderNodeItem(items[i]));
			}
			var nodeContainer = that.renderNodeContainer( node );
			root.appendChild(nodeContainer);
		}
		renderedNodes.push(node);
		renderedContainers.push(nodeContainer);
		return node;
	};
	
	that.renderNodeContainer = function( node ) {
		el = document.createElement("div");
		el.className = cssClasses["nodeContainer"];
		el.appendChild(node);
		return el;
	};
	
	that.renderNodeItem = function( data ) {
		var txt = document.createTextNode(data.name);
		var elem = document.createElement("option");
		elem.className = cssClasses["nodeOption"];
		elem.appendChild(txt);
		elem.setAttribute("value", (data.value !== undefined ? data.value : ""));
		if (data.disabled) {
			elem.setAttribute("disabled", "disabled");
		}
		if (data.selected) {
			elem.setAttribute("selected", "selected");
		}
		return elem;
	}
}

deepselect.DataProvider = function( dataSource ) {
	var that = this;
	
	that.getItemAt = function( indexes ) {
		return getAt(indexes)["item"];
	};
	
	that.getItemsAt = function( indexes ) {
		return getAt(indexes)["items"];
	};
	
	that.getIndexesByVals = function( values ) {
		var vals = values.concat();
		var indexes = [];
		var items = dataSource.items;
		while (vals.length) {
			var val = vals.shift();
			var i = items.length;
			while (i-- > 0 && items[i].value != val) {}
			indexes.push(i);
			if (i > -1) {
				items = items[i].items;
				if (items) {
					continue;
				}
			}
			break;
		}
		return indexes;
	};
	
	function getAt( indexes ) {
		var item = dataSource;
		var items = item.items;
		var i = -1;
		var l = indexes.length;
		while (++i < l) {
			var j = indexes[i];
			if (j >= 0 && j < items.length) {
				item = items[j];
				items = item.items || [];
			} else {
				item = null;
				items = null;
				break;
			}
		}
		return { "item": item, "items": items };
	}
};