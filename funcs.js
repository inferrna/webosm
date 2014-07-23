var srlzr = new XMLSerializer();
var parsr = new DOMParser();
var xpe = new XPathEvaluator();
if(!Math.sign) Math.sign = function(x){return x/Math.abs(x);};

function evaluateXPath(aNode, aExpr) {
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
                                        aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  return result;
}

function normalize2d(v)
{
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    if (length === 0.0)
    {
        v[0] = v[1] = 0.0;
        return 0.0;
    }
    v[0] /= length;
    v[1] /= length;
    return length;
}

function perpendicular2d(v)
{
    var pos = 0;
    var minelem = 1;
    if (Math.abs(v[0]) < minelem)
    {
        pos = 0;
        minelem = Math.abs(v[0]);
    }
    if (Math.abs(v[1]) < minelem)
    {
        pos = 1;
        minelem = Math.abs(v[1]);
    }
    var tempvec = [0.0, 0.0];
    tempvec[pos] = 1.0;
    var inv_denom = 1.0 / (v[0] * v[0] + v[1] * v[1]);
    var d = (tempvec[0] * v[0] + tempvec[1] * v[1]) * inv_denom;
    var dst = [
        tempvec[0] - d * v[0] * inv_denom,
        tempvec[1] - d * v[1] * inv_denom,
    ];
    normalize2d(dst);
    return dst;
}

function diff2d(v1, v2){
    var res = new Float32Array(2);
    res[0] = v2[0] - v1[0];
    res[1] = v2[1] - v1[1];
    return res;
}

function nearest(points, point){
    var diff, dist, j=0, nextmin, lastmin, min = 9999999;
    var trend = 0;
    for(var i=0; i<points.length; i++){
        diff = diff2d(points[i], point);
        dist = (Math.pow(diff[0], 2)+Math.pow(diff[1], 2));
        if(dist<min){
            lastmin = min;
            min = dist;
            j = i;
        } else {
            nextmin = dist;
            break;
        }
    }
    //return [j, points[j]];
    if(j===0 || j===points.length-1) {
        return [j, points[j], min];
    }
    var near = Math.sqrt(Math.min(lastmin, nextmin));
    min = Math.sqrt(min);
    var sign = lastmin > nextmin ? 1: -1;
    var c = min/(near+min);
    var _res = diff2d(points[j], points[j+sign]);
    var res = [points[j][0] + sign*_res[0]*c, points[j][1] + sign*_res[1]*c];
    return [j, res, min];
}

function simpleperp(v, desired_length) {
    var length = Math.max(Math.abs(v[0]) + Math.abs(v[1]));
    var scale_factor = desired_length / length;
    return [-scale_factor * v[1], scale_factor * v[0]];
}

function linedist(p, q, x){
//Find equation Ax+By+C=0 from points p and q
    var a = p[1] - q[1];
    var b = q[0] - p[0];
    var c = -a*p[0] - b*p[1];
    //Find nearest point
    var res = [];
    res[0] = (b*(b*x[0]-a*x[1])-a*c)/(a*a+b*b);
    res[1] = (a*(-b*x[0]+a*x[1])-b*c)/(a*a+b*b);
    var d1 = diff2d(p, q);
    var d1x = diff2d(res, q);
    if(Math.sign(d1[0])!==Math.sign(d1x[0]) || Math.sign(d1[1])!==Math.sign(d1x[1])) return q;
    var d2 = [-d1[0], -d1[1]];
    var d2x = diff2d(res, p);
    if(Math.sign(d2[0])!==Math.sign(d2x[0]) || Math.sign(d2[1])!==Math.sign(d2x[1])) return p;
    return res;
}
