/// <reference path="../typings/globals/d3/index.d.ts" />
//import "./types.ts";
var mapdata = null;
var tree = null;
var teamdata = null;
var groupb = null;
var EARTH_RADIUS = 6371.0e3;
var markers = [
    { name: "Akureyri", latitude: 65.700359, longitude: -18.141921, approx: null }
];
var dformat = d3.time.format("%d.%m.%Y %H:%M:%S");
var groupColor = d3.scale.category10();
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
    return "<span style=\"color:" + groupColor(d.category) + "\">" + d.name + "</span>";
});
function latlonToPoint(p) {
    var rad = Math.PI / 180;
    var latr = p.latitude * rad;
    var lonr = p.longitude * rad;
    var x = EARTH_RADIUS * Math.cos(latr) * Math.cos(lonr), y = EARTH_RADIUS * Math.cos(latr) * Math.sin(lonr), z = EARTH_RADIUS * Math.sin(latr);
    return { x: x, y: y, z: z };
}
function distance(a, b) {
    var x1 = a.x, x2 = b.x, y1 = a.y, y2 = b.y, z1 = a.z, z2 = b.z;
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
}
function interpolateElement(p1, p2, f, t) {
    return f(p1) * (t) + f(p2) * (1 - t);
}
function interpolateMapPoints(p1, p2, t) {
    return {
        debug: { p1: p1, p2: p2, t: t },
        distkmTotal: interpolateElement(p1, p2, function (x) { return x.distkmTotal; }, t),
        distkmTotalFixed: interpolateElement(p1, p2, function (x) { return x.distkmTotalFixed; }, t),
        pct: interpolateElement(p1, p2, function (x) { return x.pct; }, t),
        elevation: interpolateElement(p1, p2, function (x) { return x.elevation; }, t),
        longitude: interpolateElement(p1, p2, function (x) { return x.longitude; }, t),
        latitude: interpolateElement(p1, p2, function (x) { return x.latitude; }, t)
    };
}
function parseMapData(map) {
    for (var i = 0; i < map.length; i++) {
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
        d.prev = i > 0 ? map[i - 1] : null;
        d.next = i == map.length ? null : map[i + 1];
    }
    return map;
}
function parseTeamData(teams) {
    return teams.map(function (t) {
        var lon = parseFloat(t.Longitude.replace(',', '.'));
        var lat = parseFloat(t.Latitude.replace(',', '.'));
        var cart = latlonToPoint({ latitude: lat, longitude: lon });
        return {
            numberPlate: t.CarLicense,
            name: t.Description,
            category: t.Category,
            categoryName: t.CategoryName,
            longitude: lon,
            latitude: lat,
            x: cart.x,
            y: cart.y,
            z: cart.z,
            nosignal: t.NoSignal,
            time: dformat.parse(t.LastTime),
            speed: parseFloat(t.Speed.replace(',', '.')),
            finals: null };
    });
}
function approximatePosition(p, tree) {
    var n, dn;
    _a = tree.nearest(p, 1)[0], n = _a[0], dn = _a[1];
    var dnn = n.next == null ? 1e9 : distance(p, n.next);
    var dnp = n.prev == null ? 1e9 : distance(p, n.prev);
    // console.log(`distance to closest: ${dn} meters`);
    // console.log(`distance to next: ${dnn} meters`);
    // console.log(`distance to previous: ${dnp} meters`);
    if (dnn < dnp) {
        var t = dn / (dn + dnn);
        return interpolateMapPoints(n.next, n, t);
    }
    var t = dn / (dn + dnp);
    return interpolateMapPoints(n.prev, n, t);
    var _a;
}
function makeDistanceMatrix(teamdata, elementID, colors) {
    var grid = new Array();
    for (var x = 0; x < teamdata.length; x++) {
        var xdata = teamdata[x];
        for (var y = 0; y < teamdata.length; y++) {
            var ydata = teamdata[y];
            grid.push({
                x: x,
                y: y,
                xdata: xdata,
                ydata: ydata,
                distkm: xdata.approx.distkmTotal - ydata.approx.distkmTotal,
                distkmFixed: xdata.approx.distkmTotalFixed - ydata.approx.distkmTotalFixed
            });
        }
    }
    var distMax = d3.max(grid.map(function (x) { return Math.abs(x.distkm); }));
    var scale = d3.scale.sqrt().range(colors).domain([0, distMax]);
    var percent = d3.format("%"), comma = d3.format(".1f");
    var rectWidth = 65, rectHeight = 50;
    var rects = d3.select(elementID)
        .append("g")
        .attr("transform", "translate(180,150)");
    rects.selectAll("rect")
        .data(grid)
        .enter()
        .append("rect")
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("x", function (d) { return d.x * rectWidth; })
        .attr("y", function (d) { return d.y * rectHeight; })
        .style("stroke", "#202020")
        .style("stroke-width", "1px")
        .style("fill", function (d) {
        if (d.x == d.y)
            return "white";
        return scale(Math.abs(d.distkm));
    })
        .style("opacity", function (d) {
        return (d.xdata.finals != null | d.ydata.finals != null) ? 0.2 : 1;
    })
        .on("mouseover", function (d, i) {
        d3.select(elementID).selectAll(".xlab").style("font-weight", function (p) {
            return p == d.xdata.name ? "bolder" : "normal";
        }).style("opacity", function (p) {
            return p == d.xdata.name ? 1 : 0.7;
        });
        d3.select(elementID).selectAll(".ylab").style("font-weight", function (p) {
            return p == d.ydata.name ? "bolder" : "normal";
        }).style("opacity", function (p) {
            return p == d.ydata.name ? 1 : 0.7;
        });
        d3.selectAll("circle").transition().duration(500).attr("transform", function (p) {
            return "translate(0," + (p.name == d.xdata.name ? -10 : 0) + ")";
        }).attr("r", function (p) {
            return p.name == d.xdata.name ? 5 : 3;
        });
    });
    rects.selectAll("text")
        .data(grid)
        .enter()
        .append("text")
        .attr("x", function (d) { return (d.x + 0.5) * rectWidth; })
        .attr("y", function (d) { return (d.y + 0.5) * rectHeight; })
        .text(function (d) {
        if (d.x == d.y) {
            if (d.xdata.finals == null)
                return "" + percent(d.xdata.approx.pct);
            return d.xdata.finals.time;
        }
        return comma(d.distkmFixed) + "km";
    })
        .style("opacity", function (d) {
        if (d.x == d.y)
            return 1;
        return (d.xdata.finals != null | d.ydata.finals != null) ? 0.2 : 1;
    })
        .attr("text-anchor", "middle")
        .attr("dy", 4);
    rects.selectAll(".diag2")
        .data(grid.filter(function (d) { return d.x == d.y; }))
        .enter()
        .append("text")
        .attr("class", "diag2")
        .attr("x", function (d) { return (d.x + 0.5) * rectWidth; })
        .attr("y", function (d) { return (d.y + 0.5) * rectHeight; })
        .text(function (d) {
        if (d.xdata.finals != null) {
            return d.xdata.finals.place;
        }
        return comma(d.xdata.approx.distkmTotalFixed) + "km";
    })
        .attr("text-anchor", "middle")
        .attr("dy", -12)
        .style("font-weight", "bold");
    rects.selectAll(".diag3")
        .data(grid.filter(function (d) { return d.x == d.y; }))
        .enter()
        .append("text")
        .attr("class", "diag3")
        .attr("x", function (d) { return (d.x + 0.5) * rectWidth; })
        .attr("y", function (d) { return (d.y + 0.5) * rectHeight; })
        .text(function (d) {
        if (d.xdata.finals != null) {
            return "";
        }
        return comma(d.xdata.approx.distkmTotalFixed - d.xdata.approx.distkmTotalFixed / d.xdata.approx.pct) + "km";
    })
        .attr("text-anchor", "middle")
        .attr("dy", 19)
        .style("font-weight", "bold")
        .style("opacity", 0.8);
    var scaleSizeX = teamdata.length * rectWidth;
    var nameScaleX = d3.scale.ordinal().domain(teamdata.map(function (x) { return x.name; })).rangePoints([0, scaleSizeX], 1);
    var scaleSizeY = teamdata.length * rectHeight;
    var nameScaleY = d3.scale.ordinal().domain(teamdata.map(function (x) { return x.name; })).rangePoints([0, scaleSizeY], 1);
    var xAxis = d3.svg.axis().scale(nameScaleX).orient("top").tickSize(0);
    var yAxis = d3.svg.axis().scale(nameScaleY).orient("left").tickSize(0);
    rects.append("g").attr("transform", "translate(0," + 0 + ")").call(xAxis).selectAll("text").attr("class", "xlab").style("text-anchor", "end").attr("dy", -10).attr("dx", 5).attr("transform", "rotate(45)");
    rects.append("g").call(yAxis).selectAll("text").attr("dx", -3).attr("class", "ylab");
}
function makeElevationMap(teamdata) {
    var x = d3.scale.linear()
        .range([0, 1810])
        .domain([0, 1]);
    var y = d3.scale.linear()
        .range([0, 60])
        .domain([0, d3.max(mapdata, function (d) { return d.elevation; })]);
    var color = d3.scale.category10();
    var line = d3.svg.line()
        .x(function (d) { return x(d.pct); })
        .y(function (d) { return 80 - y(d.elevation); });
    var lines = d3.select("#linegraph").append("g").attr("transform", "translate(30,0) scale(0.96)");
    lines.call(tip);
    lines.append("path")
        .datum(mapdata.sort(function (a, b) { return a.pct - b.pct; }))
        .attr("d", line)
        .style("stroke", "#01579b")
        .style("stroke-width", "2px")
        .style("fill", "#0288d1");
    lines.append("g").selectAll("circle")
        .data(teamdata)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d.approx.pct); })
        .attr("cy", function (d) { return 75 - y(d.approx.elevation); })
        .attr("r", 3)
        .style("fill", function (d) { return groupColor(d.category); })
        .on("mouseover", function (d) {
        tip.show(d);
    })
        .on("mouseout", tip.hide);
    var legend = lines.append("g")
        .attr("transform", "translate(10,10)");
    legend.selectAll("text")
        .data(d3.nest().key(function (d) { return d.category; }).entries(teamdata))
        .enter()
        .append("text")
        .text(function (d) { return d.key; })
        .attr("x", function (d, i) { return 60 + i * 20; })
        .attr("y", 0)
        .style("fill", function (d) { return groupColor(d.key); });
    legend.append("g").append("text").text("Groups").style("font-weight", "bold");
    lines.append("g").append("text").text("Finish").attr("x", 1800).attr("y", 100).style("font-weight", "bold").style("color", "#283593");
    var xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(0).tickFormat(d3.format("%")).ticks(20);
    var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0).ticks(5).tickFormat(function (x) { return ((500 - x) + "m"); });
    lines.append("g").attr("transform", "translate(5,80)").call(xAxis).selectAll("text").style("font-size", "10px").style("color", "#283593");
    lines.append("g").attr("transform", "translate(0,20)").call(yAxis).selectAll("text").style("font-size", "8px").style("color", "#283593");
}
function buildMap(error, map, teams, finals) {
    mapdata = parseMapData(map);
    teamdata = parseTeamData(teams);
    tree = new kdTree(mapdata, distance, ["x", "y", "z"]);
    finals.forEach(function (f) { return f.place = parseInt(f.place); });
    markers.forEach(function (x) {
        x.approx = approximatePosition(x, tree);
    });
    teamdata.forEach(function (t) {
        t.approx = approximatePosition(t, tree);
        t.pct = t.approx.pct;
    });
    groupColor = groupColor.domain(d3.nest().key(function (d) { return d.category; }).entries(teamdata));
    console.log(finals);
    groupb = teamdata.filter(function (x) { return x.categoryName == "Group B"; });
    finals.forEach(function (f) {
        groupb.forEach(function (t) {
            if (f.name == t.name) {
                t.finals = f;
                t.pct = 1;
                t.approx.distkmTotal = 1358;
                t.approx.distkmTotalFixed = 1358;
            }
        });
    });
    groupb = groupb.sort(function (x, y) {
        if (x.finals != null) {
            if (y.finals != null)
                return x.finals < y.finals ? -1 : 1;
            return -1;
        }
        if (y.finals != null) {
            return 1;
        }
        return y.pct - x.pct;
    });
    makeDistanceMatrix(groupb.slice(0, 25), "#main", ["dodgerblue", "white"]);
    makeDistanceMatrix(groupb.slice(25, 50), "#main2", ["#7e57c2", "white"]);
    makeDistanceMatrix(groupb.slice(50, 75), "#main3", ["#ec407a", "white"]);
    makeElevationMap(teamdata);
    var hms = d3.time.format("%H:%M:%S");
    d3.select("#time").html(hms(d3.max(teamdata, function (x) { return x.time; })));
}
queue()
    .defer(d3.csv, "map.csv")
    .defer(d3.json, "testdata.json")
    .defer(d3.json, "finals.json")
    .await(buildMap);
