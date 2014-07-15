var nodes = {};
var ways = {};
var buildings = {};
var srlzr = new XMLSerializer();
var parsr = new DOMParser();
var xpe = new XPathEvaluator();
var captions = [];

function handleFiles(files) {
    var file = files[0]; /* now you can work with the file list */
    var Reader = new FileReader();
    Reader.onload = function(evt) {
        parse_nodes(evt.target.result);
    };
    Reader.readAsText(file);
}

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
        dist = Math.pow(diff[0], 2)+Math.pow(diff[1], 2);
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
        return [j, points[j]];
    }
    var near = Math.min(lastmin, nextmin);
    var sign = lastmin > nextmin ? 1: -1;
    var c = min/(near+min);
    var _res = diff2d(points[j], points[j+sign]);
    var res = [points[j][0] + sign*_res[0]*c, points[j][1] + sign*_res[1]*c];
    return [j, res];
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

function parse_nodes(map){
    var xml = parsr.parseFromString(map, 'text/xml');
    var bounds = evaluateXPath(xml, "/osm/bounds").iterateNext();
    var minlat = parseFloat(bounds.getAttribute("minlat"));
    var minlon = parseFloat(bounds.getAttribute("minlon"));
    var maxlat = parseFloat(bounds.getAttribute("maxlat"));
    var maxlon = parseFloat(bounds.getAttribute("maxlon"));
    var clon = window.innerWidth/(maxlon-minlon);
    var clat = window.innerHeight/(maxlat-minlat);
    var coeff = Math.min(clon, clat);
    var results = evaluateXPath(xml, "/osm/node");
    var id, lon, lat, nd, ver, lvl, _lvl, _name, name;
    while(nd = results.iterateNext()){
        id = parseInt(nd.getAttribute("id"));
        lon = (parseFloat(nd.getAttribute("lon")) - minlon) * coeff - window.innerWidth/2;
        lat = (parseFloat(nd.getAttribute("lat")) - minlat) * coeff - window.innerHeight/2;
        nodes[id] = new Float32Array([lat/32, lon/32]);
        delete nd;
    }
    delete results;
    console.log("Nodes done");
    var nds, child, way, results = evaluateXPath(xml, "/osm/way[not(tag/@k='building')]");
    while(way = results.iterateNext()){
        id = parseInt(way.getAttribute("id"));
        ver = parseInt(way.getAttribute("version"));
        _name = 'noname';
        ways[id] = {};
        nds = [];
        for(var i=0; i<way.children.length; i++){
            child = way.children[i];
            if(child.tagName==='nd') nds.push(parseInt(child.getAttribute("ref")));
            else if(child.tagName==='tag')
                    if(child.getAttribute("k")==='name') _name = child.getAttribute("v");
        }
        ways[id].nodes = new Uint32Array(nds);
        ways[id].ver = parseInt(ver);
        ways[id].name = _name;
        delete way;
    }
    delete results;
    console.log("Ways done");
    results = evaluateXPath(xml, "/osm/way[tag/@k='building']");
    while(way = results.iterateNext()){
        id = parseInt(way.getAttribute("id"));
        lvl = 1;
        buildings[id] = {};
        nds = [];
        for(var i=0; i<way.children.length; i++){
            child = way.children[i];
            if(child.tagName==='nd') nds.push(parseInt(child.getAttribute("ref")));
            else if(child.tagName==='tag')
                    if(child.getAttribute("k")==='building:levels') lvl = parseInt(child.getAttribute("v"));
        }
        buildings[id].lvl = lvl;
        buildings[id].nodes = new Uint32Array(nds);
        delete way;
    }
    delete results;
    console.log("Buildings done");
    //console.log(ways);
    //console.log(nds);
    draw_scene();
}


