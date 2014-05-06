/*
 * Any variable in this script having-
 * 1) "item" suffix states that its an instance of either Tag or TagGroup.
 * 2) "$" prefix states that its pointing to jQuery object for the DOM element. eg. $element
 */
var DATA_KEY_FOR_TAGLIST_ITEM = "tag-list-item";
var DATA_KEY_FOR_PARENT_TAGGROUP_ITEM = "parent-tag-group-item";
var tagListWidget;
var wildcardTagGroup;

function Tag(args) {
	TreeItem.call(this, args);
	this.description = args.description;
	this.isContinuous = args.isContinuous;
	this.showPoints = args.showPoints;
	this.update = function(args) {
		if (typeof args.state !== 'undefined' && args.state == TREEITEM_SNAPSHOT) {
			this.state = TREEITEM_SNAPSHOT;
		} else {
			this.state = TREEITEM_MARKED;
		}
		
		if (this.description != args['description']) {
			this.setDescription(args['description']);
			this.state = TREEITEM_UPDATED;
		}
		if (this.isContinuous != args['isContinuous']) {
			this.isContinuous = args['isContinuous'];
			this.state = TREEITEM_UPDATED;
		}
	}
	
	//Wrapping all init statements that we want to override in a method
	this.init = function() {
		$(this).on("updateEvent",function(){
			backgroundJSON("saving tag information", "/tag/update?callback=?", {id:this.id, description:this.description, type:this.type} , function(data) {
				console.log(data);
			});
		});
	}

	this.init();
	
	this.isTag = function() { return true; }
	
	this.setDescription = function(description) {
		var oldDescription = this.description;
		this.description = description;
		$(this).trigger("updateEvent",{oldDescription:oldDescription, description:description});
	}
	
	this.getTagProperties = function(callback) {
		backgroundJSON("loading tag information", "/tag/getTagProperties?callback=?",
		getCSRFPreventionObject("getTagPropertiesCSRF", {id : this.id}),
		function(data) {
			this.isContinuous = data.isContinuous;
			this.showPoints = data.showPoints;
			callback(this);
		}.bind(this));
	}

	this.getDescription = function() {
		return this.description;
	}

	this.getIsContinuous = function() {
		return this.isContinuous;
	}

	this.getShowPoints = function() {
		return this.showPoints;
	}

	this.setIsContinuous = function(isContinuous) {
		return this.isContinuous = isContinuous;
	}

	this.setShowPoints = function(showPoints) {
		return this.showPoints = showPoints;
	}

	this.tagList = function() {
		return [ this ];
	}
	
	this.matchNameList = function(tagNames) {
		if (tagNames.length != 1) return false;

		return tagNames[0] == this.description;
	}

	this.matchNameListSegment = function(nameIterator) {
		if (nameIterator.remaining() <= 0)
			return false;
		return nameIterator.next() == this.description;
	}
	
	this.getChildren = function(callback) {
		callback();
	}
}

inherit(Tag, TreeItem);

