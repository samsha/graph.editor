var graph;

// {
//     shapes: ['M0,50L100,50,L100,150,L0,150Z', {fillColor: '#EEF', path: 'M0,50C0 0,100 0,100,50Z'}],
//     labels: [{
//         text: 'hello', color: '#E00',
//     }, {
//         text: 'Qunee',
//         color: '#555',
//         x: 0,
//         y: 20,
//         binding: [{
//             property: 'name',
//             propertyType: Q.Consts.PROPERTY_TYPE_CLIENT,
//             bindingProperty: "data"
//         }, {property: 'color', propertyType: Q.Consts.PROPERTY_TYPE_CLIENT, bindingProperty: "color"}]
//     }]
// }
function composeShape(nodes) {
    var shapes = [];
    var labels = [];

    var bounds = new Q.Rect();
    nodes.forEach(function (element) {
        bounds.add(graph.getUIBounds(element));
    })

    nodes.forEach(function (element) {
        var info = {
            // x: element.x - bounds.x,
            // y: element.y - bounds.y,
            // width: bounds.width,
            // height: bounds.height
        }
        if (element instanceof Q.ShapeNode) {
            info.path = Path2SVG(element.path, element.x - bounds.x, element.y - bounds.y);
            Q.log(info.path);
            shapes.push(info);
        } else if (element instanceof Q.Text) {
            info.text = element.name;
            labels.push(info);
        }
    })
    var node = new CustomNode({shapes: shapes, labels: labels, bounds: bounds});
    node.x = bounds.cx;
    node.y = bounds.cy;
    return node;
}

Q.SelectionInteraction.prototype.onstart2 = Q.SelectionInteraction.prototype.onstart;

function init() {
    var width = 50, height = 50;
    var shapes = Q.Shapes.getAllShapes(-width / 2, -height / 2, width, height);
    var images = [];
    for (var name in shapes) {
        var shape = shapes[name];
        images.push({
            image: shape,
            type: 'ShapeNode', styles: {
                // 'shape.stroke': 1,
                // 'shape.fill.color': null
            }, properties: {
                "path": shape
            },
        })
    }
    $('#editor').graphEditor({
        images: [{
            displayName: 'Default Shapes',
            images: images,
            close: false
        }],
        callback: function (editor) {
            editor.toolbox.hideDefaultGroups();
            graph = editor.graph;
            new GridBackground(graph);

            graph.popupmenu.getMenuItems = function (graph, data, evt) {
                var result = [];
                // result.unshift(Q.PopupMenu.Separator);

                if (graph.selectionModel.length) {
                    result.push({
                        text: '合并成图标', action: function () {
                            var node = composeShape(graph.selectionModel);

                            // graph.removeSelection();
                            graph.addElement(node);
                        }
                    })
                    result.push(Q.PopupMenu.Separator);
                }
                result.push({
                    text: '清空画布', action: function () {
                        graph.clear();
                    }
                })
                return result;
            }
        }
    })
}

init();
