/*
 * Any variable in this script having-
 * 1) "item" suffix states that its an instance of either TreeItem or TreeItemGroup.
 * 2) "$" prefix states that its pointing to jQuery object for the DOM element. eg. $element
 */

var alphabets = [];
var DATA_KEY_FOR_ITEM_VIEW = "item-view";

for ( var i = 97; i < 123; i++) {
	alphabets.push(String.fromCharCode(i));
}

/**
 * List of items, doesn't maintain uniqueness
 * @returns
 */
function ObjectList(equalsClosure) {
	this.list = [];
	if (!equalsClosure) {
		this.equals = function(a,b) { return a == b; }
	} else
		this.equals = equalsClosure;
	
	// returns index of item this object was added after, or -2 if not added
	// (-1 if added at the beginning of the list, see subclasses)
	this.add = function(item) {
		this.list.push(item);
		return this.list.length - 2;
	}
	
	this.addAfterIndex = function(item, afterIndex) {
		this.list.splice(afterIndex + 1, 0, item);
		return afterIndex;
	}
	
	this.contains = function(item) {
		return this.indexOf(item) >= 0;
	}
	
	this.remove = function(item) {
		var i = this.indexOf(item);
		if (i >= 0) {
			this.list.splice(i, 1);
			return true;
		}
		return false;
	}
	
	this.removeIndex = function(i) {
		this.list.splice(i, 1);
	}
	
	this.each = function(closure) {
		for (var i = 0; i < this.list.length; ++i) {
			if (closure(this.list[i], i)) {
				// if closure returns true, assume value has been deleted and re-run closure on new value of array
				--i;
			}
		}
	}
	
	this.clear = function() {
		this.list = [];
	}
	
	// Overridden in SortedList subclass to utilize the natural sort order to speed up search
	this.indexOf = function(item) {
		var list = this.list;
		for (var i = 0; i < list.length; ++i)
			if (this.equals(this.list[i], item)) {
				return i;
			}
		return -1;
	}
	
	this.length = function() {
		return this.list.length;
	}
}

/**
 * List of items, maintains uniqueness
 * @returns
 */
function UniqueList(equalsClosure) {
	ObjectList.call(this, equalsClosure);

	var superAdd = this.add;
	
	this.add = function(item) {
		if (this.indexOf(item) >= 0)
			return -2;
		
		return superAdd.call(this, item);
	}
}
inherit(UniqueList,ObjectList);

/**
 * List of items, sorted
 * @returns
 */
function SortedList(equalsClosure, orderingClosure) {
	ObjectList.call(this, equalsClosure);
	
	if (!orderingClosure) orderingClosure = function(a, b) {
		return a < b ? -1 : (a > b ? 1 : 0);
	}

	var superAdd = this.add;
	
	this.search = function(item, start, end) {
		start = start || 0;
		end = end || this.list.length;
		var pivot = Math.floor(start + (end - start) / 2);
		var compare = orderingClosure(this.list[pivot], item);
		
		if (compare == 0)
			return pivot;
		
		if (end - start <= 1)
			return compare > 0 ? pivot - 1 : pivot;
		
		if (compare < 0) {
			return this.search(item, pivot, end);
		} else {
			return this.search(item, start, pivot);
		}
	}
	
	this.indexOf = function(item) {
		var searchIndex = this.search(item);
		if (this.equals(this.list[searchIndex], item)) {
			return searchIndex;
		}
		return -1;
	}
	
	this.add = function(item) {
		var list = this.list;
		if (list.length == 0 || orderingClosure(list[list.length - 1], item) < 0) {
			list.push(item);
			return list.length - 2;
		}

		var afterIndex = this.search(item);
		
		this.list.splice(afterIndex + 1, 0, item);
		
		return afterIndex;
	}
	
	this.sort = function() {
		this.list.sort(orderingClosure);
	}
}
inherit(SortedList, ObjectList);

/**
 * Callback container
 * 
 * @param args
 * @returns
 */
