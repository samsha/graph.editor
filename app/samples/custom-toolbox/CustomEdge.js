
var FLOWING_FORWARD = 'forward';
var FLOWING_BACKWARD = 'backward';
var FLOWING_FORWARD_WITH_ICON = 'forward.with.icon';
var FLOWING_BACKWARD_WITH_ICON = 'backward.with.icon';

//居然可以重写Q.Graph
function CustomGraph() {
    Q.doSuperConstructor(this, CustomGraph, arguments);

    this.flowSupport = new FlowingSupport();

    this.dataPropertyChangeDispatcher.addListener(function (evt) {
        if (evt.propertyName !== 'flow') {
            return;
        }
        this.flowSupport.onChanged(evt.source);
    }.bind(this));
    this.listChangeDispatcher.addListener(function (evt) {
        if (evt.kind == Q.ListEvent.KIND_CLEAR) {
            this.flowSupport.clear();
        } else if (evt.kind == Q.ListEvent.KIND_REMOVE) {
            this.flowSupport.onRemove(evt.data);
        } else if (evt.kind == Q.ListEvent.KIND_ADD) {
            this.flowSupport.onAdd(evt.data);
        }
    }.bind(this));
}

Q.extend(CustomGraph, Q.Graph);
Q.Graph = CustomGraph;

function FlowingSupport(graph) {
    this.map = {};
    this.graph = graph;
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
        this.start();
    },
    _remove: function (item) {
        if (!this.map[item.id]) {
            return;
        }
        delete this.map[item.id];
        this.length--;
    },
    _interval: 300,
    start: function () {
        if (this._timer) {
            return;
        }
        var offset = 0;
        this._timer = setTimeout(function A() {
            if (!this.length) {
                offset = 0;
                this._timer = null;
                return;
            }
            offset -= 2;
            for(var id in this.map){
                var edge = this.map[id];
                edge.setStyle(Q.Styles.EDGE_LINE_DASH_OFFSET, edge.flow == FLOWING_BACKWARD ? -offset : offset);
            }
            this._timer = setTimeout(A.bind(this), this._interval);
        }.bind(this), this._interval);
    },
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
            if(item instanceof Q.Edge && item.flow && !this.map[item.id]) {
                this._add(item);
            }
        }, this);
    }
}

Q.Edge.prototype._checkFlowIcon = function(){
    if(this.flowIconUI){
        this.removeUI(this.flowIconUI);
        this.flowIconUI = null;
    }
    if(!this.flow){
        return;
    }

}
Object.defineProperties(Q.Edge.prototype, {
    flowIcon: {
        get: function(){
            return this._flowIcon;
        },
        set: function(v){
            if(this._flowIcon == v){
                return;
            }
            this._flowIcon = v;
            this._checkFlowIcon();
        }
    },
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
            this.setStyle(Q.Styles.EDGE_LINE_DASH, v ? [8, 8]: null);

            this.firePropertyChangeEvent('flow', v, old);
        }
    },
    label1: {
        get: function () {
            return this._label1;
        },
        set: function (v) {
            if (this._label1 == v) {
                return;
            }
            var old = this._label1;
            this._label1 = v;
            
            if(!v && !this.label1UI){
                return;
            }
            if(!this.label1UI){
                var label2 = new Q.LabelUI();
                label2.position = Q.Position.CENTER_TOP;
                label2.anchorPosition = Q.Position.LEFT_BOTTOM;
                var icon2 = new Q.ImageUI(Q.Shapes.getShape(Q.Consts.SHAPE_ARROW_2, -20, 10));
                icon2.fillColor = '#0EE';
                icon2.position = Q.Position.CENTER_TOP;
                icon2.anchorPosition = Q.Position.RIGHT_BOTTOM;
                icon2.padding = 3;
                this.addUI(label2);
                this.addUI(icon2);
                this.label1UI = label2;
                this.icon1UI = icon2;
            }
            if(!v){
                this.removeUI(this.label1UI);
                this.removeUI(this.icon1UI);
                this.label1UI = null;
                this.icon1UI = null;
                return;
            }
            this.label1UI.data = v;
            this.invalidate();
        }
    }
});

//为了让此属性可以导入导出,需要在outputProperties中追加此属性名
Q.Edge.prototype.addOutProperty('flow');
Q.Edge.prototype.addOutProperty('flowIcon');
Q.Edge.prototype.addOutProperty('label1');