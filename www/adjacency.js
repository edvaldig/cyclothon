"use strict";
class GPSProgress {
}
class Point {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}
class Team extends Point {
}
var grid = new Array(teamdata.length * 2);
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
d3.select("main")
    .append("g")
    .selectAll("rect")
    .data(grid)
    .enter()
    .append("rect")
    .attr("width", 25)
    .attr("height", 25)
    .attr("x", d => d.x * 25)
    .attr("y", d => d.y * 25)
    .style("stroke", "black")
    .style("stroke-width", "1px");