function CPath(points){
    //console.log(points);
    var v, thin = 0.2;
    var rectShape = new THREE.Shape();
    moves = [[0,0]];
    for(var i=1; i<points.length; i++){
        v = simpleperp(diff2d(points[i], points[i-1]), -thin);
        moves.push(v);
    }
    moves[0] = moves[1];
    //console.log(moves);
    rectShape.moveTo(points[0][0]-moves[0][0], points[0][1]-moves[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0]-moves[i][0], points[i][1]-moves[i][1]);
    }
    for(var i=points.length-1; i>-1; i--){
        rectShape.lineTo(points[i][0]+moves[i][0], points[i][1]+moves[i][1]);
    }
    rectShape.lineTo(points[0][0]-moves[0][0], points[0][1]-moves[0][1]);
    return rectShape;
}
function CShape(points){
    //console.log(points);
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0], points[i][1]);
        //console.log("Line to "+points[i]);
    }
    return rectShape;
    //console.log("Line to "+points[0]);
}
function CMesh(shapes, color){
    var rectGeom = new THREE.ShapeGeometry( shapes );
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: color } ) ) ;
    return rectMesh;
}
function CExtr(points, height, color, lvl){
    //console.log(points);
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0], points[i][1]);
        //console.log("Line to "+points[i]);
    }
    //console.log("Line to "+points[0]);
    var rectGeom = new THREE.ExtrudeGeometry( rectShape, {
            steps: lvl, size: 0.001, amount: lvl, curveSegments: 3,
            bevelThickness: 0, bevelSize: 0.0, bevelEnabled: false,
            material: 1, extrudeMaterial: 0});
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: color } ) ) ;
    return rectMesh;
}

function CText(text, color){
    var shapes = THREE.FontUtils.generateShapes( text, {
      font: "liberation sans",
      weight: "normal",
      size: 0.38
    } );
    var geom = new THREE.ShapeGeometry( shapes );
    var mat = new THREE.MeshBasicMaterial({color: color});
    return new THREE.Mesh( geom, mat );
}

function draw_scene(){
    
    
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    var rectWidth = 8;
    var rectLength = -10;
    var points = [  new Float32Array([0,0]),
                    new Float32Array([0, rectWidth*2]),
                    new Float32Array([rectLength/2, rectWidth*2]), 
                    new Float32Array([rectLength/2, rectWidth]),
                    new Float32Array([rectLength, rectWidth]),
                    new Float32Array([rectLength, 0])];
    var shapes, geom, mat, textMesh;

    var mshape = CShape(points, 0xaa00ff);
   // scene.add( mshape );
   // scene.add( textMesh );
    var i, nds, way, waypoints, ref, j=0;
    console.log(ways);
    var wayshapes = [];
    for(way in ways){
        waypoints = [];
        nds = ways[way].nodes;
        for(i=0; i<nds.length; i++){
            ref = nds[i];
            waypoints.push(nodes[ref]);
        }
        try {
            if(nds[0]===nds[nds.length-1]){
                //Shape
                var shape = CMesh(CShape(waypoints), Math.round(Math.random()*0xffffff));
                scene.add( shape );
                shape.position.z+=0.001*ways[way].ver;
            } else {
                //Path
                ways[way].points = waypoints;
                wayshapes.push(CPath(waypoints));
                ways[way].namemesh = CText(ways[way].name, 0xffffff);
                scene.add( ways[way].namemesh );
                ways[way].namemesh.position.z+=0.001*(ways[way].ver+1);
            }
        } catch (e){
            console.warn(e);
        }
    }
    var shape = CMesh(wayshapes, Math.round(Math.random()*0xffffff));
    scene.add( shape );
    for(way in buildings){
        waypoints = [];
        nds = buildings[way].nodes;
        for(i=0; i<nds.length; i++){
            ref = nds[i];
            waypoints.push(nodes[ref]);
        }
        try {
            scene.add( CExtr(waypoints, 0.001, Math.round(Math.random()*0xffffff), buildings[way].lvl) );
        } catch (e){
            console.warn(e);
        }
        //if(j>9) break;
        //j+=1;
    }
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    camera.position.z = 15;
    camera.lookAt(scene.position);
    var x = 0;
    function render() {
        requestAnimationFrame(render);
        /*x+=0.03;
        x = x%(2*Math.PI);
        mshape.rotation.z += 0.01;
        mshape.rotation.x += 0.01;
        mshape.rotation.y += 0.01;
        camera.position.z += 0.4*Math.sin(x); */
        for(way in ways){
            if(ways[way].namemesh){
                var kv = nearest(ways[way].points, [camera.position.x, camera.position.y]);
                //console.log(kv);
                var k = kv[0];
                var l = k===0 ? 1 : k - 1;
                var m = ways[way].points[k > l ? k : l];
                var n = ways[way].points[k > l ? l : k];
                var pos = linedist(m, n, [camera.position.x, camera.position.y]);
                var angle = (m[1]-n[1])/(m[0]-n[0]);
                ways[way].namemesh.position.x = pos[0];
                ways[way].namemesh.position.y = pos[1];
                ways[way].namemesh.rotation.z = Math.atan(angle);
            }
        }
        renderer.render(scene, camera); 
        controls.update();
    } 
    render();
}
