function Buildings(){
    this.items = {};
    this.modules = {}; //I have to go deeper.
    this.from_xml = function(xml){
        var nds, child, way, lvl, results = evaluateXPath(xml, "/osm/way[tag/@k='building']");
        while(way = results.iterateNext()){
            //if(parseInt(way.getAttribute("version"))>3) continue;
            id = parseInt(way.getAttribute("id"));
            if(processed.ways.indexOf(id) > -1) continue;
            ver = parseInt(way.getAttribute("version"));
            var tmpway = {};
            nds = [];
            tmpway.ver = ver;
            lvl = 1;
            for(var i=0; i<way.children.length; i++){
                child = way.children[i];
                if(child.tagName==='nd') nds.push(parseInt(child.getAttribute("ref")));
                else if(child.tagName==='tag')
                    if(child.getAttribute("k")==='building:levels') lvl = parseInt(child.getAttribute("v"));
            }
            var waypoints = [];
            for(i=0; i<nds.length; i++){
                ref = nds[i];
                waypoints.push(nodes[ref]);
            }
            tmpway.nodes = new Uint32Array(nds);
            tmpway.points = waypoints;
            tmpway.lvl = lvl;
            for(mid in this.modules){
                this.modules[mid].parse_itm(tmpway, way);
            }
            if(processed.ways.indexOf(id)===-1) {
                this.items[id] = tmpway;
                processed.ways.push(id);
            }
            delete way;
        }
        delete results;
    }

    this.get_mesh = function(meshgroup){
        var lvls = {};
        for(way in this.items){
            waypoints = [];
            nds = this.items[way].nodes;
            for(i=0; i<nds.length; i++){
                ref = nds[i];
                waypoints.push(nodes[ref]);
            }
            if(!lvls[this.items[way].lvl]) lvls[this.items[way].lvl] = [];
            lvls[this.items[way].lvl].push(CShape(waypoints));
        }
        for(lvl in lvls) meshgroup.add( CExtr(lvls[lvl], 0.001, Math.round(Math.random()*0xffffff), lvl) );
    }

    this.to_render = function(camera){
        for(mid in this.modules){
            this.modules[mid].to_render(camera);
        }
    }
}
modules.buildings = new Buildings();
