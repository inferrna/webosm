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
    var results = evaluateXPath(xml, "/osm/node");
    console.log(results);
    var nd = results[0];
    console.log(nd.getAttribute("id"));
}


function CShape(points, color){
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0], points[i][1]);
        console.log("Line to "+points[i]);
    }
    console.log("Line to "+points[0]);
    rectShape.lineTo(points[0][0], points[0][1]);
    var rectGeom = new THREE.ShapeGeometry( rectShape );
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: color } ) ) ;
    return rectMesh;
}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var rectWidth = 0.8;
var rectLength = 1.9;
var points = [  [0,0],
                [0, rectWidth*2],
                [rectLength/2, rectWidth*2], 
                [rectLength/2, rectWidth],
                [rectLength, rectWidth],
                [rectLength, 0]];

var mshape = CShape(points, 0xaa00ff);
scene.add( mshape );
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