function CallbackObject() {
	this.callbacks = new UniqueList();
	
	this.callback = function(callbackClosure) {
		var l = this.callbacks.list.length;
		for (var i = 0; i < l; ++i) {
			callbackClosure(this.callbacks.list[i]);
		}
	}
	
	this.addCallback = function(callback) {
		this.callbacks.add(callback);
	}
	
	this.removeCallback = function(callback) {
		this.callbacks.remove(callback);
	}
}

/**
 * State markers for TreeItems --- set to unmarked when reloading (if after loading they are still unmarked, they should be deleted)
 * created means freshly created, updated means updated rather than freshly created
 */
var TREEITEM_UNMARKED = 0; // reloading object, if still unmarked after reloading, should delete
var TREEITEM_CREATED = 1; // newly created object
var TREEITEM_MARKED = 2; // marked for keeping
var TREEITEM_UPDATED = 3; // marked for keeping and also updated
var TREEITEM_SNAPSHOT = 4; // marking it as a snapshot

function TreeItem(args) {
	this.id = args.id;
	this.type = args.type;
	this.uniqueId = this.type + this.id;
	this.treeStore = args.treeStore;
	this.state = typeof args.state !== 'undefined' ? args.state : TREEITEM_CREATED;
	
	// Wrapping all init statements that we want to override in a method
	this.init = function() {
	}

	// Remove element from UI and notify server
	this.remove = function() {
		// Override
	}
	
	// Call this to signal UI to remove element because it no longer exists in the database
	// Note: this is called after server notifies client the element has been removed, so do not notify server
	this.removed = function() {
		$(this).trigger("deleteEvent");
	}
	
	this.toJSON = function () {
		var copy = $.extend({},this);
		delete copy.treeStore;
		return copy;
	}
	
	this.init();
}

function TreeItemGroup (args) {
	TreeItem.call(this, args);

	this.totalChildren = 0;
	this.children = args.children ? args.children : [];
	
	this.getChildren = function(callback) {
		if (this.totalChildren == 0) {
			this.fetch(callback);
			return;
		}
		callback(this);
	}
	
	this.fetch = function(callback) {
		// Override
	}
	
	this.clear = function() {
		this.totalChildren = 0;
		this.children = [];
	}

	this.getType = function() {
		return this.type;
	}
	
	this.sort = function() {
		// Override
	}
	
	this.addChild = function(treeItem) {
		this.children.push(treeItem);
		this.totalChildren++;
	}
	
	this.updateChildren = function(treeItem) {
		if (typeof treeItem === 'undefined' ) return;
		this.addChild(treeItem);
		this.sort();
		var index = this.children.indexOf(treeItem);
		$(this).trigger("updateChildren",{child:treeItem,index:index});
	}

	this.removeChild = function(childItem) {
		if (typeof childItem == 'undefined') {
			return;
		}
		this.removeChildAtBackend(childItem,function() {
			var index = this.children.indexOf(childItem);
			this.children = removeElem(this.children, childItem);
			this.totalChildren--;
			$(this).trigger("removeChild",{child:childItem,index:index});
		}.bind(this));		
	}
	
	this.removeChildAtBackend = function(childItem, callback) {
		//Override the serverside code and callback
	}

	this.remove = function() {
		//Override and $(this).trigger("deleteEvent");
	}
}
inherit(TreeItemGroup, TreeItem);

/**
 * TreeStore is a map of all extant items. For any given type of item there should be one TreeStore (subclass)
 * which is responsible for updating itself from the server.
 * 
 * @param args
 * @returns
 */
function TreeStore(args) {
	this.store = {}; // map of items based on uniqueId
	
	this.createOrUpdate = function(args) {
		// Override factory method to create items
		// this factory method should call callback notification methods
		// returns an array, 0 = list item, 1 = status (TAGSTORE_CREATED or TAGSTORE_UPDATED)
		
	}
	
	this.contains = function(item) {
		return this.store.hasOwnProperty(item.uniqueId);
	}
}

