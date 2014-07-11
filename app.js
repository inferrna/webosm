var nodes = {};
var ways = {};
var buildings = {};
var srlzr = new XMLSerializer();
var parsr = new DOMParser();


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
    var id, lon, lat, nd;
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
        nds = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/nd");
        ways[id] = new Uint32Array(nds.map(function(res){return parseInt(res.getAttribute("ref"));}));
    }
    results = evaluateXPath(xml, "/osm/way[tag/@k='building']");
    for(i=0; i<results.length; i++){
        way = results[i];
        id = parseInt(way.getAttribute("id"));
        nds = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/nd");
        buildings[id] = new Uint32Array(nds.map(function(res){return parseInt(res.getAttribute("ref"));}));
    }
    //console.log(ways);
    //console.log(nds);
    draw_scene();
}


function CPath(points, color){
    //console.log(points);
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    moves = [[0,0]];
    for(var i=1; i<points.length; i++){
        moves.push(perpendicular2d(diff2d(points[i], points[i-1])));
        rectShape.lineTo(points[i][0], points[i][1]);
    }
    moves[0] = moves[1];
    for(var i=points.length-1; i>-1; i--){
        rectShape.lineTo(points[i][0]+moves[i][0]/10, points[i][1]+moves[i][1]/10);
    }
    rectShape.lineTo(points[0][0], points[0][1]);
    console.log(rectShape.toShapes(true, true));
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
function CExtr(points, height, color){
    //console.log(points);
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0], points[i][1]);
        //console.log("Line to "+points[i]);
    }
    //console.log("Line to "+points[0]);
    var rectGeom = new THREE.ExtrudeGeometry( rectShape, {
            steps: 1, size: 0.001, amount: 1, curveSegments: 3,
            bevelThickness: 0, bevelSize: 0.0, bevelEnabled: false,
            material: 1, extrudeMaterial: 0});
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: color } ) ) ;
    return rectMesh;
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

    shapes = THREE.FontUtils.generateShapes( "Привет", {
      font: "liberation sans",
      weight: "normal",
      size: 3
    } );
    geom = new THREE.ShapeGeometry( shapes );
    mat = new THREE.MeshBasicMaterial({color: 0xaa00ff});
    textMesh = new THREE.Mesh( geom, mat );
    textMesh.rotation.z = 1.99;
    var mshape = CShape(points, 0xaa00ff);
   // scene.add( mshape );
   // scene.add( textMesh );
    var i, nds, way, waypoints, ref, j=0;
    for(way in ways){
        waypoints = [];
        nds = ways[way];
        for(i=0; i<nds.length; i++){
            ref = nds[i];
            waypoints.push(nodes[ref]);
        }
        try {
            if(nds[0]===nds[nds.length-1]){
                //Shape
                scene.add( CShape(waypoints, Math.round(Math.random()*0xffffff)) );
            } else {
                //Path
                scene.add( CPath(waypoints, Math.round(Math.random()*0xffffff)) );
            }
        } catch (e){
            console.warn(e);
        }
    }
    for(way in buildings){
        waypoints = [];
        nds = buildings[way];
        for(i=0; i<nds.length; i++){
            ref = nds[i];
            waypoints.push(nodes[ref]);
        }
        try {
            scene.add( CExtr(waypoints, 0.001, Math.round(Math.random()*0xffffff)) );
        } catch (e){
            console.warn(e);
        }
        //if(j>9) break;
        //j+=1;
    }
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    camera.position.z = 15;
    camera.lookAt(scene.position);
    /*var options = {
          preventDefault: true
    };
    var hammertime = new Hammer(renderer.domElement, options);
    hammertime.on("dragleft dragright", function(evt){
            camera.position.x+=evt.gesture.deltaX/100;
        });
    hammertime.on("dragup dragdown", function(evt){
            camera.position.y+=evt.gesture.deltaY/100;
        });
    renderer.domElement.addEventListener('DOMMouseScroll', function(evt) {
            evt.preventDefault();
            console.log("Got event");
            console.log(evt);
        }, true);*/
    var x = 0;
    function render() {
        requestAnimationFrame(render);
        /*x+=0.03;
        x = x%(2*Math.PI);
        mshape.rotation.z += 0.01;
        mshape.rotation.x += 0.01;
        mshape.rotation.y += 0.01;
        camera.position.z += 0.4*Math.sin(x); */
        renderer.render(scene, camera); 
        controls.update();
    } 
    render();
}
