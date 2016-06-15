/// <reference path="typings/index.d.ts" />
/// <reference path="typings/typings/globals/d3/index.d.ts" />
var mapdata = null;
var tree = null;
var teamdata = null;

var EARTH_RADIUS = 6371.0e3;

var markers = [
    {name:"Akureyri", latitude:65.700359, longitude:-18.141921 }
] 



function latlonToPoint(p) {
    var rad = Math.PI/180;
    var latr = p.latitude*rad;
    var lonr = p.longitude*rad;
    var x = EARTH_RADIUS*Math.cos(latr)*Math.cos(lonr),
        y = EARTH_RADIUS*Math.cos(latr)*Math.sin(lonr),
        z = EARTH_RADIUS*Math.sin(latr);

    return {x,y,z};
}

function distance(a,b) {
    var x1 = a.x,
        x2 = b.x,
        y1 = a.y,
        y2 = b.y,
        z1 = a.z,
        z2 = b.z;

    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2) + Math.pow(z2-z1,2));

}

function interpolateElement(p1, p2, f, t) {
    return f(p1) * (t) + f(p2) * (1-t);
}

function interpolateMapPoints(p1, p2, t) {
    return {
        p1, 
        p2, 
        distkmTotal:interpolateElement(p1, p2, x=>x.distkmTotal, t),
        distkmTotalFixed:interpolateElement(p1, p2, x=>x.distkmTotalFixed, t),
        pct:interpolateElement(p1, p2, x=>x.pct, t), 
        elevation:interpolateElement(p1, p2, x=>x.elevation, t),
        longitude: interpolateElement(p1, p2, x=>x.longitude, t),
        latitude: interpolateElement(p1, p2, x=>x.latitude, t)    
    }
}

function parseMapData(map) {
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

    return map;
}

function parseTeamData(teams) {
    return teams.map(t=>{
        var lon = parseFloat(t.Longitude.replace(',', '.'));
        var lat = parseFloat(t.Latitude.replace(',', '.'));
        var cart = latlonToPoint({latitude:lat, longitude:lon});

        return {
            numberPlate:t.CarLicense,
            name:t.Description,
            category:t.Category,
            categoryName:t.CategoryName,
            longitude:lon,
            latitude:lat,
            cartesian:cart,
            x:cart.x,
            y:cart.y,
            z:cart.z,
            nosignal:t.NoSignal, 
            speed:parseFloat(t.Speed.replace(',', '.')) };
    });
}

function approximatePosition(p, tree) {
    var n, dn;
    var x = 'x' in p ? p : latlonToPoint(p);
    [n,dn] = tree.nearest(x, 1)[0];
    var dnn = n.next == null ? 1e9 : distance(x, n.next);
    var dnp = n.prev == null ? 1e9 : distance(x, n.prev);
    // console.log(`distance to closest: ${dn} meters`);
    // console.log(`distance to next: ${dnn} meters`);
    // console.log(`distance to previous: ${dnp} meters`);

    if(dnn < dnp) { // we're past n
        var t = dn / (dn + dnn);   
        return approx = interpolateMapPoints(n.next, n, t);
    } else { // we havent reached n 
        var t = dn / (dn + dnp);
        return approx = interpolateMapPoints(n.prev, n, t);
    } 

}

function buildMap(error, map, teams) {
    mapdata = parseMapData(map);
    teamdata = parseTeamData(teams);
    var p = teamdata[90];

    tree = new kdTree(mapdata, distance, ["x", "y", "z"]);
    
    var approx = approximatePosition(p, tree);

    markers.forEach(x=>{
        x.routePoint = approximatePosition(x, tree);
    });


    teamdata.forEach(t=>{
        t.approx = approximatePosition(t, tree);
    });
}



queue()
	.defer(d3.csv, "map.csv")
    .defer(d3.json, "testdata.json")
    //.defer(d3.json, "https://live.at.is/Home/GetTeamListUpdate")
	.await(buildMap);

