$(function () {

    Q.registerImage('lamp', Q.Shapes.getShape(Q.Consts.SHAPE_CIRCLE, -8, -8, 16, 16));

    var lampGradient = new Q.Gradient(Q.Consts.GRADIENT_TYPE_RADIAL, [Q.toColor(0xAAFFFFFF), Q.toColor(0x33EEEEEE), Q.toColor(0x44888888), Q.toColor(0x33666666)],
        [0.1, 0.3, 0.7, 0.9], 0, -0.2, -0.2);

    function createLampStyles(color) {
        var styles = {};
        styles[Q.Styles.SHAPE_FILL_COLOR] = color;
        styles[Q.Styles.SHAPE_STROKE] = 0.5;
        styles[Q.Styles.SHAPE_STROKE_STYLE] = '#CCC';
        styles[Q.Styles.LABEL_BACKGROUND_COLOR] = '#FF0';
        styles[Q.Styles.SHAPE_FILL_COLOR] = color;
        styles[Q.Styles.LABEL_SIZE] = {width: 100, height: 20};
        styles[Q.Styles.LABEL_PADDING] = 5;
        styles[Q.Styles.LABEL_OFFSET_Y] = -10;
        styles[Q.Styles.SHAPE_FILL_GRADIENT] = lampGradient;
        styles[Q.Styles.LABEL_POSITION] = Q.Position.CENTER_TOP;
        styles[Q.Styles.LABEL_ANCHOR_POSITION] = Q.Position.LEFT_BOTTOM;
        return styles;
    }

    $('.graph-editor').graphEditor({
        data: 'data/topo2.json',
        //data: 'data',
        //saveService: 'save',
        images: [
            {name: 'Custom Images', images: graphs},
            {
                name: 'Cisco图标',
                root: 'data/cisco/',
                images: ['ATMSwitch.png', 'multilayerSwitch.png', 'workgroupSwitch.png', 'workgroupSwitchSubdued.png', '100BaseT_hub.png', 'cisco_hub.png', 'switch1100.png']
            },{
            name: '自定义图标',
            imageWidth: 30,
            imageHeight: 30,
            images: [{
                image: 'lamp',
                properties: {
                    name: 'Message'
                },
                styles: createLampStyles('#F00')
            }, {
                image: 'lamp',
                properties: {
                    name: 'Message'
                },
                br: true,
                styles: createLampStyles('#FF0')
            }, {
                image: 'lamp',
                properties: {
                    name: 'Message'
                },
                styles: createLampStyles('#0F0')
            }, {
                image: 'lamp',
                properties: {
                    name: 'Message'
                },
                styles: createLampStyles('#0FF')
            }, {
                image: 'lamp',
                properties: {
                    name: 'Message'
                },
                styles: createLampStyles('#00F')
            }, {
                image: 'lamp',
                properties: {
                    name: 'Message'
                },
                styles: createLampStyles('#F0F')
            }]
        }],
        callback: function(editor){
            var graph = editor.graph;

            var defaultStyles = graph.styles = {};
            defaultStyles[Q.Styles.ARROW_TO] = false;

            graph.moveToCenter()

            var background = new GridBackground(graph);

            var currentCell = 10;

            function snapToGrid(x, y) {
                var gap = currentCell;
                x = Math.round(x / gap) * gap;
                y = Math.round(y / gap) * gap;
                return [x, y];
            }

            graph.interactionDispatcher.addListener(function (evt) {
                if (evt.kind == Q.InteractionEvent.ELEMENT_MOVE_END) {
                    var datas = evt.datas;
                    datas.forEach(function (node) {
                        if (!(node instanceof Q.Node) || node instanceof Q.Group) {
                            return
                        }
                        var ps = snapToGrid(node.x, node.y);
                        node.setLocation(ps[0], ps[1]);
                    });
                    return;
                }
                if (evt.kind == Q.InteractionEvent.POINT_MOVE_END) {
                    var line = evt.data;
                    Q.log(evt.point);
                    var segment = evt.point.segment;
                    segment.points = snapToGrid(segment.points[0], segment.points[1]);
                    line.invalidate();
                    return;
                }
                if (evt.kind == Q.InteractionEvent.ELEMENT_CREATED) {
                    var node = evt.data;
                    if (!(node instanceof Q.Node)) {
                        return
                    }
                    var ps = snapToGrid(node.x, node.y);
                    node.setLocation(ps[0], ps[1]);
                    return;
                }

            });
        }
    });
});