function TagGroup(args) {
	Tag.call(this, args);
	TreeItemGroup.call(this, args);
	if (this.getType().indexOf('wildcard')!==-1) {
		this.isWildcard = true; // cache this for efficiency
	}
	
	this.isTag = function() { return false; }
	
	this.fetch = function(callback) {
		if (this.isWildcard) {
			tagList.eachMatchingTag(this.getDescription(), function(tag) {
				this.addChild(tag);
			}.bind(this));
			callback(this);
		} else {
			backgroundJSON("loading tag group", "/tag/showTagGroup?callback=?", getCSRFPreventionObject("showTagGroupCSRF", {
				id : this.id,
				description: this.getDescription()
			}), function(data) {
				jQuery.each(data, function(index, tag) {
					tag.type = tag.class;
					this.addChild(this.treeStore.createOrUpdate(tag));
				}.bind(this));
				callback(this);
			}.bind(this));
		}
	}
	
	this.fetchAll = function(callback) {
		this.fetch(function(tagGroup){
			for(var i in tagGroup.children) {
				if (!tagGroup.children[i].isTag()) {
					tagGroup.children[i].fetchAll(function() {} );
				}
			}
			callback();
		});
	}
	
	this.tagList = function() {
		var list = new Array();
		console.log(this.children);
		for (var i = 0, len = this.children.length; i < len; ++i) {
			var childNames = this.children[i].tagList();
			list = list.concat(childNames);
		}
		console.log(list);
		return list;
	}
	
	this.setIsContinuous = function(isContinuous) {
		for (var i = 0, len = this.children.length; i < len; ++i) {
			this.children[i].setIsContinuous(isContinuous);
		}
		
		return isContinuous;
	}

	this.setShowPoints = function(showPoints) {
		for (var i = 0, len = this.children.length; i < len; ++i) {
			this.children[i].setShowPoints(showPoints);
		}
		
		return showPoints;
	}

	this.removeTagByName = function(tagName) {
		for (var i = 0, len = this.children.length; i < len; ++i) {
			var listItem = this.children[i];
			if (listItem instanceof Tag && !(listItem instanceof TagGroup)) {
				if(listItem.description == tagName) {
					this.removeChild(listItem);
					return listItem;
				}
			} else if (listItem instanceof TagGroup) {
				return listItem.removeTagByName(tagName);
			}
		}
		return false;
	} 
	
	// match list of tags with passed-in tag names --- temporary kludge to check tag group matching with
	// lists of tags rather than direct references to tag groups
	// note: assumes tags are in same order, but we'll assume that for this temporary kludge
	this.matchNameList = function(tagNames) {
		var nameIterator = new NameIterator(tagNames);
		
		if (!this.matchNameListSegment(nameIterator))
			return false;
		
		return nameIterator.remaining() == 0;
	}

	this.matchNameListSegment = function(nameIterator) {
		for (var i = 0, len = this.children.length; i < len; ++i) {
			if (!this.children[i].matchNameListSegment(nameIterator))
				return false;
		}
		
		return true;
	}
		
	this.sort = function() {
		this.children.sort(function(itemA, itemB) {
			if (itemA.description < itemB.description)
				return -1;

			if (itemA.description > itemB.description)
				return 1;
			return 0;
		});
	}
	
	this.removeChildAtBackend = function(childItem, callback) {
		var csrfKey = "removeTagFromTagGroupCSRF"
		var url = "/tag/removeTagFromTagGroup?callback=?";
		if(childItem.type.indexOf("Group")!==-1) {
			csrfKey = "removeTagGroupFromTagGroupCSRF"
			url = "/tag/removeTagGroupFromTagGroup?callback=?";
		}
		backgroundJSON("deleting tag from group", url, getCSRFPreventionObject(csrfKey, {
			tagGroupId : this.id,
			id: childItem.id
		}), function(data) {
			callback();
		}.bind(this));
		
	}

	this.remove = function() {
		backgroundJSON("deleting tag group", "/tag/deleteTagGroup?callback=?", getCSRFPreventionObject("deleteTagGroupCSRF", {
			id : this.id
		}), function(data) {
			this.removed();
		}.bind(this));
	}
	
	this.nameList = function() {
		var list = new Array();
		
		for (var i = 0, len = this.children.length; i < len; ++i) {
			var childNames = this.children[i].nameList();
			for (var j = 0, len2 = childNames.length; j < len2; ++j) {
				list.push(childNames[j]);
			}
		}
		
		return list;
	}
	
	this.matchTagList = function(tags) { // assume tag list is in same order as comparison tags
		var name = this.nameList();
		
		if (tags.length != 1) return false;

		return tags[0] == this.description;
	}
}
inherit(TagGroup, Tag);
inherit(TagGroup, TreeItemGroup);

function TagStore(args) {
	TreeStore.call(this,args);
	this.createOrUpdate = function(args) {
		var typeClass;
		var listItem;
		var type;
		if (typeof args.type !== 'undefined' && args.type.indexOf('Group')!==-1) { 
			type = args.type.replace("us.wearecurio.model.", "");
			type = type.replace(/^[A-Z]/g, function(s) {
					return s.toLowerCase();
			});
			typeClass=TagGroup;
						
		} else if (typeof args.class !== 'undefined' && args.class.indexOf('Group')!==-1) {
			typeClass=TagGroup;
			type='tagGroup';
		} else {
			typeClass=Tag;
			type='tag';
		}
		
		listItem = this.store[type+args.id];
		var initArgs = {
			description : args['description'],
			isContinuous : args['isContinuous'],
			type : type,
			id : args['id'],
			treeStore : this,
			state: args['state']
		};
		if (typeof listItem == 'undefined') {
			if (args instanceof Tag || args instanceof TagGroup) {
				listItem = args;
			} else {
				listItem = new typeClass(initArgs);
			}
			this.store[type+args.id]=listItem;
		} else {
			listItem.update(initArgs);
		}
		
		return listItem;
	}
	
	this.getTagByName = function(tagName) {
		for (var property in this.store) {
		    if (this.store.hasOwnProperty(property)) {
		    	if(this.store[property].description == tagName) {
		    		return this.store[property];
		    	}
		    }
		}
	}.bind(this)
	
}

