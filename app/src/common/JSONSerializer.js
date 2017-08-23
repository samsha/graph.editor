//json export and parse support
!function (Q, window, document) {
    if (Q.Graph.prototype.parseJSON) {
        return;
    }
    //v1.8
    function isEmptyObject(obj) {
        if (!(obj instanceof Object)) {
            return !obj;
        }
        if (Array.isArray(obj)) {
            return obj.length == 0;
        }
        for (var key in obj) {
            return false;
        }
        return true;
    }

    function getByPath(pathName, scope) {
        var paths = pathName.split('.');
        scope = scope || window;
        var i = -1;
        while (scope && ++i < paths.length) {
            var path = paths[i];
            scope = scope[path];
        }
        return scope;
    }

    function loadClassPath(object, namespace, loadChild) {
        object._classPath = namespace;
        if (object instanceof Function) {
            object.prototype._className = object._classPath;
            object.prototype._class = object;
//            Q.log(v._className);
//            continue;
        }
        if (loadChild === false) {
            return;
        }
        for (var name in object) {
            if (name[0] == '_' || name[0] == '$' || name == 'superclass' || name == 'constructor' || name == 'prototype' || name.indexOf('.') >= 0) {
                continue;
            }
            var v = object[name];
            if (!v || !(v instanceof Object) || v._classPath) {
                continue;
            }
            loadClassPath(v, namespace + '.' + name);
        }
    }

    var prototypes = {};

    function getPrototype(data) {
        var className = data._className;
        if (!className) {
            return null;
        }
        var prototype = prototypes[className];
        if (!prototype) {
            var clazz = data._class;
            prototype = prototypes[className] = new clazz();
        }
        return prototype;
    }

    function equals(a, b) {
        return a == b || (a && b && a.equals && a.equals(b));
    }

    Q.HashList.prototype.toJSON = function (serializer) {
        var datas = [];
        this.forEach(function (data) {
            datas.push(serializer.toJSON(data));
        })
        return datas;
    }

    Q.HashList.prototype.parseJSON = function (json, serializer) {
        var result = [];
        json.forEach(function (item) {
            var data = serializer.parseJSON(item);
            this.add(data);
            result.push(data);
        }, this)
        return result;
    }

    function exportElementProperties(serializer, properties, info, element) {
        var prototype = getPrototype(element);
        properties.forEach(function (name) {
            var value = element[name];
            if (!equals(value, prototype[name])) {
                var json = serializer.toJSON(value);
                if (json || !value) {
                    info[name] = json;
                }
            }
        }, element);
    }

    function exportProperties(serializer, properties) {
        var info;
        for (var s in properties) {
            if (!info) {
                info = {};
            }
            info[s] = serializer.toJSON(properties[s]);
        }
        return info;
    }

    var wirtableUIProperties = {
        class: false,
        id: false,
        "fillGradient": false,
        "syncSelectionStyles": false,
        "originalBounds": false,
        "parent": false,
        "font": false,
        "$data": false,
        "$x": false,
        "$y": false
    };

    Q.BaseUI.prototype.toJSON = function (serializer) {
        var json = {};
        for (var name in this) {
            if (name[0] == '_' || (name[0] == '$' && name[1] == '_') || (name.indexOf('$invalidate') == 0) || wirtableUIProperties[name] === false) {
                continue;
            }
            var value = this[name];
            if(value instanceof Function || value == this.class.prototype[name]){
                continue;
            }
            //wirtableUIProperties[name] = true;

            try{
                json[name] = serializer.toJSON(value);
            }catch(error){

            }

        }

        return json;
    }
    //new Q.ImageUI().toJSON();
    //new Q.LabelUI().toJSON();
    //Q.log(JSON.stringify(wirtableUIProperties))

    Q.BaseUI.prototype.parseJSON = function (info, serializer) {
        for (var name in info) {
            var v = serializer.parseJSON(info[name]);
            this[name] = v;
        }
    }

    var OUTPUT_PROPERTIES = ['retatable', 'editable', 'layoutable','visible',  'busLayout','enableSubNetwork', 'zIndex', 'tooltipType', 'tooltip', 'movable', 'selectable', 'resizable', 'uiClass', 'name', 'parent', 'host'];

    Q.Element.prototype.addOutProperty = function(name){
        if(!this.outputProperties){
            this.outputProperties = [];
        }
        this.outputProperties.push(name);
    }
    Q.Element.prototype.removeOutProperty = function(name){
        if(this.outputProperties){
            var index = this.outputProperties.indexOf(name);
            if(index >= 0){
                this.outputProperties.splice(index, 1);
            }
        }
    }
    Q.Element.prototype.toJSON = function (serializer) {
        var info = {};
        var outputProperties = OUTPUT_PROPERTIES;
        if (this.outputProperties) {
            outputProperties = outputProperties.concat(this.outputProperties);
        }
        exportElementProperties(serializer, outputProperties, info, this);
        if (this.styles) {
            var styles = exportProperties(serializer, this.styles);
            if (styles) {
                info.styles = styles;
            }
        }
        if (this.properties) {
            var properties = exportProperties(serializer, this.properties);
            if (properties) {
                info.properties = properties;
            }
        }
        var bindingUIs = this.bindingUIs;
        if (bindingUIs) {
            var bindingJSONs = [];
            //var binding = {id: ui.id, ui: ui, bindingProperties: bindingProperties};
            bindingUIs.forEach(function (binding) {
                var uiJSON = serializer.toJSON(binding.ui);
                bindingJSONs.push({
                    ui: uiJSON,
                    bindingProperties: binding.bindingProperties
                })
            })
            info.bindingUIs = bindingJSONs;
        }
        return info;
    }
    Q.Element.prototype.parseJSON = function (info, serializer) {
        if (info.styles) {
            var styles = {};
            for (var n in info.styles) {
                styles[n] = serializer.parseJSON(info.styles[n]);
            }
            this.putStyles(styles, true);
            //delete info.styles;
        }
        if (info.properties) {
            var properties = {};
            for (var n in info.properties) {
                properties[n] = serializer.parseJSON(info.properties[n]);
            }
            this.properties = properties;
        }
        if (info.bindingUIs) {
            info.bindingUIs.forEach(function (binding) {
                var ui = serializer.parseJSON(binding.ui);
                if (!ui) {
                    return;
                }
                this.addUI(ui, binding.bindingProperties);

                //var circle = new Q.ImageUI(ui.data);
                //circle.lineWidth = 2;
                //circle.strokeStyle = '#ff9f00';
                //this.addUI(circle);
            }, this)
        }
        for (var n in info) {
            if (n == 'id' || n == 'styles' || n == 'properties' || n == 'bindingUIs') {
                continue;
            }
            var v = serializer.parseJSON(info[n]);
            this[n] = v;
        }
    }
    Q.Node.prototype.toJSON = function (serializer) {
        var info = Q.doSuper(this, Q.Node, 'toJSON', arguments);
        exportElementProperties(serializer, ['location', 'size', 'image', 'rotate', 'anchorPosition', 'parentChildrenDirection', 'layoutType', 'hGap', 'vGap'], info, this);
        return info;
    }
    Q.Group.prototype.toJSON = function (serializer) {
        var info = Q.doSuper(this, Q.Group, 'toJSON', arguments);
        exportElementProperties(serializer, ['minSize', 'groupType', 'padding', 'groupImage', 'expanded'], info, this);
        return info;
    }
    Q.ShapeNode.prototype.toJSON = function (serializer) {
        var info = Q.doSuper(this, Q.Node, 'toJSON', arguments);
        exportElementProperties(serializer, ['location', 'rotate', 'anchorPosition', 'path'], info, this);
        return info;
    }
    Q.Edge.prototype.toJSON = function (serializer) {
        var info = Q.doSuper(this, Q.Edge, 'toJSON', arguments);
        exportElementProperties(serializer, ['angle', 'from', 'to', 'edgeType', 'angle', 'bundleEnabled', 'pathSegments'], info, this);
        return info;
    }

    function JSONSerializer(options) {
        if (options) {
            this.withGlobalRefs = options.withGlobalRefs !== false;
        }
        this.reset();
    }

    JSONSerializer.prototype = {
        _refs: null,
        _refValues: null,
        _index: 1,
        root: null,
        reset: function () {
            this._globalRefs = {};
            this._elementRefs = {};
            this._refs = {};
            this._refValues = {};
            this._index = 1;
        },
        getREF: function (id) {
            return this._refs[id];
        },
        clearRef: function () {
            for (var id in this._globalRefs) {
                delete this._globalRefs[id]._value;
            }
            for (var id in this._refValues) {
                delete this._refValues[id]._refId;
            }
            this.reset();
        },
        elementToJSON: function (element) {
            return this._toJSON(element);
        },
        _elementRefs: null,
        _globalRefs: null,
        withGlobalRefs: true,
        toJSON: function (value) {
            if (!(value instanceof Object)) {
                return value;
            }
            if (value instanceof Function && !value._classPath) {
                return null;
            }
            if(!this.withGlobalRefs){
                return this._toJSON(value);
            }
            if (value instanceof Q.Element) {
                this._elementRefs[value.id] = true;
                return {_ref: value.id};
            }
            if (value._refId === undefined) {
                var json = this._toJSON(value);
                if (!json) {
                    return json;
                }
                //添加引用标记，下次遇到这个对象时，不需要再toJSON，而是直接输出引用，比如{"$ref": 1}
                var id = value._refId = this._index++;
                //将对象暂时存放在_refValues中，以便在导出完成后，删除掉上一步对value增加的_refId属性
                this._refValues[id] = value;
                this._refs[id] = json;
                return json;
            }
            //遇到相同的对象，将对象信息存放到全局map，网元属性只需要存放引用id，比如{"$ref": 1}
            //全局map中存放在g属性中，以id为key，json为value，如下：
            //"refs": {
            //  "1": {
            //    "_classPath": "Q.Position.LEFT_BOTTOM"
            //  }
            //},
            //"datas": [
            //  {
            //    "_className": "Q.Node",
            //    "json": {
            //      "name": "A",
            //      "styles": {
            //        "property": {
            //          "$ref": 1
            //        }
            //      },
            var id = value._refId;
            if (!this._globalRefs[id]) {
                //如果还没有加入到全局引用区，则将json放入到_globalRefs，同时将原来的json变成引用方式
                var json = this._refs[id];
                if (!json) {
                    return json;
                }
                var clone = {};
                for (var name in json) {
                    clone[name] = json[name];
                    delete json[name];
                }
                json.$ref = id;
                this._globalRefs[id] = clone;
            }
            return {$ref: id};
        },
        _toJSON: function (value) {
            if (value._classPath) {
                return {_classPath: value._classPath};
            }
            if (!value._className) {
                if(Q.isArray(value)){
                    var json = [];
                    value.forEach(function(v){
                        json.push(this.toJSON(v));
                    }, this)
                    return json;
                }else {
                    json = {};
                    var prototype;
                    if(value.class){
                        prototype = value.class.prototype;
                    }
                    for (var name in value) {
                        var v = value[name];
                        if(v instanceof Function || (prototype && v == prototype[name])){
                            continue;
                        }
                        json[name] = this.toJSON(value[name]);
                    }
                    return json;
                }

                return value;
            }
            var result = {_className: value._className};
            if (value.toJSON) {
                result.json = value.toJSON(this);
            } else {
                result.json = value;
            }
            return result;
        },
        jsonToElement: function (json) {
            //如果之前解析的数据中引用到了此节点，此节点其实已经被解析了，这里只需要返回引用就可以了
            if (json._refId !== undefined && json._refId in this._refs) {
                return this._refs[json._refId];
            }
            return this._parseJSON(json);
        },
        parseJSON: function (json) {
            if (!(json instanceof Object)) {
                return json;
            }
            if(!this.withGlobalRefs){
                return this._parseJSON(json);
            }
            //全局引用
            if (json.$ref !== undefined) {
                //从全局引用中获取json信息
                var gJson = this._globalRefs[json.$ref];
                if (!gJson) {
                    return;
                }
                //将json信息解析成对象，并缓存在json的_value属性中
                if (gJson._value === undefined) {
                    gJson._value = this.parseJSON(gJson);
                }
                return gJson._value;
            }
            //如果属性为element引用，先从_elementRefs中找到对应element的json信息，然后将此json信息解析成element
            if (json._ref !== undefined) {
                var elementJson = this._elementRefs[json._ref];
                if (!elementJson) {
                    return;
                }
                return this.jsonToElement(elementJson);
            }
            ////如果json包含_refId属性，说明这是一个element类型，直接调用jsonToElement，不过应该不会出现
            //if (json._refId !== undefined) {
            //  return this.jsonToElement(json);
            //}
            return this._parseJSON(json);
        },
        _parseJSON: function (json) {
            if(!(json instanceof Object)){
                return json;
            }
            if (json._classPath) {
                return getByPath(json._classPath);
            }
            if (json._className) {
                var F = getByPath(json._className);
                var v = new F();
                ///防止相互引用导致的问题
                if (this.withGlobalRefs && json._refId !== undefined) {
                    this._refs[json._refId] = v;
                }
                if (v && json.json) {
                    json = json.json;
                    if (v.parseJSON) {
                        v.parseJSON(json, this);
                    } else {
                        for (var n in json) {
                            v[n] = json[n];
                        }
                    }
                }
                return v;
            }
            if(Q.isArray(json)){
                var result = [];
                json.forEach(function(j){
                    result.push(this.parseJSON(j));
                }, this)
                return result;
            }
            var result = {};
            for(var name in json){
                result[name] = this.parseJSON(json[name])
            }
            return result;
        }
    }

    //var json = {
    //  refs: {//
    //    1: {},
    //    2: {}
    //  },
    //  datas: [{
    //    type: '',
    //    json: {
    //      parent: {_ref: 1},
    //      image: {_g: 1}
    //    }
    //  },{
    //    type: 'group',
    //    _refId: 1,
    //    json: {}
    //  }, {}],
    //  version: '1.8'
    //}
    function graphModelToJSON(model, filter) {
        var serializer = new JSONSerializer();
        var json = {
            version: '2.0',
            refs: {}
        };
        var datas = [];
        var map = {};
        if (model.currentSubNetwork) {
            var elementJson = serializer.elementToJSON(model.currentSubNetwork);
            if (elementJson) {
                json.currentSubNetwork = {_ref: elementJson._refId = model.currentSubNetwork.id};
            }
        }
        model.forEach(function (d) {
            if (filter && filter(d) === false) {
                return;
            }
            var elementJson = serializer.elementToJSON(d);
            if (elementJson) {
                datas.push(elementJson);
                map[d.id] = elementJson;
            }
        });
        if (serializer._elementRefs) {
            for (var id in serializer._elementRefs) {
                map[id]._refId = id;
            }
        }
        if (serializer._globalRefs) {
            json.refs = serializer._globalRefs;
        }
        serializer.clearRef();

        json.datas = datas;
        for (var name in json) {
            if (isEmptyObject(json[name])) {
                delete json[name];
            }
        }
        return json;
    }

    Q.GraphModel.prototype.toJSON = function (filter) {
        return graphModelToJSON(this, filter);
    }
    function versionToNumber(version) {
        var index = version.indexOf('.');
        if (index < 0) {
            return parseFloat(version);
        }
        version = version.substring(0, index) + '.' + version.substring(index).replace(/\./g, '');
        return parseFloat(version);
    }

    Q.GraphModel.prototype.parseJSON = function (json, options) {
        options = options || {};
        var datas = json.datas;
        if (!datas || !(datas.length > 0)) {
            return;
        }
        var result = [];
        var serializer = new JSONSerializer(options, json.g);
        var elementRefs = {};
        datas.forEach(function (info) {
            if (info._refId) {
                elementRefs[info._refId] = info;
            }
        })
        serializer._globalRefs = json.refs || {};
        serializer._elementRefs = elementRefs;

        datas.forEach(function (json) {
            var element = serializer.jsonToElement(json);
            if (element instanceof Q.Element) {
                result.push(element);
                this.add(element);
            }
        }, this);

        if(this.currentSubNetwork){
            var currentSubNetwork = this.currentSubNetwork;
            result.forEach(function(e){
                if(!e.parent){
                    e.parent = currentSubNetwork;
                }
            })
        }

        if (json.currentSubNetwork) {
            var currentSubNetwork = serializer.getREF(json.currentSubNetwork._ref);
            if (currentSubNetwork) {
                this.currentSubNetwork = currentSubNetwork;
            }
        }
        serializer.clearRef();

        return result;
    }

    Q.Graph.prototype.toJSON = Q.Graph.prototype.exportJSON = function (toString, options) {
        options = options || {};
        var json = this.graphModel.toJSON(options.filter);
        json.scale = this.scale;
        json.tx = this.tx;
        json.ty = this.ty;
        if (toString) {
            json = JSON.stringify(json, options.replacer, options.space || '\t')
        }
        return json;
    }
    Q.Graph.prototype.parseJSON = function (json, options) {
        if (Q.isString(json)) {
            json = JSON.parse(json);
        }
        options = options || {}
        var result = this.graphModel.parseJSON(json, options);
        var scale = json.scale;
        if(scale && options.transform !== false){
            this.originAtCenter = false;
            this.translateTo(json.tx || 0, json.ty || 0, scale);
        }
        return result;
    }

    loadClassPath(Q, 'Q');
    Q.loadClassPath = loadClassPath;

    Q.exportJSON = function(object, toString){
        try{
            var json = new JSONSerializer({withGlobalRefs: false}).toJSON(object);
            return toString? JSON.stringify(json) : json;
        }catch(error){
        }
    }
    Q.parseJSON = function(json){
        try{
            if(Q.isString(json)){
                json = JSON.parse(json);
            }
            return new JSONSerializer({withGlobalRefs: false}).parseJSON(json);
        }catch(error){
        }
    }
}(Q, window, document);