!function(Q){

    var FLOWING_FORWARD = 'forward';
    var FLOWING_BACKWARD = 'backward';
    function FlowingSupport(graph) {
        this.map = {};
        this.graph = graph;

        graph.dataPropertyChangeDispatcher.addListener(function (evt) {
            if (evt.propertyName !== 'flow') {
                return;
            }
            this.onChanged(evt.source);
        }.bind(this));
        graph.listChangeDispatcher.addListener(function (evt) {
            if (evt.kind == Q.ListEvent.KIND_CLEAR) {
                this.clear();
            } else if (evt.kind == Q.ListEvent.KIND_REMOVE) {
                this.onRemove(evt.data);
            } else if (evt.kind == Q.ListEvent.KIND_ADD) {
                this.onAdd(evt.data);
            }
        }.bind(this));
    }
    FlowingSupport.prototype = {
        map: null,
        length: 0,
        clear: function () {
            this.map = {};
            this.length = 0;
        },
        _add: function (item) {
            if (this.map[item.id]) {
                return;
            }
            this.length++;
            this.map[item.id] = item;

            if(!item._flowingIcon){
                var ui;
                if(item.bindingUIs){
                    item.bindingUIs.forEach(function(info){
                        if(info.ui.name == 'flowingIcon'){
                            ui = info.ui;
                            return false;
                        }
                    })
                }
                if(!ui){
                    ui = new Q.ImageUI(Q.Shapes.getShape(Q.Consts.SHAPE_CIRCLE));
                    ui.name = 'flowingIcon'
                    ui.fillColor = '#Fdd';
                    ui.layoutByPath = true;
                    ui.position = {x: 0, y: 0};
                    ui.size = {width: 20};
                    ui.renderColor = "#F00";
                    item.addUI(ui);
                }
                item._flowingIcon = ui;
            }

            this.start();
        },
        _remove: function (item) {
            if (!this.map[item.id]) {
                return;
            }
            if(item._flowingIcon){
                item.removeUI(item._flowingIcon);
                item._flowingIcon = null;
            }
            delete this.map[item.id];
            this.length--;
        },

        _interval: 300,
        start: function () {
            if (this._timer) {
                return;
            }
            this._timer = setTimeout(function A() {
                if (!this.length) {
                    offset = 0;
                    this._timer = null;
                    return;
                }
                var perStep = this.perStep;//Math.max(this.perStep / this.graph.scale, 1);
                for(var id in this.map){
                    var element = this.map[id];
                    var ui = this.graph.getUI(id);
                    if(!ui){
                        this._doRemove(id);
                        continue;
                    }
                    var lineLength = ui.length;
                    if(!lineLength){
                        continue;
                    }
                    var x = element._flowingIcon._offset || 0;
                    x += element.flow == FLOWING_BACKWARD ? -perStep : perStep;
                    x %= lineLength;
                    element._flowingIcon._offset = x;
                    element._flowingIcon.position = {x: x, y: 0};
                    this.graph.invalidateUI(ui);
                }
                this._timer = setTimeout(A.bind(this), this._interval);
            }.bind(this), this._interval);
        },
        perStep: 10,
        onChanged: function (element) {
            element.flow ? this._add(element) : this._remove(element);
        },
        _dataToArray: function (data) {
            if (Q.isArray(data)) {
                return data;
            }
            return [data];
        },
        onRemove: function (data) {
            data = this._dataToArray(data);
            data.forEach(function (item) {
                if (this.map[item.id]) {
                    this._remove(item);
                }
            }, this);
        },
        onAdd: function (data) {
            data = this._dataToArray(data);
            data.forEach(function (item) {
                if((item instanceof Q.Edge || item instanceof Q.ShapeNode) && item.flow && !this.map[item.id]) {
                    this._add(item);
                }
            }, this);
        }
    }

    var properties = {
        flow: {
            get: function () {
                return this._flow;
            },
            set: function (v) {
                if (this._flow == v) {
                    return;
                }
                var old = this._flow;
                this._flow = v;
                this.firePropertyChangeEvent('flow', v, old);
            }
        }
    }
    Object.defineProperties(Q.Edge.prototype, properties);
    Object.defineProperties(Q.ShapeNode.prototype, properties);

    if(Q.Element.prototype.addOutProperty){
        Q.Element.prototype.addOutProperty('flow')
    }else{
        setTimeout(function(){
            if(Q.Element.prototype.addOutProperty){
                Q.Element.prototype.addOutProperty('flow')
            }
        })
    }

    Q.FlowingSupport = FlowingSupport;
}(Q)