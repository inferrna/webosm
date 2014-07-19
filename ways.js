modules.ways = {};
modules.ways.items = {};
modules.ways.from_xml = function(xml){
    var nds, child, way, results = evaluateXPath(xml, "/osm/way[not(tag/@k='building')]");
    while(way = results.iterateNext()){
        //if(parseInt(way.getAttribute("version"))>3) continue;
        id = parseInt(way.getAttribute("id"));
        if(processed.ways.indexOf(id) > -1) continue;
        ver = parseInt(way.getAttribute("version"));
        var tmpway = {};
        nds = [];
        for(var i=0; i<way.children.length; i++){
            child = way.children[i];
            if(child.tagName==='nd') nds.push(parseInt(child.getAttribute("ref")));
            else if(child.tagName==='tag'){
                    var k = child.getAttribute("k");
                    if(k==='name')         tmpway.name = child.getAttribute("v");
                    else if(k==='landuse') tmpway.landuse = child.getAttribute("v");
                    else if(k==='barrier') tmpway.barrier = child.getAttribute("v");
                    else if(k==='leisure') tmpway.leisure = child.getAttribute("v");
                }
        }
        tmpway.nodes = new Uint32Array(nds);
        tmpway.ver = ver;
        modules.ways.items[id] = tmpway;
        processed.ways.push(id);
        delete way;
    }
    delete results;
}

modules.ways.get_mesh = function(meshgroup){
    var wayshapes = [];
    for(way in modules.ways.items){
        var waypoints = [];
        nds = modules.ways.items[way].nodes;
        for(i=0; i<nds.length; i++){
            ref = nds[i];
            waypoints.push(nodes[ref]);
        }
        try {
            if(nds[0]===nds[nds.length-1]){
                //Shape
                var shape = CMesh(CShape(waypoints), Math.round(Math.random()*0xffffff));
                shape.position.z+=0.001*modules.ways.items[way].ver;
                meshgroup.add( shape );
            } else {
                //Path
                modules.ways.items[way].points = waypoints;
                wayshapes.push(CPath(waypoints));
                if(modules.ways.items[way].name){
                    modules.ways.items[way].namemesh = CTexturedText(modules.ways.items[way].name, 0xffffff);
                    meshgroup.add( modules.ways.items[way].namemesh );
                    modules.ways.items[way].namemesh.position.z+=0.001*(modules.ways.items[way].ver+1);
                }
            }
        } catch (e){
            console.warn(e);
        }
    }
    meshgroup.add( CMesh(wayshapes, Math.round(Math.random()*0xffffff)) );
}

modules.ways.to_render = function(camera){
    for(way in modules.ways.items){
        if(modules.ways.items[way].namemesh){
            var kv = nearest(modules.ways.items[way].points, [camera.position.x, camera.position.y]);
            //console.log(kv);
            var k = kv[0];
            var l = k===0 ? 1 : k - 1;
            var m = modules.ways.items[way].points[k > l ? k : l];
            var n = modules.ways.items[way].points[k > l ? l : k];
            var pos = linedist(m, n, [camera.position.x, camera.position.y]);
            var angle = Math.atan((m[1]-n[1])/(m[0]-n[0]));
            var scale = Math.min(Math.round(Math.abs(camera.position.z/8)), 8) || 1;
            angle = Math.round((camera.rotation.z-angle)/Math.PI) == 0 ? angle : angle + Math.PI;
            modules.ways.items[way].namemesh.scale.set(scale, scale, 1);
            modules.ways.items[way].namemesh.position.x = pos[0];
            modules.ways.items[way].namemesh.position.y = pos[1];
            modules.ways.items[way].namemesh.rotation.z = angle;
        }
    }
}
