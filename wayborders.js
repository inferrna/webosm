function Wayborders(){
    this.items = {};
    this.p = modules.ways;
    this.parse_itm = function(itm, node){
        var id = node.getAttribute("id");
        if(processed.ways.indexOf(id)>-1) return 0;
        for(var i=0; i<node.children.length; i++){
            var child = node.children[i];
            if(child.tagName==='tag'){
                var k = child.getAttribute("k");
                if(k==='barrier') {
                    this.items[id] = itm;
                    this.items[id].type = child.getAttribute("v");
                    processed.ways.push(id);
                    return 1;
                }
            }
        }
    }
    this.get_mesh = function(meshgroup){
        for(way in this.items){
            var shape = new THREE.Line(CLine(this.items[way].points),
                                       new THREE.LineBasicMaterial( { linewidth: 1.2, color: 0xff0000 } ));
            shape.position.z = 0.02;
            meshgroup.add( shape );
        }
    }
    this.to_render = function(camera){
        for(way in this.items){
        }
    }
}
modules.ways.modules.wayborders = new Wayborders();
