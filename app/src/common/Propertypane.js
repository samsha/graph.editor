!function (Q) {
    ///editors
    function StringEditor(property, parent, getter, setter, scope) {
        this.getter = getter;
        this.setter = setter;
        this.scope = scope;
        this.property = property;

        this.createHtml(parent);
    }

    StringEditor.prototype = {
        _getValue: function () {
            return this.getter.call(this.scope);
        },
        update: function () {
            this.value = this._getValue();
        },
        setValue: function (v) {
            this.input.value = valueToString(v, this.property.type);
        },
        createHtml: function (parent) {
            var property = this.property;
            var input = Q.createElement({
                tagName: 'input',
                class: "form-control",
                type: property.type,
                min: property.min,
                max: property.max,
                parent: parent
            });
            this.input = input;

            if(property.readonly){
                input.setAttribute('readonly', 'readonly');
            }

            this.update();

            $(input).on('input', function (evt) {
                if (this.ajdusting) {
                    return;
                }
                this.setter.call(this.scope, this);
            }.bind(this));
        }
    }

    Object.defineProperties(StringEditor.prototype, {
        value: {
            get: function () {
                return stringToValue(this.input.value, this.property.type);
            },
            set: function (v) {
                this.ajdusting = true;
                this.setValue(v);
                this.ajdusting = false;
            }
        }
    })

    function ColorEditor() {
        Q.doSuperConstructor(this, ColorEditor, arguments);
    }

    ColorEditor.prototype = {
        createHtml: function (parent) {
            var input = Q.createElement({
                tagName: 'input',
                class: "form-control",
                parent: parent
            });
            Q.createElement({tagName: 'span', parent: parent, class: "input-group-addon", html: '<i></i>'});
            this.input = input;

            this.update();

            $(parent).colorpicker().on('changeColor.colorpicker', function (evt) {
                if (this.ajdusting) {
                    return;
                }
                this.setter.call(this.scope, this);
            }.bind(this));
        }
    }
    Q.extend(ColorEditor, StringEditor);

    var elementProperties = [{name: 'name', displayName: 'Name'}, {
        style: Q.Styles.LABEL_FONT_SIZE,
        type: 'number',
        displayName: 'Font Size'
    }, {style: Q.Styles.LABEL_COLOR, type: 'color', displayName: 'Label Color'}, {
        style: Q.Styles.RENDER_COLOR,
        type: 'color',
        displayName: 'Render Color'
    }];
    var nodeProperties = [{name: 'size', type: 'size', displayName: 'Size'}, {
        name: 'location',
        type: 'point',
        displayName: 'Location'
    }, {name: 'rotate', type: 'number', displayName: 'Rotate'}, {
        style: Q.Styles.BORDER,
        type: 'number',
        displayName: 'Border'
    }, {
        style: Q.Styles.BORDER_COLOR,
        type: 'color',
        displayName: 'Border Color'
    }, {
        client: 'status',
        type: 'color',
        displayName: '状态'
    }];
    var shapeProperties = [{
        style: Q.Styles.SHAPE_STROKE_STYLE,
        type: 'color',
        displayName: 'Stroke Color'
    }, {
        style: Q.Styles.SHAPE_STROKE,
        type: 'number',
        displayName: 'Stroke'
    }];
    var edgeProperties = [{name: 'angle', type: 'degree'},{style: Q.Styles.BORDER, display: 'none'}, {
        style: Q.Styles.EDGE_WIDTH,
        type: 'number',
        displayName: 'Edge Width'
    }, {style: Q.Styles.EDGE_COLOR, type: 'color', displayName: 'Edge Color'}];
    var textProperties = [{name: 'size', display: 'none'}, {
        style: Q.Styles.LABEL_SIZE,
        type: 'size',
        displayName: 'Size'
    }, {
        style: Q.Styles.RENDER_COLOR,
        display: 'none'
    }, {style: Q.Styles.LABEL_BACKGROUND_COLOR, type: 'color', displayName: 'Background Color'}];

    //var propertiesMap = {
    //    'Q.Element': {
    //        class: Q.Element,
    //        properties: {
    //            name: {name: 'name'},
    //            'S:edge.width': {name: 'edge.width', type: 'number', propertyType: 'style'},
    //            'S:edge.color': {name: 'edge.color', type: 'color', propertyType: 'style'}
    //        }
    //    }
    //};
    var propertiesMap = {};

    var classIndex = 0;

    function getPropertiesByType(clazz, create) {
        var name = clazz._classPath || clazz._tempName;
        if (!name) {
            name = clazz._tempName = 'class-' + classIndex++;
        }
        if (!create) {
            return propertiesMap[name];
        }
        return propertiesMap[name] = {class: clazz, properties: {}};
    }

    function getPropertyKey(name, propertyType) {
        if (propertyType == Q.Consts.PROPERTY_TYPE_STYLE) {
            return 'S:' + name;
        }
        if (propertyType == Q.Consts.PROPERTY_TYPE_CLIENT) {
            return 'C:' + name;
        }
        return name;
    }

    //var className = 0;
    function registerProperties(clazz, properties, groupName) {
        var propertyMap = getPropertiesByType(clazz, true);
        properties.forEach(function (property) {
            var key;
            if (property.style) {
                property.propertyType = Q.Consts.PROPERTY_TYPE_STYLE;
                property.name = property.style;
            } else if (property.client) {
                property.propertyType = Q.Consts.PROPERTY_TYPE_CLIENT;
                property.name = property.client;
            } else if (property.name) {
                property.propertyType = Q.Consts.PROPERTY_TYPE_ACCESSOR;
            } else {
                return;
            }
            var key = property.key = getPropertyKey(property.name, property.propertyType);
            if (!property.groupName) {
                property.groupName = groupName || 'Element';
            }
            propertyMap.properties[key] = property;
        })
    }

    registerProperties(Q.Element, elementProperties, 'Element');
    registerProperties(Q.Node, nodeProperties, 'Node');
    registerProperties(Q.Edge, edgeProperties, 'Edge');
    registerProperties(Q.Text, textProperties, 'Text');
    registerProperties(Q.ShapeNode, shapeProperties, 'Shape');

    function getProperties(data) {
        var properties = {};
        for (var name in propertiesMap) {
            if (!(data instanceof propertiesMap[name].class)) {
                continue;
            }
            var map = propertiesMap[name].properties;
            for (var key in map) {
                var p = map[key];
                if (p.display == 'none') {
                    delete properties[key];
                } else {
                    properties[key] = p;
                }
            }
        }
        return new PropertyGroup(properties);
    }

    function PropertyGroup(properties) {
        this.properties = properties;
        var groups = {};
        for (var key in properties) {
            var groupName = properties[key].groupName;
            var group = groups[groupName];
            if (!group) {
                group = groups[groupName] = {};
            }
            group[key] = properties[key];
        }
        this.group = groups;
    }

    PropertyGroup.prototype = {
        contains: function (name, propertyType) {
            var key = getPropertyKey(name, propertyType);
            return this.properties[key];
        }

    }

    var createCellEditor = function (item, parent, getter, setter, scope) {
        var type = item.type;
        if (type == 'color') {
            return new ColorEditor(item, parent, getter, setter, scope);
        }
        return new StringEditor(item, parent, getter, setter, scope);
    }

    function getElementProperty(graph, element, name, type) {
        if (!type || type == Q.Consts.PROPERTY_TYPE_ACCESSOR) {
            return element[name];
        }
        if (type == Q.Consts.PROPERTY_TYPE_STYLE) {
            return graph.getStyle(element, name);
        }
        if (type == Q.Consts.PROPERTY_TYPE_CLIENT) {
            return element.get(name);
        }
    }

    function setElementProperty(value, element, name, type) {
        if (!type || type == Q.Consts.PROPERTY_TYPE_ACCESSOR) {
            return element[name] = value;
        }
        if (type == Q.Consts.PROPERTY_TYPE_STYLE) {
            return element.setStyle(name, value);
        }
        if (type == Q.Consts.PROPERTY_TYPE_CLIENT) {
            return element.set(name, value);
        }
    }

    function PropertyPane(graph, parent, options) {
        this._formItems = [];

        this.html = parent;
        this.form = Q.createElement({class: 'form-horizontal', parent: parent, tagName: 'form'});

        this.graph = graph;

        graph.dataPropertyChangeDispatcher.addListener(function (evt) {
            this.onDataPropertyChange(evt);
        }.bind(this));
        graph.selectionChangeDispatcher.addListener(function (evt) {
            this.datas = this.graph.selectionModel.toDatas();
        }.bind(this));

    }

    function numberToString(number) {
        return number | 0;
        //return number.toFixed(2);
    }

    function valueToString(value, type) {
        if (!value) {
            return value;
        }
        if (type == 'point') {
            return numberToString(value.x) + ',' + numberToString(value.y);
        }
        if (type == 'size') {
            return numberToString(value.width) + ',' + numberToString(value.height);
        }
        if(type == 'degree'){
            return '' + (value * 180 / Math.PI) | 0;
        }
        return value.toString();
    }

    function stringToValue(string, type) {
        if (type == 'number') {
            return parseFloat(string) || 0;
        }
        if (type == 'boolean') {
            return string ? true : false;
        }
        if (type == 'point') {
            var xy = string.split(',');
            if (xy.length == 2) {
                return {x: parseFloat(xy[0] || 0), y: parseFloat(xy[1]) || 0};
            }
            return;
        }
        if (type == 'size') {
            var xy = string.split(',');
            if (xy.length == 2) {
                var w = parseFloat(xy[0]) || 0;
                var h = parseFloat(xy[1]) || 0;
                if (w && h) {
                    return {width: w, height: h};
                }
            }
            return;
        }
        if(type == 'degree'){
            return parseInt(string) * Math.PI / 180
        }
        return string;
    }

    PropertyPane.prototype = {
        _formItems: null,
        onValueChange: function (value, item) {
            this.setValue(value, item);
        },
        adjusting: false,
        _containsElement: function (data) {
            for (var d in this.datas) {
                if (d == data) {
                    return true;
                }
            }
        },
        _containsProperty: function (name, type) {
            return this.propertyGroup && this.propertyGroup.contains(name, type);
        },
        _cellEditors: null,
        _getCellEditors: function (name, propertyType) {
            if (!this._cellEditors) {
                return;
            }
            var key = getPropertyKey(name, propertyType);
            return this._cellEditors[key];
        },
        onDataPropertyChange: function (evt) {
            if (this.adjusting) {
                return;
            }
            if (!this.datas || !this.datas.length) {
                return null;
            }
            var data = evt.source;
            if (!this._containsElement(data)) {
                var editors = this._getCellEditors(evt.kind, evt.propertyType);
                if (!editors) {
                    return;
                }
                if (!Q.isArray(editors)) {
                    editors = [editors];
                }
                editors.forEach(function (editor) {
                    editor.update();
                })
            }
        },
        clear: function () {
            $('.colorpicker-element').colorpicker('hide');
            this.form.innerHTML = '';
            this._formItems = [];
            this._cellEditors = null;
            this.form.style.display = 'none';
            //this.html.style.display = 'none';
        },
        createItem: function (parent, property) {
            var formItem = Q.createElement({class: 'form-group', parent: parent});
            var label = Q.createElement({
                parent: formItem,
                tagName: 'label',
                class: 'col-sm-6 control-label font-small',
                html: getI18NString(property.displayName || property.name)
            });
            var inputDIV = Q.createElement({parent: formItem, class: "input-group input-group-sm col-sm-6"});

            var cellEditor = createCellEditor(property, inputDIV, function () {
                return this.getValue(property);
            }.bind(this), function (editor) {
                this.onValueChange(editor.value, property);
            }.bind(this));

            var key = getPropertyKey(property.name, property.propertyType);
            if (!this._cellEditors) {
                this._cellEditors = {};
            }
            var editors = this._cellEditors[key];
            if (!editors) {
                this._cellEditors[key] = [cellEditor];
            } else {
                editors.push(cellEditor);
            }
            return formItem;
        },
        setValue: function (value, property) {
            if (!this.datas || !this.datas.length) {
                return null;
            }
            this.adjusting = true;

            if (property.type && property.type != 'string' && Q.isString(value)) {
                value = stringToValue(value, property.type);
            }

            this.datas.forEach(function (data) {
                var old = getElementProperty(this.graph, data, property.name, property.propertyType);
                if (old === value) {
                    return;
                }
                setElementProperty(value, data, property.name, property.propertyType);
            }, this)

            this.adjusting = false;

        },
        getValue: function (property) {
            if (!this.datas || !this.datas.length) {
                return null;
            }
            if (this.datas.length == 1) {
                return getElementProperty(this.graph, this.datas[0], property.name, property.propertyType) || '';
            }
        },
        /**
         *
         <form class="form-horizontal" style="">
         <div class="class-group">
         <h4>Element</h4>
         <div class="form-group">
         <label class="col-sm-6 control-label font-small">Name</label>
         <div class="input-group input-group-sm col-sm-6">
         <input type="text" value="" onchange="onvaluechange(event)" class="form-control"/>
         </div>
         </div>
         <div class="form-group">
         <label class="col-sm-6 control-label font-small" >Background Color</label>
         <div class="input-group input-group-sm color-picker col-sm-6">
         <input type="text" value="#EEE" class="form-control"/>
         <span class="input-group-addon"><i></i></span>
         </div>
         </div>
         <div class="form-group">
         <label class="col-sm-6 control-label font-small">Line Width</label>
         <div class="input-group input-group-sm col-sm-6">
         <input class="form-control" type="number" value="1" min="1" max="10"/>
         </div>
         </div>
         </div>
         </form>
         * @param name
         * @param properties
         */
        createItemGroup: function (name, properties) {
            var group = Q.createElement({class: 'class-group', parent: this.form});
            Q.createElement({tagName: 'h4', parent: group, html: name});
            for (var name in properties) {
                this.createItem(group, properties[name]);
            }
        }

    }
    Object.defineProperties(PropertyPane.prototype, {
        datas: {
            get: function () {
                return this._datas;
            },
            set: function (datas) {
                if (this._datas == datas) {
                    return;
                }
                if (datas && !Q.isArray(datas)) {
                    datas = [datas];
                }
                this._datas = datas;
                this.clear();
                if (!datas.length) {
                    return;
                }
                if (datas.length == 1) {
                    this.form.style.display = '';
                    this.propertyGroup = getProperties(datas[0]);
                    var group = this.propertyGroup.group;
                    for (var groupName in group) {
                        this.createItemGroup(groupName, group[groupName]);
                    }
                }
            }
        }
    })

    Q.PropertyPane = PropertyPane;
}(Q)