var nodes = {};
var buildings = {};
var waynames = {};
var anisotropy;
// canvas contents will be used for a texture
// var texture = new THREE.Texture(bitmap) 
// texture.needsUpdate = true;

function handleFiles(files) {
    var file = files[0]; /* now you can work with the file list */
    var Reader = new FileReader();
    Reader.onload = function(evt) {
        parse_nodes(evt.target.result);
    };
    Reader.readAsText(file);
}

function parse_nodes(map){
    var xml = parsr.parseFromString(map, 'text/xml');
    var bounds = evaluateXPath(xml, "/osm/bounds").iterateNext();
    var minlat = parseFloat(bounds.getAttribute("minlat"));
    var minlon = parseFloat(bounds.getAttribute("minlon"));
    var maxlat = parseFloat(bounds.getAttribute("maxlat"));
    var maxlon = parseFloat(bounds.getAttribute("maxlon"));
    var clon = maxlon-minlon;
    var clat = maxlat-minlat;
    var coeff = 500000;
    console.log("coeff == "+coeff);
    var results = evaluateXPath(xml, "/osm/node");
    var id, lon, lat, nd, ver, lvl, _lvl, _name, name;
    while(nd = results.iterateNext()){
        id = parseInt(nd.getAttribute("id"));
        lon = (parseFloat(nd.getAttribute("lon")) - minlon - clon/2) * coeff;
        lat = (parseFloat(nd.getAttribute("lat")) - minlat - clat/2) * coeff;
        nodes[id] = new Float32Array([lat/32, lon/32]);
        delete nd;
    }
    delete results;
    console.log("Nodes done");
    modules.ways.from_xml(xml);
    console.log("Ways done");
    modules.buildings.from_xml(xml);
    console.log("Buildings done");
    //console.log(ways);
    //console.log(nds);
    draw_scene();
}



function draw_scene(){
    
    var meshgroup = new THREE.Object3D();
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    var renderer = new THREE.WebGLRenderer();
    renderer.sortObjects = false;
    renderer.setClearColor( 0xaaaaaa );
    renderer.setSize( window.innerWidth, window.innerHeight );
    anisotropy = Math.pow(2, Math.log2(renderer.getMaxAnisotropy())-1);
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
    modules.ways.get_mesh(meshgroup);
    modules.buildings.get_mesh(meshgroup);
    scene.add( meshgroup );
    camera.position.z = 50;
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.minDistance = 0;
    controls.maxDistance = 5000;
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 16;
    controls.panSpeed = 16;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    camera.lookAt(scene.position);
    scene.add( new THREE.AmbientLight( 0x222222 ) );
    light = new THREE.PointLight( 0xffffaa );
    light.position = camera.position;
    scene.add( light );
    var x = 0;
    function render() {
        requestAnimationFrame(render);
        modules.ways.to_render(camera);
        modules.buildings.to_render(camera);
        renderer.render(scene, camera); 
        controls.update();
    } 
    render();
}
