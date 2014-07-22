function Wayshapes(){
    this.shapes = {};
    this.p = modules.ways;
    this.parse_itm = function(itm, node){
        if(itm.nodes[0] === itm.nodes[itm.nodes.length-1]){
            var id = node.getAttribute("id");
            this.shapes[id] = {};
            this.shapes[id].ver = itm.ver;
            this.shapes[id].points = itm.points;
            processed.ways.push(id);
        }
    }
    this.get_mesh = function(meshgroup){
        for(way in this.shapes){
            var shape = CMesh(CShape(this.shapes[way].points), Math.round(Math.random()*0xffffff));
            shape.position.z+= 0.001*this.shapes[way].ver;
            meshgroup.add( shape );
        }
    }
    this.to_render = function(camera){
        for(way in this.names){
        }
    }
}
modules.ways.modules.wayshapes = new Wayshapes();