/**
 * TreeItemList is a list of items
 */

function TreeItemList(options) {
	CallbackObject.call(this);
	
	this.options = $.extend({
		url:"/tag/listTagsAndTagGroups?callback=?",
		sort:'alpha',
		unique:true,
		equalsClosure:function(a,b) { return a.uniqueId == b.uniqueId; }
	}, options);

	var equalsClosure = options.equalsClosure;
	
	this.listItems = new SortedList(equalsClosure, options.orderingClosure);
	this.store = options.store;
	
	this.load = function() {
		// get top-level list of items, add new or changed ones to list
		$.getJSON(this.options.url, getCSRFPreventionObject("listTagsAndTagGroupsCSRF", {sort: this.options.sort}), function(data) {
			this.listItems.each(function(item) {
				item.state = TREEITEM_UNMARKED; // mark for deletion
			});
			for (var i = 0; i < data.length; i++) {
				var listItem = this.store.createOrUpdate(data[i]);
				if (listItem.state == TREEITEM_CREATED) {
					var afterIndex = this.listItems.add(listItem);
					this.callback(function(widget) { widget.notifyCreate(listItem, afterIndex); });
				} else if (listItem.state == TREEITEM_UPDATED) {
					// In future might need to update other items
				}
			}
			this.listItems.each(function(item, i) { // items not appearing should be deleted
				if (item.state == TREEITEM_UNMARKED) {
					this.listItems.removeIndex(i);
					item.removed();
					return true; // re-run this index since we deleted the element
				}
				return false;
			}.bind(this));
			this.callback(function(widget) { widget.notifyDoneLoading(); });
		}.bind(this));
	}
	
	this.addAfter = function(listItem, afterItem) {
		var afterIndex = afterItem ? this.listItems.indexOf(afterItem) : -1;
		if (afterIndex == -1) {
			afterIndex = this.listItems.add(listItem);
		} else {
			this.listItems.addAfterIndex(listItem, afterIndex);
		}
		
		this.callback(function(widget) { widget.notifyCreate(listItem, afterIndex); });
		
		return true;
	}
	
	this.remove = function(listItem) {
		this.listItems = removeElem(this.listItems, listItem)
		listItem.remove(); // TagListWidget remove method not a jQuery one. TODO: Remove from UI
		delete this.itemMap[listItem.id];
	}
	
	this.length = function() {
		return this.listItems.length();
	}
	
	this.clear = function() {
		this.listItems.clear();
	}
}
inherit(TreeItemList,CallbackObject);

function TreeItemView(args) {
	this.id = TreeItemView.autoIncrementIndex++;
	this.data = args;
	this.element = null;
	this.parentItemView = null;
	
	this.init =  function() {
		$(this.data).on("updateEvent", function(event, data) {
			this.update(data);
		}.bind(this));
		
		$(this.data).on("deleteEvent", function(event, data) {
			this.remove();
		}.bind(this));
		this.element = this.getElementId();
	}
	
	this.getElementId = function() {
		return 'view-'+this.id; 
	}
	
	this.init();
	
	this.getDOMElement = function() {
		return $('#'+this.element);
	}
	
	this.hide = function() {
		this.getDOMElement().hide();
	}
	
	this.show = function() {
		this.getDOMElement().show();
	}
	
	this.getData = function() {
		return this.data;
	}
	
	this.render = function(extraParams) {
		// Needed to be overridden
	}
	
	this.remove = function() {
		this.getDOMElement().remove();
	}
	
	this.update = function(data) {
		// Needed to be overridden
	}
	
	this.hasParentItemView = function() {
		return this.parentItemView;
	}
	
	this.getParentItemView = function() {
		return this.parentItemView;
	}
	
	this.setParentItemView = function(itemView) {
		this.parentItemView = itemView;
	}
	
	this.getTopMostParentItemView = function() {
		if (this.hasParentItemView()) {
			this.getParentItemView().getTopMostParentItemView();
		} else {
			return this;
		}
	}
	
	this.highlight = function(isTemporary) {
		$element = this.getDOMElement();
		$(".highlight").removeClass("highlight");
		$element.addClass('highlight');
		
		if (isTemporary) {
			setTimeout(function() {
				this.removeClass('highlight');
			}.bind($element), 350);
		}
	}
	
	this.getHTMLTag = function() {
		return TreeItemView.tagName;
	}
	
	this.getTreeItemViewCssClass = function() {
		return "treeItemView"
	}
}

