/// <reference path="typings/index.d.ts" />
/// <reference path="typings/typings/globals/d3/index.d.ts" />
var mapdata = null;
var tree = null;

var EARTH_RADIUS = 6371.0e3;

function latlonToPoint(p) {
    var rad = Math.PI/180;
    var latr = p.latitude*rad;
    var lonr = p.longitude*rad;
    var x = EARTH_RADIUS*Math.cos(latr)*Math.cos(lonr),
        y = EARTH_RADIUS*Math.cos(latr)*Math.sin(lonr),
        z = EARTH_RADIUS*Math.sin(latr);

    return {x,y,z};
}

function distance2(a,b) {
    var x1 = a.x,
        x2 = b.x,
        y1 = a.y,
        y2 = b.y,
        z1 = a.z,
        z2 = b.z;

    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2) + Math.pow(z2-z1,2));

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
    
    var p = map[300];

    tree = new kdTree(mapdata, distance2, ["x", "y", "z"]);
    console.log(tree.nearest(latlonToPoint(p), 1)[0]);
    console.log(p);
}



queue()
	.defer(d3.csv, "map.csv")
	.await(buildMap);
