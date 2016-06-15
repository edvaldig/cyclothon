/// <reference path="typings/index.d.ts" />
/// <reference path="typings/typings/globals/d3/index.d.ts" />
var mapdata = null;
var tree = null;

function distance(a, b) {
    var lat1 = a.latitude,
        lon1 = a.longitude,
        lat2 = b.latitude,
        lon2 = b.longitude;
    var rad = Math.PI/180;
    var dLat = (lat2-lat1)*rad;
    var dLon = (lon2-lon1)*rad;
    var lat1 = lat1*rad;
    var lat2 = lat2*rad;
    var x = Math.sin(dLat/2);
    var y = Math.sin(dLon/2);
    var a = x*x + y*y * Math.cos(lat1) * Math.cos(lat2); 
    return Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function buildMap(error, map) {
    for(var i = 0; i<map.length; i++) {
        var d = map[i];

        d.idx = parseInt(d.idx);
        d.distkm = parseFloat(d.distkm);
        d.distkmTotal = parseFloat(d.distkmTotal);
        d.distkmTotalFixed = parseFloat(d.distkmTotalFixed);
        d.elevation = parseFloat(d.elevation);
        d.latitude = parseFloat(d.latitude);
        d.longitude = parseFloat(d.longitude);
        d.x = parseFloat(d.x);
        d.y = parseFloat(d.y);
        d.z = parseFloat(d.z);
        d.xf = parseFloat(d.xf);
        d.yf = parseFloat(d.yf);
        d.pct = parseFloat(d.pct);
        d.prev = i > 0 ? map[i-1] : null;
        d.next = i == map.length ? null : map[i+1];
    }
    
    mapdata = map;
    
    var p = map[2];

    tree = new kdTree(mapdata, distance, ["latitude", "longitude"]);
    console.log(tree.nearest([p.latitude, p.longitude], 5));
    console.log(p);
}



queue()
	.defer(d3.csv, "map.csv")
	.await(buildMap);