TreeItemView.autoIncrementIndex = 1;
TreeItemView.tagName = "li"; // HTML Tag Used as a child
TreeItemView.cssClass = ["li.treeItemView"];


function TreeItemGroupView(args) {
	TreeItemView.call(this, args);
	this.childViews =[];
	
	this.onTreeItemUpdate = function() {
		$(this.data).on("updateChildren", function(event,args) {
			console.log("Event update children " + event.target);
			var childView = this.createChildView(args.child);
			this.childViews.splice(args.index,0,childView);
			this.renderChild(childView, args.index);
		}.bind(this));
	}
	
	this.onTreeItemRemove = function() {
		$(this.data).on("removeChild", function(event,args) {
			if (this.childViews.length == 0) return;
			var childView = this.childViews[args.index];
			if (typeof childView !== 'undefined') {
				this.childViews = removeElem(this.childViews,childView);
				childView.remove();
			}
		}.bind(this));
	}
	
	this.bindEventListners = function() {
		this.onTreeItemRemove();
		this.onTreeItemUpdate();
	}
	
	this.clear = function() {
	}
	
	this.removeChildren = function() {
		$.each(this.childViews, function(index,itemView) {
			itemView.remove();
			this.childViews = removeElem(this.childViews, itemView);
		}.bind(this));
	}
	
	this.remove = function() {
		this.removeChildren();
		$(this.getDOMElement().remove());
	}
	
	this.getData = function() {
		return this.data;
	}
	
	this.getType = function() {
		return this.type;
	}
	
	this.render = function(template) {
		//Override
	}
	
	this.getChildrenWrapper = function() {
		//Override
	}
	
	this.renderChildren = function() {
		$.each(this.data.children, function(index,listItem) {
			var itemView = this.createChildView(listItem);
			itemView = this.renderChild(itemView);
			this.childViews.push(itemView);
		}.bind(this));
		
	}
	
	this.createChildView = function(listItem) {
		// Override
	}
	
	this.renderChild = function(itemView,index) {
		//tagName here is the html tag that is used to render a TreeItem
		if (index && index > -1 && typeof $("> "+this.tagName,this.getChildrenWrapper())[index] !=='undefined') {
			$($("> "+this.tagName,this.getChildrenWrapper())[index]).after(itemView.render({
				showDeleteIcon : true,
			}));
		} else {
			$(this.getChildrenWrapper()).append(itemView.render({
				showDeleteIcon : true,
			}));
		}
		$(itemView.getDOMElement()).data(DATA_KEY_FOR_ITEM_VIEW,itemView);
		itemView.setParentItemView(this);
		return itemView;
	}
	
	this.showTagGroup = function() {
		if (this.data.state !== TREEITEM_SNAPSHOT) {
			this.data.getChildren(this.toggleShow.bind(this));
		} else {
			this.toggleShow();
		}
	}
	
	this.toggleShow = function() {
		//Override
	}
	
	this.editView = function() {
		//Override
	}
	
	this.getTreeItemViewCssClass = function() {
		return "treeItemView treeItemGroupView"
	}

}
inherit(TreeItemGroupView, TreeItemView);
TreeItemGroupView.cssClass = ["li.treeItemGroupView"].concat(TreeItemView.cssClass);


/**
 * TagListWidget - Represents the Tag and Tag Group list widget on the query and
 * track page
 * 
 * @returns
 */
