class Coordinate {
    public longitude : number;
    public latitude : number;
    public elevation : number;     
}

class GPSProgress extends Coordinate {
    public debug : any;
    public distkmTotal : number;
    public distkmTotalFixed : number;
    public pct : number;
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

class Marker extends Point {
    public name : string; 
    public approx : GPSProgress;

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
