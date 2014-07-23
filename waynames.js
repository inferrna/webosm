function Waynames(){
    this.items = {};
    this.p = modules.ways;
    this.parse_itm = function(itm, node){
        for(var i=0; i<node.children.length; i++){
            var id = node.getAttribute("id");
            var child = node.children[i];
            if(child.tagName==='tag'){
                var k = child.getAttribute("k");
                if(k==='name') {
                    this.items[id] = {};
                    this.items[id].nm = child.getAttribute("v");
                    this.items[id].ver = itm.ver;
                    this.items[id].points = itm.points;
                    return 1;
                }
            }
        }
    }
    this.get_mesh = function(meshgroup){
        for(way in this.items){
            this.items[way].mesh = CTexturedText(this.items[way].nm, 0xffffff);
            meshgroup.add( this.items[way].mesh );
            this.items[way].mesh.position.z+=0.001;
        }
    }
    this.to_render = function(camera){
        for(way in this.items){
            if(camera.position.z > 100){
                this.items[way].mesh.visible = false;
            } else {
                var kv = nearest(this.items[way].points, [camera.position.x, camera.position.y]);
                //if(!kv[2] || kv[2] === undefined) return;
                if(kv[2]>64) {
                    this.items[way].mesh.visible = false;
                    continue;
                } else {
                    var k = kv[0];
                    var l = k===0 ? 1 : k - 1;
                    var m = this.items[way].points[k > l ? k : l];
                    var n = this.items[way].points[k > l ? l : k];
                    var pos = linedist(m, n, [camera.position.x, camera.position.y]);
                    var angle = Math.atan((m[1]-n[1])/(m[0]-n[0]));
                    var scale = (Math.min(Math.round(Math.pow(camera.position.z/6, 2)), 8) || 1)/16;
                    var angle = Math.round((camera.rotation.z-angle)/Math.PI) == 0 ? angle : angle + Math.PI;
                    this.items[way].mesh.scale.set(scale, scale, 1);
                    this.items[way].mesh.position.x = pos[0];
                    this.items[way].mesh.position.y = pos[1];
                    this.items[way].mesh.rotation.z = angle;
                    this.items[way].mesh.visible = true;
                }
            }
        }
    }
}
modules.ways.modules.waynames = new Waynames();
