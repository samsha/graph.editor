function CustomImage(shapes, bounds) {
    this.cachable = false;
    this.fillColor = Q.toColor(0x88EEEEEE);
    this.strokeStyle = '#555';
    this.lineWidth = 0.5;
    if(bounds){
        this.width = bounds.width;
        this.height = bounds.height;
    }
    var drawables = this._drawables = [];
    shapes.forEach(function (shapeInfo) {
        if (Q.isString(shapeInfo)) {
            shapeInfo = {path: shapeInfo}
        }
        shapeInfo.shape = SVGPathToPath(shapeInfo.path)
        drawables.push(shapeInfo);
    })
}

CustomImage.prototype.draw = function (g) {
    // g.translate(10, 10);
    this._drawables.forEach(function (drawable) {
        g.save();
        g.translate(drawable.x || 0, drawable.y || 0);
        var styles = {
            fillColor: this.fillColor,
            strokeStyle: this.strokeStyle,
            lineWidth: this.lineWidth,
            lineDash: this.lineDash,
        }
        if ('fillColor' in drawable) {
            styles.fillColor = drawable.fillColor;
        }
        if ('strokeStyle' in drawable) {
            styles.strokeStyle = drawable.strokeStyle;
        }
        if ('lineWidth' in drawable) {
            styles.lineWidth = drawable.lineWidth;
        }
        if ('lineDash' in drawable) {
            styles.lineDash = drawable.lineDash;
        }
        if(styles.lineDash){
            g.setLineDash(styles.lineDash)
        }
        drawable.shape.draw(g, 1, styles);

        g.restore();
    }.bind(this))
}

function CustomNode(drawableInfo) {
    Q.doSuperConstructor(this, CustomNode);
//        this.anchorPosition = {x: 0, y: 0}
    if(drawableInfo.shapes){
        this.image = new CustomImage(drawableInfo.shapes, drawableInfo.bounds);
    }
    if(drawableInfo.labels){
        drawableInfo.labels.forEach(function (label) {
            var text = Q.isString(label) ? label : label.text;
            var labelUI = new Q.LabelUI(text);

            //控制label的位置，默认是居中，下面的代码是左上角
            labelUI.anchorPosition = label.anchorPosition || Q.Position.CENTER_MIDDLE;
            labelUI.position = label.position || Q.Position.CENTER_MIDDLE;

            if (label.color) {
                labelUI.color = label.color;
            }
            if (label.x) {
                labelUI.offsetX = label.x;
            }
            if (label.y) {
                labelUI.offsetY = label.y;
            }
            this.addUI(labelUI, label.binding);
        }.bind(this))
    }
}
CustomNode.prototype = {}
Q.extend(CustomNode, Q.Node);