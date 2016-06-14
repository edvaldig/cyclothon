/// <reference path="typings/index.d.ts" />
/// <reference path="typings/typings/globals/d3/index.d.ts" />
var mapdata = null;


function buildMap(error, map) {
    for(var i = 0; i<map.length; i++) {
        var d = map[i];
        d.distkm = parseFloat(d.distkm);
        d.distkmTotal = parseFloat(d.distkmTotal);
        d.distkmTotalFixed = parseFloat(d.distkmTotalFixed);
        d.elevation = parseFloat(d.elevation);
        d.latitude = parseFloat(d.latitude);
        d.longitude = parseFloat(d.longitude);
        d.pct = parseFloat(d.pct);
        d.prev = i > 0 ? map[i-1] : null;
        d.next = i == map.length ? null : map[i+1];
    }
    
    mapdata = map;
    console.log(mapdata);
}



queue()
	.defer(d3.csv, "map.csv")
	.await(buildMap);
