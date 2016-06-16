/// <reference path="../typings/globals/d3/index.d.ts" />
//import "./types.ts";

var mapdata = null;
var tree = null;
var teamdata = null;

var EARTH_RADIUS = 6371.0e3;

var markers = [
    {name:"Akureyri", latitude:65.700359, longitude:-18.141921, approx:null }
]; 

declare var queue : any;
declare var kdTree : any;


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
        debug:{p1,p2,t},
        distkmTotal:interpolateElement(p1, p2, x=>x.distkmTotal, t),
        distkmTotalFixed:interpolateElement(p1, p2, x=>x.distkmTotalFixed, t),
        pct:interpolateElement(p1, p2, x=>x.pct, t), 
        elevation:interpolateElement(p1, p2, x=>x.elevation, t),
        longitude: interpolateElement(p1, p2, x=>x.longitude, t),
        latitude: interpolateElement(p1, p2, x=>x.latitude, t)    
    };
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
            x:cart.x,
            y:cart.y,
            z:cart.z,
            nosignal:t.NoSignal, 
            speed:parseFloat(t.Speed.replace(',', '.')) };
    });
}

function approximatePosition(p, tree) {
    var n, dn;
    [n,dn] = tree.nearest(p, 1)[0];
    var dnn = n.next == null ? 1e9 : distance(p, n.next);
    var dnp = n.prev == null ? 1e9 : distance(p, n.prev);
    // console.log(`distance to closest: ${dn} meters`);
    // console.log(`distance to next: ${dnn} meters`);
    // console.log(`distance to previous: ${dnp} meters`);

    if(dnn < dnp) { // we're past n
        var t = dn / (dn + dnn);   
        return interpolateMapPoints(n.next, n, t);
    }    
    
    var t = dn / (dn + dnp);
    return interpolateMapPoints(n.prev, n, t);
 

}

function buildMap(error, map, teams) {
    mapdata = parseMapData(map);
    teamdata = parseTeamData(teams);
    
    tree = new kdTree(mapdata, distance, ["x", "y", "z"]);

    markers.forEach(x=>{
        x.approx = approximatePosition(x, tree);
    });


    teamdata.forEach(t=>{
        t.approx = approximatePosition(t, tree);

        t.pct = t.approx.pct;
    });

    teamdata = teamdata.filter(x=>x.categoryName == "Group B")
                       .sort((x,y)=>y.pct-x.pct)
                       .slice(1,15);

    var grid = new Array();
    for(var x=0; x<teamdata.length; x++) 
    {        
        var xdata = teamdata[x];
        for(var y=0; y<teamdata.length; y++ ) 
        {
            var ydata = teamdata[y];
            grid.push({
                x:x,
                y:y,
                xdata,
                ydata,
                distkm:xdata.approx.distkmTotal - ydata.approx.distkmTotal,
                distkmFixed:xdata.approx.distkmTotalFixed - ydata.approx.distkmTotalFixed
            });
        }
    }
    
    var distMax = d3.max(grid.map(x=>Math.abs(x.distkm)));
    var scale = d3.scale.sqrt().range(["dodgerblue","white"]).domain([0,distMax]);
    var percent = d3.format("%"),
        comma = d3.format(".1f");
    var rectSize = 50;
    var rects = d3.select("svg")
        .append("g")
        .attr("transform", "translate(200,0)")
        .attr("id", "grid");

    rects.selectAll("rect")
        .data(grid)
        .enter()
        .append("rect")
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("x", d=>{return d.x*rectSize; } )
        .attr("y", d=>d.y*rectSize)
        .style("stroke", "#202020")
        .style("stroke-width", "1px")
        .style("fill", d=>{
            if(d.x == d.y)
                return "white";
            
            return scale(d.distkm);
        })
        .on("mouseover", (d,i) => {
            d3.select("#teamTitleA").html(`${d.xdata.name}`);
            d3.select("#teamTitleB").html(`${d.ydata.name}`);   
            d3.select("#distanceA").html(`${Math.round(d.xdata.approx.distkmTotalFixed)}km`);
            d3.select("#distanceB").html(`${Math.round(d.ydata.approx.distkmTotalFixed)}km`);               
            d3.select("#pctA").html(`${percent(d.xdata.approx.pct)}`);
            d3.select("#pctB").html(`${percent(d.ydata.approx.pct)}`);
    
            d3.select("#togoalA").html(`${Math.round(d.xdata.approx.distkmTotalFixed/d.xdata.approx.pct - d.xdata.approx.distkmTotalFixed )}km`);
            d3.select("#togoalB").html(`${Math.round(d.ydata.approx.distkmTotalFixed/d.ydata.approx.pct - d.ydata.approx.distkmTotalFixed )}km`);      
            rects.selectAll("rect").style("opacity", p=> {
                return p.x == d.x || p.y == d.y ? 0.5 : 1; 
            });
        });

    rects.selectAll("text")
        .data(grid)
        .enter()
        .append("text")
        .attr("x", d=>{return d.x*rectSize + rectSize*0.5; } )
        .attr("y", d=>d.y*rectSize + rectSize*0.5)        
        .text(d=>{
          if(d.x < d.y)
            return `${comma(d.distkm)}km`;
          if(d.x == d.y)
            return `${percent(d.xdata.approx.pct)}`;
          return "";
        })
        .attr("text-anchor", "middle")
        .attr("dy",3);


    var scaleSize = teamdata.length*rectSize;
    var nameScale = d3.scale.ordinal().domain(teamdata.map(x=>x.name)).rangePoints([0,scaleSize],1);

    var xAxis = d3.svg.axis().scale(nameScale).orient("top").tickSize(0);    
    var yAxis = d3.svg.axis().scale(nameScale).orient("left").tickSize(0);    
    d3.select("#grid").append("g").attr("transform", `translate(0,${scaleSize})`).call(xAxis).selectAll("text").style("text-anchor", "start").attr("dy", 10).attr("dx",5).attr("transform", "rotate(90)");
    d3.select("#grid").append("g").call(yAxis).selectAll("text").attr("dx",-5);
}



queue()
	.defer(d3.csv, "map.csv")
    .defer(d3.json, "testdata.json")
    //.defer(d3.json, "https://live.at.is/Home/GetTeamListUpdate")
	.await(buildMap);


