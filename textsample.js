var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
var shapes, geom, mat, textMesh;
shapes = THREE.FontUtils.generateShapes( "Hello world", {
  font: "helvetiker",
  weight: "bold",
  size: 10
} );
shapes.computeBoundingBox();
geom = new THREE.ShapeGeometry( shapes );
mat = new THREE.MeshBasicMaterial();
textMesh = new THREE.Mesh( geom, mat );

scene.add( textMesh );
camera.position.z = 5;
var x = 0;
function render() {
    requestAnimationFrame(render);
    x+=0.03;
    x = x%(2*Math.PI);
    camera.position.z += 0.4*Math.sin(x); 
    renderer.render(scene, camera); 
} 
render();