inherit(TreeStore, TagStore);


/**
 * TagList is a list of items
 */

function TagList(args) {
	args = args || {};
	if (!args.orderingClosure) {
		args.orderingClosure = function(tag1, tag2) {
			if (tag1.description < tag2.description)
				return -1;
			else if (tag1.description > tag2.description)
				return 1;
			return 0;
		}
	}
	
	TreeItemList.call(this, args);
	
	this.sort = function() {
		this.listItems.sort();
	}
	
	this.searchItemByDescriptionAndType = function(description, type) {
		var item;
		$.each(this.listItems.list, function() {
			if (this instanceof type && this.description == description) {
				item = this;
				return false;
			}
		});
		if (!item) {
			console.error("No tag or tag group found with description: "
					+ description);
		}
		return item;
	}
	
	this.searchListItemByName = function(name) {
		var found = false;
		$.each(this.listItems, function() {
			if (this.description == name) {
				found = this;
			}
		});
		return found;
	}
	
	this.eachSearchMatches = function(term, matchClosure, noMatchClosure, skipSet, additionalWordsCharLimit) {
		var list = this.listItems.list;
		var i, j, result = [];
		
		var terms = term.split(' ');
		var spaceTerms = [];
		
		for (j in terms) {
			spaceTerms.push(' ' + terms[j]);
		}
		
		var termLonger = term.length > additionalWordsCharLimit;
		
		for (i = 0; i < list.length; ++i) {
			var tag = list[i];
			var match = false;
			var tagName = tag.description;
			if (tagName in skipSet) continue;
			match = true;
			for (j in terms) {
				if (terms[j].length >0 && (!(tagName.startsWith(terms[j]) || (termLonger && (tagName.indexOf(spaceTerms[j]) >= 0)) ))) {
					match = false;
					break;
				}
			}
			if (match) {
				skipSet[tag.description] = 1;
				matchClosure(tag, i);
			} else if (noMatchClosure) {
				noMatchClosure(tag, i);
			}
		}
		
		return result;
	}

	this.eachMatchingTag = function(term, matchClosure, noMatchClosure) {
		if (term.length > 0) {
			var skipSet = {};
			
			this.eachSearchMatches(term, matchClosure, noMatchClosure, skipSet, 3);
			
			this.eachSearchMatches(term, matchClosure, noMatchClosure, skipSet, 0);
		}
	}
	
	this.eachTag = function(closure) {
		this.listItems.each(closure);
	}
	
	this.generateUniqueTagName = function(name) {
		if (this.searchListItemByName(name)) {
			var exists = false;
			var newName;
			for (j = 0; j < alphabets.length; j++) {
				newName = name + " " + alphabets[j];
				if (!this.searchListItemByName(newName)) {
					return newName;
				}
			}
		} else {
			return name;
		}
	}
	
	this.createTagGroupFromTags = function(targetTag, sourceTag, callback) {
		backgroundJSON("creating tag group", "/tag/createTagGroup?callback=?", getCSRFPreventionObject("createTagGroupCSRF", {
			tagGroupName : this.generateUniqueTagName(targetTag.description
					+ " group"),
			tagIds : [ sourceTag.id, targetTag.id ].toString()
		}), function(data) {
			var listItem = this.store.createOrUpdate(data)
			this.addAfter(listItem, targetTag);
			if ( typeof callback !== 'undefined') {
				listItem.fetch(callback);
			}
		}.bind(this));
	}
	
	this.addTagGroupToTagGroup = function(targetTagGroup, sourceTagGroup) {
		console.log("addTagGroupToTagGroup");
		backgroundJSON("adding tag group", "/tag/addTagGroupToTagGroup?callback=?", getCSRFPreventionObject("addTagGroupToTagGroupCSRF", {
			parentTagGroupId : targetTagGroup.id,
			childTagGroupId : sourceTagGroup.id
		}), function(data) {
			targetTagGroup.updateChildren(sourceTagGroup);
			console.log("Debug addTagGroupToTagGroup callback");
		});
	}
	
	this.addTagToTagGroup = function(tagGroup, tag) {
		console.log("addTagToTagGroup");
		backgroundJSON("adding tag to group", "/tag/addTagToTagGroup?callback=?", getCSRFPreventionObject("addTagToTagGroupCSRF", {
			tagGroupId : tagGroup.id,
			id : tag.id
		}), function(data) {
			console.log("Debug addTagToTagGroup callback");
			tagGroup.updateChildren(tag);
		});
	}
}

