var nodes = {};
var ways = {};
var buildings = {};
var srlzr = new XMLSerializer();
var parsr = new DOMParser();
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
  var xpe = new XPathEvaluator();
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
    aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
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
    if(j===0 || j===points.length-1) return [j, points[j]];
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

function linedist(a, b, c){
    var n = [];
    n[1] = -(b[0] - a[0]);
    n[0] = (b[1] - a[1]);
    normalize2d(n); //нормуль
    var ac = diff2d(c, a);
    return Math.sqrt(n[0]*ac[0]+n[1]*ac[1]); // где * - скалярное произведение
}

function parse_nodes(map){
    var xml = parsr.parseFromString(map, 'text/xml');
    var bounds = evaluateXPath(xml, "/osm/bounds")[0];
    var minlat = parseFloat(bounds.getAttribute("minlat"));
    var minlon = parseFloat(bounds.getAttribute("minlon"));
    var maxlat = parseFloat(bounds.getAttribute("maxlat"));
    var maxlon = parseFloat(bounds.getAttribute("maxlon"));
    var clon = window.innerWidth/(maxlon-minlon);
    var clat = window.innerHeight/(maxlat-minlat);
    var coeff = Math.min(clon, clat);
    var results = evaluateXPath(xml, "/osm/node");
    var id, lon, lat, nd, ver, lvl, _lvl, _name, name;
    for(var i=0; i<results.length; i++){
        nd = results[i];
        id = parseInt(nd.getAttribute("id"));
        lon = (parseFloat(nd.getAttribute("lon")) - minlon) * coeff - window.innerWidth/2;
        lat = (parseFloat(nd.getAttribute("lat")) - minlat) * coeff - window.innerHeight/2;
        nodes[id] = new Float32Array([lat/32, lon/32]);
    }
    var nds, way, results = evaluateXPath(xml, "/osm/way[not(tag/@k='building')]");
    for(i=0; i<results.length; i++){
        way = results[i];
        id = parseInt(way.getAttribute("id"));
        _name = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/tag[@k='name']/@v");
        _name = _name[0] && _name[0].value ? _name[0].value : "noname";
        console.log(_name);
        nds = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/nd");
        ver = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/@version")[0].value;
        console.log(ver);
        ways[id] = {};
        ways[id].nodes = new Uint32Array(nds.map(function(res){return parseInt(res.getAttribute("ref"));}));
        ways[id].ver = parseInt(ver);
        ways[id].name = _name;
    }
    results = evaluateXPath(xml, "/osm/way[tag/@k='building']");
    for(i=0; i<results.length; i++){
        way = results[i];
        id = parseInt(way.getAttribute("id"));
        _lvl = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/tag[@k='building:levels']/@v");
        nds = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/nd");
        lvl = _lvl[0] && _lvl[0].value ? parseInt(_lvl[0].value) : 1;
        buildings[id] = {};
        buildings[id].lvl = lvl ? lvl : 1;
        buildings[id].nodes = new Uint32Array(nds.map(function(res){return parseInt(res.getAttribute("ref"));}));
    }
    //console.log(ways);
    //console.log(nds);
    draw_scene();
}


function CPath(points, color){
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
    //console.log(rectShape.toShapes(true, true));
    var rectGeom = new THREE.ShapeGeometry( rectShape );
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: color } ) ) ;
    return rectMesh;
}
function CShape(points, color){
    //console.log(points);
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0], points[i][1]);
        //console.log("Line to "+points[i]);
    }
    //console.log("Line to "+points[0]);
    var rectGeom = new THREE.ShapeGeometry( rectShape );
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
                var shape = CShape(waypoints, Math.round(Math.random()*0xffffff));
            } else {
                //Path
                ways[way].points = waypoints;
                var shape = CPath(waypoints, Math.round(Math.random()*0xffffff));
                ways[way].namemesh = CText(ways[way].name, 0xffffff);
                scene.add( ways[way].namemesh );
                ways[way].namemesh.position.z+=0.001*(ways[way].ver+1);
            }
            scene.add( shape );
            shape.position.z+=0.001*ways[way].ver;
        } catch (e){
            console.warn(e);
        }
    }
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
                var angle = (m[1]-n[1])/(m[0]-n[0]);
                ways[way].namemesh.position.x = ways[way].points[k][0];
                ways[way].namemesh.position.y = ways[way].points[k][1];
                ways[way].namemesh.rotation.z = Math.atan(angle);
            }
        }
        renderer.render(scene, camera); 
        controls.update();
    } 
    render();
}
