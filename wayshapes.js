function Wayshapes(){
    this.items = {};
    this.p = modules.ways;
    this.parse_itm = function(itm, node){
        if(itm.nodes[0] === itm.nodes[itm.nodes.length-1]){
            var id = node.getAttribute("id");
            this.items[id] = itm;
            processed.ways.push(id);
        }
    }
    this.get_mesh = function(meshgroup){
        for(way in this.items){
            var shape = CMesh(CShape(this.items[way].points), Math.round(Math.random()*0xffffff));
            shape.position.z+= 0.001*this.items[way].ver;
            meshgroup.add( shape );
        }
    }
    this.to_render = function(camera){
        for(way in this.items){
        }
    }
}
modules.ways.modules.wayshapes = new Wayshapes();
