Q.Graph.prototype.copy = function () {
    var selection = this.selectionModel.toDatas();
    this._copyElements = selection;
}
Q.Graph.prototype.paste = function (dx, dy) {
    if (!this._copyElements) {
        return;
    }
    dx = dx || 0;
    dy = dy || 0;
    var elements = {};//找出相关的图元，相连的节点，孩子节点，连线的两个端点等
    function addElement(e){
        if(elements[e.id]){
            return;
        }
        elements[e.id] = e;
        if (e.hasChildren()) {
            e.forEachChild(addElement)
        }
        if(e instanceof Q.Edge){
            addElement(e.from);
            addElement(e.to);
        }
    }
    graph.selectionModel.forEach(addElement);

    //找出所有需要复制的连线，两个端点被选中时，连线也一起复制
    for(var id in elements){
        var e = elements[id];
        if(e instanceof Q.Node && e.hasEdge()){
            e.forEachEdge(function(edge){
                var otherNode = edge.otherNode(e);
                if(otherNode && elements[otherNode.id]){
                    elements[edge.id] = edge;
                }
            })
        }
    }

    var json = this.exportJSON(true, {filter: function(e){
        return e.id in elements
    }.bind(this)})

    var clones = this.parseJSON(json);
    clones.forEach(function(clone){
        if(clone instanceof Q.Node){
            clone.x = clone.x + dx;
            clone.y = clone.y + dy;
        }
    })

    graph.setSelection(clones);
}
function override(clazz, methodName, overrideMethod){
    var _super = clazz.prototype[methodName];
    clazz.prototype[methodName] = function(){
        _super.apply(this, arguments);
        return overrideMethod.apply(this, arguments);
    }
}

override(Q.EditInteraction, 'onkeydown', function(evt, graph){
    var code = evt.keyCode;
    if (!Q.isMetaKey(evt)) {
        return;
    }
    if (code == 67) {
        graph.copy();
    } else if (code == 86) {
        graph.paste(20, 20);
    } else if (code == 90) {
//            graph.undo();
    } else if (code == 89) {
//            graph.redo();
    } else {
        return;
    }
    Q.stopEvent(evt);
})