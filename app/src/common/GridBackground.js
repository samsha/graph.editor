function GridBackground(graph) {
    this.graph = graph;
    graph.onPropertyChange('viewport', this.update.bind(this));
    graph.onPropertyChange('transform', this.update.bind(this));

    this.canvas = Q.createCanvas(graph.width, graph.height, true);
    //this.canvas.style.backgroundColor = '#FFD';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0px';
    this.canvas.style['-webkit-user-select'] = 'none';
    this.canvas.style['-webkit-tap-highlight-color'] = 'rgba(0, 0, 0, 0)';

    this.scaleCanvas = Q.createCanvas(graph.width, graph.height, true);
    this.scaleCanvas.style.position = 'absolute';
    this.scaleCanvas.style.top = '0px';
    this.scaleCanvas.style['-webkit-user-select'] = 'none';
    this.scaleCanvas.style['-webkit-tap-highlight-color'] = 'rgba(0, 0, 0, 0)';

    graph.canvasPanel.insertBefore(this.canvas, graph.canvasPanel.firstChild);
    graph.canvasPanel.appendChild(this.scaleCanvas);

    this.update();
}

GridBackground.prototype = {
    update: function () {
        var graph = this.graph;
        var canvas = this.canvas;
        var scaleCanvas = this.scaleCanvas;
        graph.callLater(function () {
            canvas.setSize(graph.width, graph.height);
            canvas.width = canvas.width;//clear canvas
            scaleCanvas.setSize(graph.width, graph.height);
            scaleCanvas.width = canvas.width;//clear canvas

            var scale = graph.scale;
            var gap = 50 / scale;
            var currentCell = this.currentCell = 10 * (Math.round(gap / 10) || 1);

            scale = graph.scale * canvas.ratio;
            var bounds = graph.viewportBounds;
            var g = canvas.g;

            g.save();
            this._doTransform(g, scale, bounds);

            g.beginPath();
            var x = bounds.x, y = bounds.y, right = bounds.right, bottom = bounds.bottom;
            if (x % currentCell !== 0) {
                x -= (x % currentCell);
            }
            if (y % currentCell !== 0) {
                y -= (y % currentCell);
            }
            while (x < right) {
                g.moveTo(x, bounds.y);
                g.lineTo(x, bottom);
                x += currentCell;
            }
            while (y < bottom) {
                g.moveTo(bounds.x, y);
                g.lineTo(right, y);
                y += currentCell;
            }

            g.lineWidth = 1 / scale;
            g.strokeStyle = '#CCC';
            g.stroke();

            scaleCanvas.g.save();
            this._doTransform(scaleCanvas.g, scale, bounds);
            this.drawScales(scaleCanvas.g, bounds, scale, scaleCanvas.ratio);
            scaleCanvas.g.restore();

            g.restore();
        }, this);
    },
    _doTransform: function(g, scale, bounds){
        g.translate(-scale * bounds.x, -scale * bounds.y);
        g.scale(scale, scale);
    },
    drawText: function (g, text, x, y, fontSize, textAlign, textBaseline, rotate) {
        fontSize = fontSize || 7;
        g.save();
        var fontScale = 3;
        fontSize *= fontScale;
        g.font = 'normal ' + fontSize + 'px helvetica arial';
        g.fillStyle = '#555';
        g.textAlign = textAlign || 'center';
        g.textBaseline = textBaseline || 'top';
        g.translate(x, y);
        if (rotate) {
            g.rotate(rotate);
        }
        g.scale(1 / fontScale, 1 / fontScale);
        g.fillText(text, 0, 0);
        g.restore();
    },
    drawScales: function (g, bounds, scale, ratio) {
        g.beginPath();

        var scaleLength = 5 * ratio / scale;

        //g.moveTo(bounds.x, bounds.y);
        //g.lineTo(bounds.right, bounds.y);
        //g.moveTo(bounds.x, bounds.y);
        //g.lineTo(bounds.x, bounds.bottom);
        //
        //g.lineWidth = 5 / scale;
        //g.strokeStyle = '#2898E0';
        //g.stroke();

        var fontSize = 12 * ratio / scale;

        g.beginPath();
        var x = bounds.x;
        x = this.currentCell * Math.ceil(x / this.currentCell);
        while (x < bounds.right) {
            g.moveTo(x, bounds.y);
            g.lineTo(x, bounds.y + scaleLength + scaleLength);
            this.drawText(g, '' + x | 0, x, bounds.y + scaleLength + scaleLength, fontSize);
            x += this.currentCell;
        }
        var y = bounds.y;
        y = this.currentCell * Math.ceil(y / this.currentCell);
        while (y < bounds.bottom) {
            g.moveTo(bounds.x, y);
            g.lineTo(bounds.x + scaleLength + scaleLength, y);
            this.drawText(g, '' + y | 0, bounds.x + scaleLength + scaleLength, y, fontSize, 'center', 'top', -Math.PI / 6);
            y += this.currentCell;
        }
        g.lineWidth = 1 / scale;
        g.strokeStyle = '#000';
        g.stroke();
    }
}