inherit(TagList, TreeItemList);

function NameIterator(names) {
	this.names = names;
	this.i = 0;
	
	this.remaining = function() {
		return this.names.length - this.i;
	}
	
	this.next = function() {
		return this.names[this.i++];
	}
}

function TagView(args) {
	TreeItemView.call(this,args);
	this.pinned = args.pinned || false;
	
	this.pin = function() {
		this.getDOMElement().addClass("pinned");
		this.hide();
	}
	
	this.unpin = function() {
		this.getDOMElement().removeClass("pinned");
		this.show();
	}
	
	this.render = function(extraParams) {
		var pinIcon = "ui-icon-pin-w";
		if (this.pinned) {
			pinIcon = "ui-icon-pin-s";
		}
		
		return '<li id="'+this.element+'" class="'+ this.getTreeItemViewCssClass() +' tag" data-type="tag"><span class="description">' 
		+ this.data.description +'</span><span class="ui-icon '+pinIcon+'"></span>'
			+ (extraParams != undefined && extraParams.showDeleteIcon ? '<span class="hide ui-icon ui-icon-close"></span>' : '') + '</li>';
	}
	
	this.update = function(data) {
		var $element = $(this.getDOMElement());
		$("> .description",$element).html(data.description);
	}
	
	this.highlight = function(isTemporary) {
		$element = this.getDOMElement();
		$(".highlight").removeClass("highlight");
		$element.addClass('highlight');
		
		if(isTemporary) {
			setTimeout(function() {
				this.removeClass('highlight');
			}.bind($element), 350);
		}
	}
}

function TagGroupView(args) {
	TagView.call(this, args);
	TreeItemGroupView.call(this,args);
	
	this.clear = function() {
		
	}
	
	this.render = function(extraParams) {
		var pinIcon = "ui-icon-pin-w";
		if (this.pinned) {
			pinIcon = "ui-icon-pin-s";
		}
		
		var html = '<li id="'+this.element+'" class="'+ this.getTreeItemViewCssClass()+' '+ this.data.type + '" data-type="' + this.data.type + 
		'"><span class="ui-icon ui-icon-triangle-1-e"></span><span class="description">'
		+ this.data.description +'</span><span class=" hide ui-icon ui-icon-close"></span>';
		
		if (!this.data.isWildcard) {
			html +='<span class=" hide ui-icon ui-icon-pencil"></span>';
		}
		html+='<span class="ui-icon '+pinIcon+'"></span><ul class="hide tags"></ul></li>';
		return html;
	}
	
	this.update = function(data) {
		var $element = $(this.getDOMElement());
		$("> .description",$element).html(data.description);
	}

	this.getChildrenWrapper = function() {
		return $("> ul", this.getDOMElement());
	}
	
	this.createChildView = function(listItem) {
		var itemView;
		if (listItem instanceof Tag && !(listItem instanceof TagGroup)) {
			itemView = new TagView(listItem);
		} else {
			itemView = new TagGroupView(listItem);
			itemView.bindEventListners();
		}
		return itemView
	}
	
	this.toggleShow = function() {
		if (this.data.isWildcard) {
			this.removeChildren();
			this.renderChildren();
		}
		if (this.childViews.length==0) {
			this.renderChildren();
		}
		this.getChildrenWrapper().slideToggle("slow");
		this.getDOMElement().toggleClass("active");
		$(" > span[class*='ui-icon-triangle']", this.getDOMElement())
				.toggleClass("ui-icon-triangle-1-e").toggleClass(
						"ui-icon-triangle-1-s");
	}

}
inherit(TagGroupView, TagView);
inherit(TagGroupView, TreeItemGroupView)
/**
 * TagListWidget - Represents the Tag and Tag Group list widget on the query and
 * track page
 * 
 * @returns
 */
