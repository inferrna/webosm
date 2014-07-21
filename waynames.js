function Waynames(){
    this.names = {};
    this.p = modules.ways;
    this.parse_itm = function(itm, node){
        for(var i=0; i<node.children.length; i++){
            var child = node.children[i];
            var id = node.getAttribute("id");
            if(child.tagName==='tag'){
                var k = child.getAttribute("k");
                if(k==='name') {
                    this.names[id] = {};
                    this.names[id].nm = child.getAttribute("v");
                    this.names[id].ver = itm.ver;
                    this.names[id].points = itm.points;
                    return 1;
                }
            }
        }
    }
    this.get_mesh = function(meshgroup){
        for(way in this.names){
            this.names[way].mesh = CTexturedText(this.names[way].nm, 0xffffff);
            meshgroup.add( this.names[way].mesh );
            this.names[way].mesh.position.z+=0.001;
        }
    }
    this.to_render = function(camera){
        for(way in this.names){
            var kv = nearest(this.names[way].points, [camera.position.x, camera.position.y]);
            //console.log(kv);
            var k = kv[0];
            var l = k===0 ? 1 : k - 1;
            var m = this.names[way].points[k > l ? k : l];
            var n = this.names[way].points[k > l ? l : k];
            var pos = linedist(m, n, [camera.position.x, camera.position.y]);
            var angle = Math.atan((m[1]-n[1])/(m[0]-n[0]));
            var scale = Math.min(Math.round(Math.abs(camera.position.z/8)), 8) || 1;
            var angle = Math.round((camera.rotation.z-angle)/Math.PI) == 0 ? angle : angle + Math.PI;
            this.names[way].mesh.scale.set(scale, scale, 1);
            this.names[way].mesh.position.x = pos[0];
            this.names[way].mesh.position.y = pos[1];
            this.names[way].mesh.rotation.z = angle;
        }
    }
}
modules.ways.modules.waynames = new Waynames();
