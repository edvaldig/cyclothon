var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Coordinate = (function () {
    function Coordinate() {
    }
    return Coordinate;
}());
var GPSProgress = (function (_super) {
    __extends(GPSProgress, _super);
    function GPSProgress() {
        _super.apply(this, arguments);
    }
    return GPSProgress;
}(Coordinate));
var Point = (function () {
    function Point(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Point;
}());
var Marker = (function (_super) {
    __extends(Marker, _super);
    function Marker() {
        _super.apply(this, arguments);
    }
    return Marker;
}(Point));
var Team = (function (_super) {
    __extends(Team, _super);
    function Team() {
        _super.apply(this, arguments);
    }
    return Team;
}(Point));
