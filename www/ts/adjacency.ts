import * as d3 from "d3";

class GPSProgress {
    public debug : any;
    public distkmTotal : number;
    public distkmTotalFixed : number;
    public pct : number;
    public elevation : number;
    public longitude : number;
    public latitude : number;
}

class Point {
    public x : number;
    public y : number; 
    public z : number; 

    public constructor(x:number, y:number, z:number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

class Team extends Point {
    public numberPlate : string; 
    public name : string; 
    public category : string;
    public categoryName : string;
    public longitude : number;
    public latitude : number; 
    public nosignal : boolean; 
    public speed : number; 
    public approx : GPSProgress; 
}

declare var teamdata: Array<Team>;

var grid = new Array<any>(teamdata.length*2);
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

d3.select("main")
    .append("g")
    .selectAll("rect")
    .data(grid)
    .enter()
    .append("rect")
    .attr("width", 25)
    .attr("height", 25)
    .attr("x", d=>d.x*25)
    .attr("y", d=>d.y*25)
    .style("stroke", "black")
    .style("stroke-width", "1px");