function TagListWidget(args) {
	args = args || {};
	args.list = args.list || new TagList({store:args.store});
	TreeWidget.call(this,args);
	this.element = "div#tagListWrapper ul#tagList";
	this.filterText = "";
	
	this.createTreeItemView = function(listItem) {
		var itemView;
		if (listItem instanceof Tag && !(listItem instanceof TagGroup)) {
			itemView = new TagView(listItem);
		} else {
			itemView = new TagGroupView(listItem);
			itemView.bindEventListners();
		}
		return itemView
	}
	
	this.makeDraggableAndDroppable = function(element) {
		if (typeof element == 'undefined') {
			element = this.element;
		}
		$(element).delegate(".treeItemView","mouseenter",function(){
			$(this).draggable({
				revert : 'invalid',
				helper: function(event) {
					return $( '<div class="draggable-helper">' + $(event.target).html() + '</div>' );
			    }
			});
			$(this).droppable({
				drop : tagListWidget.dropTagListItem.bind(tagListWidget)
			});
		});
	}
	
	this.dropTagListItem = function(event, ui) {
		var $target = $(event.target);
		var $source = $(ui.draggable[0]);
		event.stopPropagation();
		if ($target.is("span")) { //Disregard events on innner spans
			return;
		}
		
		if ($source.is("span")) {
			return;
		}
		
		if ($target.hasClass('tag') && $target.data(DATA_KEY_FOR_ITEM_VIEW).hasParentItemView()) {
			return;
		}
		
		var sourceItem = $source.data(DATA_KEY_FOR_ITEM_VIEW).getData();
		var targetItem = $target.data(DATA_KEY_FOR_ITEM_VIEW).getData();
		var targetView = $target.data(DATA_KEY_FOR_ITEM_VIEW);
		var sourceView = $source.data(DATA_KEY_FOR_ITEM_VIEW);
		targetView.highlight(true);
		if ((sourceItem instanceof TagGroup)
				&& (targetItem instanceof TagGroup)) {
			targetView = targetView.getTopMostParentItemView();
			if(typeof targetView !=='undefined')
				this.list.addTagGroupToTagGroup(targetItem, sourceItem);
		} else if ((sourceItem instanceof Tag)
				&& (targetItem instanceof TagGroup)) {
			targetView = targetView.getTopMostParentItemView();
			if(typeof targetView !=='undefined')
				this.list.addTagToTagGroup(targetView.getData(), sourceItem);
		} else if (!(sourceItem instanceof TagGroup) && (sourceItem instanceof Tag) && (targetItem instanceof Tag)) {
			this.list.createTagGroupFromTags(targetItem, sourceItem);
		}
		
	}
	
	this.dropWildcardTagGroup = function(event, ui) {
		var $source = $(ui.draggable[0]);
		var sourceItem = $source.data(DATA_KEY_FOR_ITEM_VIEW).getData();
		if ((sourceItem instanceof TagGroup)
				&& sourceItem.isWildcard) {
			backgroundJSON("adding wildcard group", "/tag/addWildcardTagGroup?callback=?", {
				description : sourceItem.description,
			}, function(data) {
				data.type = "wildcardTagGroup";
				
				this.add(new TagGroup(data));
			}.bind(this));
		}
	}
	
	this.showMatchingTags = function(description) {
		var elements = this.getListItemElements();
		this.list.eachMatchingTag(description, function(tag, i) {
			if (!$(elements[i]).hasClass('pinned')) {
				$(elements[i]).show();
			}
		}.bind(this), function(tag, i) {
			$(elements[i]).hide();
		}.bind(this));
	}
	
	this.showAllTags = function() {
		this.getListItemElements().show();
	}
	
	this.addToPinnedList = function(itemView) {
		$("#stickyTagList").append(itemView.render({pinned:true}));
		if ($("#stickyTagList").hasClass("hide")) {
			$("#stickyTagList").removeClass("hide");
		}
		$(itemView.getDOMElement()).data(DATA_KEY_FOR_ITEM_VIEW, itemView);
	}
	
	this.makeDraggableAndDroppable();
	this.makeDraggableAndDroppable("#stickyTagList");
	$(document).on("click","li.tagGroup > .ui-icon-pencil", function(e) {
		e.stopPropagation();
		var target = e.target.parentElement;
		var tagGroupView = $(target).data(DATA_KEY_FOR_ITEM_VIEW);
		$("input","#tagGroupEditDialog").val(tagGroupView.getData().description);
		$("input","#tagGroupEditDialog").data(DATA_KEY_FOR_TAGLIST_ITEM,tagGroupView.getData());
		$("#tagGroupEditDialog").dialog("open");
	}.bind(this));
	
	$(document).on("click","li.treeItemView > .ui-icon-pin-w", function(e) {
		e.stopPropagation();
		var target = e.target.parentElement;
		var itemView = $(target).data(DATA_KEY_FOR_ITEM_VIEW);
		console.log("Clicked on tree item:" + itemView.getData());
		var pinnedView = this.createTreeItemView(itemView.getData());
		pinnedView.pinned = true;
		this.addToPinnedList(pinnedView);
		itemView.pin();
		
		//Show the view in the list view once unpinned
		$(itemView.getData()).on("unpinned",function(event, target){
			this.unpin();
		}.bind(itemView));
	}.bind(this));
	
	$(document).on("click","li.treeItemView > .ui-icon-pin-s", function(e) {
		e.stopPropagation();
		var target = e.target.parentElement;
		var itemView = $(target).data(DATA_KEY_FOR_ITEM_VIEW);
		$(itemView.getData()).trigger("unpinned");
		itemView.remove();
	}.bind(this));
	
}

