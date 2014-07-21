function Ways(){
    this.items = {};
    this.modules = {}; //I have to go deeper.
    this.from_xml = function(xml){
        var nds, child, way, results = evaluateXPath(xml, "/osm/way[not(tag/@k='building')]");
        while(way = results.iterateNext()){
            //if(parseInt(way.getAttribute("version"))>3) continue;
            id = parseInt(way.getAttribute("id"));
            if(processed.ways.indexOf(id) > -1) continue;
            ver = parseInt(way.getAttribute("version"));
            var tmpway = {};
            nds = [];
            tmpway.ver = ver;
            for(var i=0; i<way.children.length; i++){
                child = way.children[i];
                if(child.tagName==='nd') nds.push(parseInt(child.getAttribute("ref")));
            }
            var waypoints = [];
            for(i=0; i<nds.length; i++){
                ref = nds[i];
                waypoints.push(nodes[ref]);
            }
            tmpway.nodes = new Uint32Array(nds);
            tmpway.points = waypoints;
            this.modules.waynames.parse_itm(tmpway, way);
            /*for(var i=0; i<way.children.length; i++){
                child = way.children[i];
                if(child.tagName==='tag'){
                    var k = child.getAttribute("k");
                    if(k==='name')         tmpway.name = child.getAttribute("v");
                    else if(k==='landuse') tmpway.landuse = child.getAttribute("v");
                    else if(k==='barrier') tmpway.barrier = child.getAttribute("v");
                    else if(k==='leisure') tmpway.leisure = child.getAttribute("v");
                }
            }*/
            if(!(id in processed.ways)) this.items[id] = tmpway;
            processed.ways.push(id);
            delete way;
        }
        delete results;
    }

    this.get_mesh = function(meshgroup){
        var wayshapes = [];
        this.modules.waynames.get_mesh(meshgroup);
        for(way in this.items){
            try {
                if(this.items[way].nodes[0]===this.items[way].nodes[nds.length-1]){
                    //Shape
                    var shape = CMesh(CShape(this.items[way].points), Math.round(Math.random()*0xffffff));
                    shape.position.z+=0.001*this.items[way].ver;
                    meshgroup.add( shape );
                } else {
                    //Path
                    wayshapes.push(CPath(this.items[way].points));
                }
            } catch (e){
                console.warn(e);
            }
        }
        meshgroup.add( CMesh(wayshapes, Math.round(Math.random()*0xffffff)) );
    }

    this.to_render = function(camera){
        this.modules.waynames.to_render(camera);
    }
}
modules.ways = new Ways();
