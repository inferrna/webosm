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
            for(mid in this.modules){
                this.modules[mid].parse_itm(tmpway, way);
            }
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
            if(processed.ways.indexOf(id)===-1) {
                this.items[id] = tmpway;
                processed.ways.push(id);
            }
            delete way;
        }
        delete results;
    }

    this.get_mesh = function(meshgroup){
        var wayshapes = [];
        for(mid in this.modules){
            this.modules[mid].get_mesh(meshgroup);
        }
        for(way in this.items){
            try {

                //Path
                wayshapes.push(CPath(this.items[way].points));
            } catch (e){
                console.warn(e);
            }
        }
        meshgroup.add( CMesh(wayshapes, Math.round(Math.random()*0xffffff)) );
    }

    this.to_render = function(camera){
        for(mid in this.modules){
            this.modules[mid].to_render(camera);
        }
    }
}
modules.ways = new Ways();