inherit(TagListWidget, TreeWidget);

/*
 * function tagListFindSearchMatches(list, ) { var i, j, result = [];
 * 
 * 
 * 
 * for (j in terms) { spaceTerms.push(' ' + terms[j]); }
 * 
 * var termLonger = term.length > additionalWordsCharLimit;
 * 
 * for (i in list) { var tag = list[i]; var tagName = tag.description if
 * (tagName in skipSet) continue; var match = true; for (j in terms) { if
 * (terms[j].length >0 && (!(tagName.startsWith(terms[j]) || (termLonger &&
 * (tagName.indexOf(spaceTerms[j]) >= 0)) ))) { match = false; break; } } if
 * (match) { result.push(tag); } }
 * 
 * return result; }
 */
function tagListSetInputText(inp, text) {
	if (inp.data('textAlreadySet'))
		return;
	inp.data('textAlreadySet', true);
	inp.val(text);
	inp.css('color', '#000000');
}

// must be called from within $(document).ready()
function initTagListOnly(load) {
	var tagStore = new TagStore();
	tagList = tagList || new TagList({store:tagStore});
	if (load) {
		tagList.load();
	}
}

//must be called from within $(document).ready()
function initTagListWidget() {
	var tagStore = new TagStore(); 
	tagList = new TagList({store:tagStore});
	tagListWidget = tagListWidget || new TagListWidget({list:tagList});
	tagListWidget.bindClickOnTreeItemGroupView();
	tagListWidget.bindClickOnAllItems();
	tagList.load();
	var tagSearchInput = $("#tagSearch");
	$("#tagNav").droppable({
		drop : tagListWidget.dropWildcardTagGroup.bind(tagListWidget)
	});
	$(tagSearchInput).click(function(e) {
		tagListSetInputText(tagSearchInput, '');
	}.bind(this));
	
	var widget = tagListWidget;

	tagSearchInput.keyup(function(e) {
		if ($(e.target).val() == "") {
			$("li", "#wildcardTagGroupSearch").remove();
			widget.showAllTags();
			return;
		}
		var d = $(e.target).val();
		widget.showMatchingTags(d);
		var wildcardTagGroup = new TagGroup({id:0,description:d,type:'wildcardTagGroup'});
		var wildcardTagGroupView = new TagGroupView(wildcardTagGroup);
		$("#wildcardTagGroupSearch").html(wildcardTagGroupView.render());
		$("#wildcardTagGroupSearch").show();
		wildcardTagGroupView.getDOMElement().data(DATA_KEY_FOR_ITEM_VIEW, wildcardTagGroupView);
		$("li","#wildcardTagGroupSearch").draggable({
			revert : true
		});
	});
	
	$("#tagGroupEditDialog").dialog({
		autoOpen: false,
		dialogClass:'tagGroupDialog',
		buttons: {
			"Save":function() {
				var tagGroupItem = $("input","#tagGroupEditDialog").data(DATA_KEY_FOR_TAGLIST_ITEM);
				var newTagGroupName = $("input","#tagGroupEditDialog").val();
				tagGroupItem.setDescription(newTagGroupName);
				$(this).dialog("close");
			}
		},
		
	});
}
