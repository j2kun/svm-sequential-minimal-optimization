import * as d3 from 'd3';
import { Point, Hyperplane, innerProduct } from './geometry';

let width = 800;
let height = 600;
let svg = d3.select("body").append("svg")
                           .attr("width", width)
                           .attr("height", height);
let unit = 20;  // pixels per "unit" in the plotted plane

let originX = width / 2;
let originY = height / 2;

function fromCartesianX(x) { return originX + x; }
function fromCartesianY(y) { return originY - y; }
function toCartesianX(x) { return x - originX; }
function toCartesianY(y) { return -y + originY; }

let h = new Hyperplane(unit, unit * 3 / 2, 0);
let numPoints = 100;
let data = [];

for (let i=0; i < numPoints; i++) {
  let unlabeledPoint = new Point(0, 0);
  while (Math.abs(innerProduct(unlabeledPoint, h.normalized())) < 2*unit) {
    unlabeledPoint = new Point(
      Math.floor(toCartesianX(Math.random() * width)),
      Math.floor(toCartesianY(Math.random() * height))
    );
  }

  if (innerProduct(unlabeledPoint, h) > 0) {
    unlabeledPoint.label = 1;
  } else {
    unlabeledPoint.label = -1;
  }

  data.push(unlabeledPoint);
}

let defs = svg.append("defs")
defs.append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 5)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto");

let markers = svg.select("marker")
markers.append("path")
       .attr("d", "M0,-5L10,0L0,5");

let circles = svg.selectAll("circle").data(data).enter().append("circle");
circles.attr("cx", function (d) { return fromCartesianX(d.x); })
       .attr("cy", function (d) { return fromCartesianY(d.y); })
       .attr("r", function (d) { return d.radius; })
       .attr("fill", function (d) { return d.labelToColor[d.label]; })
       .attr("stroke", function (d) { return d.labelToStrokeColor[d.label]; })
       .attr("stroke-width", 2)

let line = svg.append("line").datum(h);
line.attr("x1", function(d) { return fromCartesianX(d.spanningX1(width, height)); } )
    .attr("x2", function(d) { return fromCartesianX(d.spanningX2(width, height)); } )
    .attr("y1", function(d) { return fromCartesianY(d.spanningY1(width, height)); } )
    .attr("y2", function(d) { return fromCartesianY(d.spanningY2(width, height)); } )
    .attr("stroke", "black")
    .attr("stroke-width", 2)

let normal = svg.append("line").datum(h);
normal.attr("x1", function(d) { return fromCartesianX(0); } )
      .attr("x2", function(d) { return fromCartesianX(d.normalVector().x); } )
      .attr("y1", function(d) { return fromCartesianY(0); } )
      .attr("y2", function(d) { return fromCartesianY(d.normalVector().y); } )
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrow)")
