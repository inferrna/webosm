function CPath(points, thin){
    //console.log("Path from");
    //console.log(points);
    var v;
    var rectShape = new THREE.Shape();
    moves = [[0,0]];
    for(var i=1; i<points.length; i++){
        v = simpleperp(diff2d(points[i], points[i-1]), -thin);
        moves.push(v);
    }
    moves[0] = moves[1];
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
function CLine(points){
    var geometry = new THREE.Geometry();
    for(var i=0; i<points.length; i++){
        geometry.vertices.push(new THREE.Vector3( points[i][0], points[i][1], 0 ));    
    }
    geometry.computeLineDistances();
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    return geometry;
}
function CBorder(points){
    var thinu, thinb, _thin = 1;
    var geometry = new THREE.Geometry();
    for(var i=0; i<points.length-1; i++){
        thinu = (i%2) * _thin;
        thinb = ((i+1)%2) * _thin;
        geometry.vertices.push(new THREE.Vector3( points[i][0], points[i][1], thinu ));    
        geometry.vertices.push(new THREE.Vector3( points[i+1][0], points[i+1][1], thinu ));    
        geometry.vertices.push(new THREE.Vector3( points[i][0], points[i][1], thinb ));
        geometry.faces.push( new THREE.Face3( i*3+0, i*3+1, i*3+2 ) );
    }
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();
    geometry.computeFaceNormals();
    console.log(geometry);
    return geometry;
}
function CShape(points){
    //console.log("Shape from");
    //console.log(points);
    var rectShape = new THREE.Shape();
    rectShape.moveTo(points[0][0], points[0][1]);
    for(var i=1; i<points.length; i++){
        rectShape.lineTo(points[i][0], points[i][1]);
    }
    return rectShape;
}
function CMesh(shapes, color){
    var rectGeom = new THREE.ShapeGeometry( shapes );
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshBasicMaterial( { color: color } ) ) ;
    return rectMesh;
}
function CExtr(shapes, height, color, lvl){
    console.log("Extrude to "+lvl+" lvl");
    var vcs = [new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, parseFloat(lvl) )];
    var curve = new THREE.SplineCurve3(vcs);
    var rectGeom = new THREE.ExtrudeGeometry( shapes, {
            steps: 1, size: 0.00001, amount: lvl, curveSegments: 1,
            bevelThickness: 0, bevelSize: 0.0, bevelEnabled: false,
            material: 1, extrudeMaterial: 0});
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshPhongMaterial( { color: color } ) ) ;
    rectMesh.matrixAutoUpdate = false;
    rectMesh.updateMatrix();
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

function CTexturedText(text, color){
    var bitmap = document.createElement('canvas');
    var ctx = bitmap.getContext('2d');
    bitmap.height = 32*4;
    bitmap.width = bitmap.height*text.length;
    /*ctx.width = ctx.width;
    ctx.translate(0, bitmap.height);
    ctx.scale(1, -1);*/
    ctx.font = "40px 'Helvetica'";
    var h = bitmap.height/4;
    var w = bitmap.width/4;
    ctx.rect(0, 0, bitmap.width, bitmap.height);
    ctx.fillStyle = "rgba(255, 120, 240, 0.0)";;
    ctx.fill();
    ctx.fillStyle = '#330055';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.scale(1,1);
    ctx.fillText(text, bitmap.width/2, bitmap.height/2);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, bitmap.width/2, bitmap.height/2);
    var texture = new THREE.Texture(bitmap);
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    texture.anisotropy = anisotropy;
    console.log("anisotropy == "+anisotropy);
    var rectGeom = new THREE.PlaneGeometry(w, h);
    var rectMesh = new THREE.Mesh( rectGeom, new THREE.MeshPhongMaterial( { color: 0xfffeed, map: texture, transparent: true } ) ) ;
    delete ctx; delete bitmap;
    return rectMesh;
}