function TreeWidget(args) {
	this.list = args.list;
	this.element = "div#tagListWrapper ul#tagList";
	this.filterText = "";
	
	this.list.addCallback(this);
	
	// Todo extend options
	
	this.load = function() {
		this.list.load();
	}
	
	this.add = function(listItem, afterItem) {
		this.list.addAfter(listItem, afterItem);
	}
	
	this.createTreeItemView = function(listItem) {
		//Override
	}
	
	this.getListItemElements = function() {
		return $("> "+ TreeItemView.tagName, this.element);
	}
	
	this.addListItemToListWidget = function(listItem, afterItemIndex) {
		var relativeElement;
		var itemView = this.createTreeItemView(listItem);
		
		if (afterItemIndex >= 0 && afterItemIndex < this.list.length() - 1) { // initially when the list is empty there will be no last child
			relativeElement = $("> "+itemView.getHTMLTag(), this.element)[afterItemIndex];
			$(relativeElement).after(itemView.render());
		} else if (afterItemIndex < 0) {
			relativeElement = $("> "+itemView.getHTMLTag() + ":first", this.element);
			if (relativeElement && relativeElement[0]) {
				$(relativeElement).before(itemView.render());
			} else
				$(this.element).prepend(itemView.render());
		} else {
			//Adding last element
			relativeElement = $(itemView.getHTMLTag()+":last-child", this.element);
			$(this.element).append(itemView.render());
		}
		$(itemView.getDOMElement()).data(DATA_KEY_FOR_ITEM_VIEW, itemView);
	}
	
	this.bindClickOnTreeItemGroupView = function() {
		$(document).on("click",TreeItemGroupView.cssClass[0]+" > .ui-icon-pencil", function(e) {
			e.stopPropagation();
			var target = e.target.parentElement;
			var treeItemGroupView = $(target).data(DATA_KEY_FOR_ITEM_VIEW);
			treeItemGroupView.editView();
		}.bind(this));
	}
	
	this.bindClickOnAllItems = function() {
		/**
		 * Binding event on delete icon of tag groups & tags of tagGroups.
		 */
		$(document).on("click", ".ui-icon-close", function(e) {
			e.stopPropagation(); // Prevents triggering click event of parent
									// tag group if any.
			var $target = $(e.target).parent();
			var itemView= $target.data(DATA_KEY_FOR_ITEM_VIEW);
			if (itemView.hasParentItemView()) {
				var parentItemGroup = itemView.getParentItemView().getData();
				parentItemGroup.removeChild(itemView.getData());
			} else {
				itemView.getData().remove();
			}
			return;
		}.bind(this));
		
		$(document).on("mousedown",TreeItemView.cssClass.join(" "), function(e){
			var itemView = $(e.target).data(DATA_KEY_FOR_ITEM_VIEW);
			if (typeof itemView == 'undefined') return;
			itemView.highlight();
		}.bind(this));
	}
	
	this.notifyCreate = function(item, afterIndex) {
		this.addListItemToListWidget(item, afterIndex);
	}

	this.notifyDoneLoading = function() {
		this.makeDraggableAndDroppable();
	}
}

$(document).on("click", TreeItemGroupView.cssClass.join(","),
	function(e) { // This will bind click event for all future
						// element.
		e.stopPropagation(); // Prevents triggering click event
									// of parent tag group if any.
		var target;
		if ($(e.target).hasClass('ui-icon-pencil') || $(e.target).hasClass('ui-icon-close')) {
			return;
		} else if (typeof $(e.target).attr('class')!=='undefined' && 
				($(e.target).attr('class').indexOf('ui-icon-triangle') !==-1 || 
						$(e.target).hasClass('description'))) {
			//if clicked on the dropdown icon
			target = e.target.parentElement;
		} else {
			target = e.target;
		}
		var itemView = $(target).data(DATA_KEY_FOR_ITEM_VIEW);
		itemView.highlight();
		if (itemView instanceof TreeItemGroupView) {
			itemView.showTagGroup();
		}	
	}
.bind(this));
