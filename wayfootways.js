function Wayfootways(){
    this.items = {};
    this.p = modules.ways;
    this.parse_itm = function(itm, node){
        var id = node.getAttribute("id");
        if(processed.ways.indexOf(id)>-1){
            console.warn("Already processed");
            return;
        }
        for(var i=0; i<node.children.length; i++){
            var child = node.children[i];
            if(child.tagName==='tag'){
                var k = child.getAttribute("k");
                if(k==='highway'){
                    if(child.getAttribute("v")==='footway'){
                        this.items[id] = itm;
                        processed.ways.push(id);
                        return;
                    }
                }
            }
        }
    }
    this.get_mesh = function(meshgroup){
        var wayshapes = [];
        for(way in this.items){
            wayshapes.push(CPath(this.items[way].points));
        }
        meshgroup.add( CMesh(wayshapes, 0xffaa66) );
    }
    this.to_render = function(camera){
        for(way in this.names){
        }
    }
}
modules.ways.modules.wayfootways = new Wayfootways();
