var nodes = {};
var ways = {};
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
    var nds, way, results = evaluateXPath(xml, "/osm/way");
    for(i=0; i<results.length; i++){
        way = results[i];
        id = parseInt(way.getAttribute("id"));
        nds = evaluateXPath(xml, "/osm/way[@id=\'"+id+"\']/nd");
        ways[id] = new Uint32Array(nds.map(function(res){return parseInt(res.getAttribute("ref"));}));
    }
    //console.log(ways);
    //console.log(nds);
    draw_scene();
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
    rectShape.lineTo(points[0][0], points[0][1]);
    var rectGeom = new THREE.ShapeGeometry( rectShape );
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
    scene.add( mshape );
    scene.add( textMesh );
    var i, nds, way, waypoints, ref, j=0;
    for(way in ways){
        waypoints = [];
        nds = ways[way];
        for(i=0; i<nds.length-1; i++){
            ref = nds[i];
            waypoints.push(nodes[ref]);
        }
        scene.add( CShape(waypoints, 0xcc55ff) );
        if(j>9) break;
        j+=1;
        //if(mshape) scene.add( mshape );
    }
    camera.position.z = 5;
    var x = 0;
    function render() {
        requestAnimationFrame(render);
        x+=0.03;
        x = x%(2*Math.PI);
        mshape.rotation.z += 0.01;
        mshape.rotation.x += 0.01;
        mshape.rotation.y += 0.01;
        camera.position.z += 0.4*Math.sin(x); 
        renderer.render(scene, camera); 
    } 
    render();
}
