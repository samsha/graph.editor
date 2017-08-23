
////////////
////以下内容是从http://demo.qunee.com/#VOIP Demo 中截取的, 用于展示如何自定节点的信息展示
var BarUI = function(data){
    Q.doSuperConstructor(this, BarUI, arguments);
}

BarUI.prototype = {
    width: 100,
    height: 12,
    measure: function(){
        this.setMeasuredBounds(this.width, this.height);
    },
    draw: function(g, scale, selected){
        var value = this.data * 100 | 0;
        var data = this.data;
        if(data > 1){
            data = 1;
        }else if(data < 0){
            data = 0;
        }
        var color;
        if(value < 40){
            color = "#0F0";
        }else if(value < 70){
            color = "#FF0";
        }else{
            color = "#F00";
        }
        g.fillStyle = color;
        var w = data * this.width;
        g.fillRect(0, 0, w, this.height);
        g.beginPath();
        g.strokeStyle = "#CCC";
        g.strokeRect(0, 0, this.width, this.height);
        g.fillStyle = "#555";
        g.textBaseline = "middle";
        if(value > 83){
            g.textAlign = "right";
            g.fillText(value, this.width - 1, this.height / 2);
            return;
        }
        g.fillText(value, w + 3, this.height / 2);
    }
}
Q.extend(BarUI, Q.BaseUI);
Q.BarUI = BarUI;
Q.loadClassPath(BarUI, 'Q.BarUI');

function formatNumber(number, decimal, unit){
    return number.toFixed(decimal) + unit;
}

function CustomServerNode(name, id, image, data){
    data = data || {cpu: Math.random(), memory: Math.random(), incoming: Math.random(), outgoing: Math.random()}
    Q.doSuperConstructor(this, CustomServerNode);

    this.init(name, id, image);

    this.set("cpu", data.cpu);
    this.set("memory", data.memory);
    this.set("incoming", formatNumber(data.incoming, 2, "GB"));
    this.set("outgoing", formatNumber(data.outgoing, 2, "GB"));

    this.showDetail = false;

}
var w = 140, h = 120, r = 10;
CustomServerNode.prototype = {
    _showDetail: true,
    iconSize: {width: 23},
    shape: Q.Shapes.getRect(-w/2, -h/2, w, h, r, r),
    init: function(name, id, image){
        this.set("image", image);
        this.set("id", id);
        this.set("name", name);
        //this.name = "Double click show detail";

        this.image = this.shape;
        var gradient = new Q.Gradient(Q.Consts.GRADIENT_TYPE_LINEAR, ["#F4F4F4", "#FFFFFF", "#DFDFDF", "#E9E9E9"]);
        gradient.angle = Math.PI / 2;
        this.setStyle(Q.Styles.SHAPE_FILL_GRADIENT, gradient);
        this.setStyle(Q.Styles.SHAPE_STROKE, 0);
        this.setStyle(Q.Styles.SHAPE_OUTLINE, 1);
        this.setStyle(Q.Styles.SHAPE_OUTLINE_STYLE, "#C9C9C9");
        this.setStyle(Q.Styles.LAYOUT_BY_PATH, false);

        function addUIAt(node, ui, x, y, bindingProperty, value){
            ui.syncSelection = false;
            ui.zIndex = 1;
            ui.position = {x: x, y: y};
            ui.anchorPosition = Q.Position.LEFT_TOP;
            ui.fontSize = 10;
            var binding;
            if(bindingProperty){
                binding = {
                    property : bindingProperty,
                    propertyType : Q.Consts.PROPERTY_TYPE_CLIENT,
                    bindingProperty : "data"
                }
            }
            node.addUI(ui, binding);
            return ui;
        }

        var icon = new Q.ImageUI(image);
        icon.size = this.iconSize;
        addUIAt(this, icon, 15, 12, "icon").anchorPosition = Q.Position.CENTER_MIDDLE;

        addUIAt(this, new Q.LabelUI(name), 30, 5);
        addUIAt(this, new Q.LabelUI(id), 30, 22).color = "#D00";

        addUIAt(this, new Q.LabelUI("CPU"), 27, 47).anchorPosition = Q.Position.RIGHT_MIDDLE;
        addUIAt(this, new Q.LabelUI("MEM"), 27, 65).anchorPosition = Q.Position.RIGHT_MIDDLE;
        addUIAt(this, new BarUI(), 30, 47, "cpu").anchorPosition = Q.Position.LEFT_MIDDLE;
        addUIAt(this, new BarUI(), 30, 65, "memory").anchorPosition = Q.Position.LEFT_MIDDLE;

        addUIAt(this, new Q.LabelUI("Incoming:"), 71, 90).anchorPosition = Q.Position.RIGHT_MIDDLE;
        addUIAt(this, new Q.LabelUI("Outgoing:"), 71, 106).anchorPosition = Q.Position.RIGHT_MIDDLE;
        var ui = addUIAt(this, new Q.LabelUI(), 75, 90, "incoming");
        ui.anchorPosition = Q.Position.LEFT_MIDDLE;
        ui.color = "#C20";
        ui = addUIAt(this, new Q.LabelUI(), 75, 106, "outgoing");
        ui.anchorPosition = Q.Position.LEFT_MIDDLE;
        ui.color = "#C20";
    }
}
Q.extend(CustomServerNode, Q.Node);

Object.defineProperties(CustomServerNode.prototype, {
    showDetail: {
        get: function(){
            return this._showDetail;
        },
        set: function(show){
            if(this._showDetail == show){
                return;
            }
            this._showDetail = show;

            this.image = show ? this.shape : this.get("image");
            //this.name = show ? getI18NString('Double click merge') : (this.get("name") + "\n" + this.get("id"));
            var uis = this.bindingUIs;
            if(uis){
                uis.forEach(function(ui){
                    ui.ui.visible = show;
                })
                this.invalidate();
            }
        }
    }
})