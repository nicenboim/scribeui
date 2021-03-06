function Workspace(name, options){
    this.name = name;
    this.password = "";

    if(options){
	this.password = options.password ? options.password : this.password;
        this.workspaceSelect = options.workspaceSelect ? options.workspaceSelect : null;
        this.workspaceManage = options.workspaceManage ? options.workspaceManage : null;
        this.mapList = options.mapList ? options.mapList : null;
        this.workspacePassword = options.workspacePassword ? options.workspacePassword : null;
        this.mapDiv = options.mapDiv ? options.mapDiv : null;
        this.mapTable = options.mapTable ? options.mapTable : null;
        this.mapActions = options.mapActions ? options.mapActions : null;
        this.mapDescription = options.mapDescription ? options.mapDescription : null;
        this.groupSelect = options.groupSelect ? options.groupSelect : null;
        this.groupOl = options.groupOl ? options.groupOl : null;
        this.poiSelect = options.poiSelect ? options.poiSelect : null;
        this.dataDiv = options.dataDiv ? options.dataDiv : null;
        this.logTextarea = options.logTextarea ? options.logTextarea : null;
        this.resultTextarea = options.resultTextarea ? options.resultTextarea : null;
        this.debugTextarea = options.debugTextarea ? options.debugTextarea : null;
        this.scaleLevelDiv = options.scaleLevelDiv ? options.scaleLevelDiv : null;
        this.popupWidth = options.popupWidth ? options.popupWidth : null;
        this.popupHeight = options.popupHeight ? options.popupHeight : null;
    }

    this.maps = []

    this.pointsOfInterest = [];
    this.openedMap = null;
}

Workspace.prototype.open = function(){
    this.getMaps(this.displayMaps);
    this.getPointsOfInterest(this.displayPointsOfInterest);
	$("#info").text(this.name);
	onWorkspaceOpened();
};
 
Workspace.prototype.create = function(){
    var self = this;
    $.post($SCRIPT_ROOT + '/_create_new_ws', {
        name: this.name,
        password: this.password
    }, function(status) {
        if(status == "1") {
            self.display();
            self.open();
        }else {
            alert(status);
        }
    });   
};

Workspace.prototype.getMaps = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_open_ws', {
        name: this.name,
        password: this.password
    }, function(data) {
        if(typeof(data) == "object") {
		    var maps = [];
		    $.each(data.maps, function(key, map){
				maps.push(new Map(map.name, {
				    "description": map.description,
				    "url": map.url,
                    "thumbnail": map.thumbnail,
				    "workspace": self
				}));
		    });

            for(var i = 0; i < maps.length; i++){
		        self.maps.push(maps[i]);
            }

		    if(callback){
				callback.call(self)
		    }
			closeWorkspacePopup({"workspaceManage": self.workspaceManage});
			$('#'+self.workspaceManage+' .workspace-errors').hide();
        }else {
			$('#'+self.workspaceManage+' .workspace-errors').show();
			$('#'+self.workspaceManage+' .workspace-errors .error').html(data);
		}
    });
};

Workspace.prototype.getMapByName = function(name){
    for(var i = 0; i < this.maps.length; i++){
	if(this.maps[i].name == name){
	    return this.maps[i];
	}
    }
    return null;
};

Workspace.prototype.getMapIndexByName = function(name){
    for(var i = 0; i < this.maps.length; i++){
	if(this.maps[i].name == name){
	    return i;
	    break;
	}
    }
    return null;
};

Workspace.prototype.getPointsOfInterest = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_get_pois', {
    }, function(data) {
	if (data){
	    var pois = [];
	    $.each(data.pois, function(key, poi){
                var oPoi = new POI(poi.name, poi.lon, poi.lat, poi.scale);
                oPoi["workspace"] = self;
		pois.push(oPoi);
                
	    });
            
            for(var i = 0; i < pois.length; i++){
	        self.pointsOfInterest.push(pois[i]);
            }

	    if(callback){
		callback.call(self)
	    }
	}	
    });
}

Workspace.prototype.getPointOfInterestByName = function(name){
    for(var i = 0; i < this.pointsOfInterest.length; i++){
	if(this.pointsOfInterest[i].name == name){
	    return this.pointsOfInterest[i];
	    break;
	}
    }
    return null;
};

Workspace.prototype.addPointOfInterest = function(name){
    var self = this;

    var center = this.openedMap.OLMap.getCenter();
    var projection = this.openedMap.OLMap.getProjection();
    var lonLat = center.transform(new OpenLayers.Projection(projection.toUpperCase()), new OpenLayers.Projection("EPSG:4326"));
    var scale = this.openedMap.OLMap.getScale();

    var poi = new POI(name, lonLat.lon, lonLat.lat, scale);
    poi["workspace"] = this;

    $.post($SCRIPT_ROOT + '/_add_poi', {
        name: name,
        lon: lonLat.lon, 
        lat: lonLat.lat, 
        scale: scale
    }, function(status) {
	//self.pointsOfInterest.push(poi);
    });
    self.pointsOfInterest.push(poi);
    this.displayPointsOfInterest();
}

Workspace.prototype.displayMaps = function(){
    this.clearMaps();
    $("#map-actions button").button("enable");

    $("#" + this.mapList).empty();

    for(var i = 0; i < this.maps.length; i++){
        this.displayThumbnail(this.maps[i]);
    }
    $("#" + this.mapList).selectable({
		selected: function(e){
            var li = $(this).find(".ui-selected")
			var map = self.getMapByName(li.text());
            if(li.find('.default-preview').length > 0){
                li.addClass('li-default-thumbnail');
            }
			map.displayDescription();
		}
	});
    var self = this;
};

Workspace.prototype.displayThumbnail = function(map){
    var li = $('<li>').addClass('map-preview');
    var image = $('<div>').addClass('map-preview-img').appendTo(li);
    var name = $('<span>').addClass('map-preview-name').text(map.name).appendTo(li);
    if(map.thumbnail){
        image.addClass('thumbnail-preview').css('background-image', 'url("' + map.thumbnail + '")');
    } else{
        image.addClass('default-preview');
    }
    $("#" + this.mapList).append(li);    
}

Workspace.prototype.displayPointsOfInterest = function(){
    this.clearPointsOfInterest();

    for(var i = 0; i < this.pointsOfInterest.length; i++){
	   $("#" + this.poiSelect).append($("<option></option>").attr("value", this.pointsOfInterest[i].name).text(this.pointsOfInterest[i].name)); 
    }

    $("#" + this.poiSelect).trigger('chosen:updated');   
};

Workspace.prototype.display = function(){
    var select = $("#" + this.workspaceSelect);
    select.append($("<option></option>").attr("value", this.name).text(this.name));
    select.val(this.name);
}

Workspace.prototype.close = function(){
    if(this.openedMap){
        this.openedMap.close();
    }

    this.clearMaps();
    delete this;
};

Workspace.prototype.destroy = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_delete_ws', {
        name: this.name,
        password: this.password
    }, function(status) {
        if(status == "1") {
            $("#" + self.workspaceSelect + " option[value=" + self.name + "]").remove();
			$('#'+self.workspacePassword).val('');
            if(callback){
                callback.call(self);
            }
            $("#" + self.workspaceSelect).trigger('chosen:updated');
        }else {
            alert(status);
        }
    });   
}

Workspace.prototype.clearMaps = function(){
    $("#" + this.mapTable).find("tr").remove();
    $("#" + this.mapDescription).html("");
    $(".map-button").button("disable");
}

Workspace.prototype.clearPointsOfInterest = function(){
     $("#" + this.poiSelect).find("option").remove();
}



