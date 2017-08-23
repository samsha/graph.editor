function SVGtoPathSegment(path, svgSegment, prevPoints, matrix, currentPoint, scale, tx, ty) {
    tx = tx || 0;
    ty = ty || 0;
    svgSegment = svgSegment.trim();
    var isLowerLetter = svgSegment[0] > "Z";
    var type = svgSegment[0].toUpperCase();

    var points = svgSegment.substring(1);
    if (points) {
        points = points.replace(/[^,]-/g, ' -').replace(/  /g, ' ').replace(/, -/g, ',-');
        points = points.trim().split(/[\s,]/g);

        var prevX = 0, prevY = 0;
        if (points.length && isLowerLetter) {
            prevX = prevPoints[prevPoints.length - 2];
            prevY = prevPoints[prevPoints.length - 1];
        }

        if (type == 'H') {
            points[1] = isLowerLetter ? 0 : prevPoints[prevPoints.length - 1];
            type = 'L';
        } else if (type == 'V') {
            points[1] = points[0];
            points[0] = isLowerLetter ? 0 : prevPoints[prevPoints.length - 2];
            type = 'L';
        }

        var x, y;
        for (var i = 0, l = points.length; i < l; i++) {
            points[i] = parseFloat(points[i]);
            var isX = i % 2 == 0;
            if (!isLowerLetter) {
                if (isX) {
                    points[i] += tx;
                } else {
                    points[i] += ty;
                }
            }
            if (scale && scale != 1) {
                points[i] *= scale;
            }
            if (isX) {
                x = points[i];
            } else {
                y = points[i];
                if (matrix) {
                    var p = matrix.translatePoint(x, y);
                    points[i - 1] = p.x;
                    points[i] = p.y;
                }
                if (prevX || prevY) {
                    points[i - 1] += prevX;
                    points[i] += prevY;
                }
                if (isLowerLetter) {
                    if (type == "C") {
                        if (i >= 5 && (i + 1) % 6 == 0) {
                            prevX = points[i - 1];
                            prevY = points[i];
                        }
                    } else if (type == "L") {
                        if (i >= 1 && (i + 1) % 2 == 0) {
                            prevX = points[i - 1];
                            prevY = points[i];
                        }
                    }
                }
            }
        }
    }
    switch (type) {
        case "M" :
            currentPoint.x = points[0];
            currentPoint.y = points[1];
            path.moveTo(points[0], points[1]);
            break;
        case "L" :
            path.lineTo(points[0], points[1]);
            break;
        case "Z" :
            path.closePath();
            break;
        case "Q" :
            path.quadTo(points[0], points[1], points[2], points[3]);
            break;
        case "C" :
            var i = 0;
            while (i < points.length) {
                path.curveTo(points[i + 0], points[i + 1], points[i + 2], points[i + 3], points[i + 4], points[i + 5]);
                i += 6;
            }
            break;
    }
    return points;
}
var pathSegmentPattern = /[a-z][^a-z]*/ig;
function SVGPathToPath(d, m, scale, tx, ty) {
    var path = new Q.Path();
    var segments = d.match(pathSegmentPattern);
    var points;
    if (m && !m.translatePoint) {
        m.translatePoint = Matrix.prototype.translatePoint;
    }
    var currentPoint = {};
    Q.forEach(segments, function (segment, index) {
        points = SVGtoPathSegment(path, segment, points, m, currentPoint, scale, tx, ty) || points;
    });
    return path;
}

function transformPath(path, tx, ty, scale) {
    path.segments.forEach(function (segment) {
        var points = segment.points;
        if (!points) {
            return;
        }
        for (var i = 0, l = points.length; i < l; i += 2) {
            var x = points[i];
            var y = points[i + 1];

            points[i] = x * scale + tx;
            points[i + 1] = y * scale + ty;
        }
    })
    path.validate();
}

/**
 * @param path Q.Path
 * @constructor
 */
function Path2SVG(path, tx, ty) {
    tx = tx || 0;
    ty = ty || 0;
    function toString(points){
        var points2 = [];
        points.forEach(function(p, index){
            p += index % 2 ? ty : tx;
            points2.push(p.toFixed(4))
        })
        return points2.join(',');
    }
    function toSVGPath(pathSegment){
        var type = pathSegment.type;
        var points = pathSegment.points;
        if (type == Q.Consts.SEGMENT_MOVE_TO) {
            return 'M' + toString(points);
        }
        if (type == Q.Consts.SEGMENT_LINE_TO) {
            return 'L' + toString(points);
        }
        if (type == Q.Consts.SEGMENT_CLOSE) {
            return 'Z';
        }
    }
    var svg = "";
    path.segments.forEach(function (segment) {
        var d = toSVGPath(segment);
        if(d){
            svg += d;
        }
    })
    return svg;
}