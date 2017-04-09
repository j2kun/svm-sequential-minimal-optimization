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

// Generate some points on each side of the hyperplane, but not too close
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

let circles = svg.selectAll("circle").data(data).enter().append("circle");
circles.attr("cx", function (d) { return fromCartesianX(d.x); })
       .attr("cy", function (d) { return fromCartesianY(d.y); })
       .attr("r", function (d) { return d.radius; })
       .attr("fill", function (d) { return d.labelToColor[d.label]; })
       .attr("stroke", function (d) { return d.labelToStrokeColor[d.label]; })
       .attr("stroke-width", 2);

let spanning = svg.append("line").datum(h);
spanning.attr("stroke", "black")
        .attr("id", "spanning")
        .attr("stroke-width", 2);

function setSpanningPosition(d) {
  spanning.attr("x1", function(d) { return fromCartesianX(d.spanningX1(width, height)); } )
          .attr("x2", function(d) { return fromCartesianX(d.spanningX2(width, height)); } )
          .attr("y1", function(d) { return fromCartesianY(d.spanningY1(width, height)); } )
          .attr("y2", function(d) { return fromCartesianY(d.spanningY2(width, height)); } );
}

let normal = svg.append("line").datum(h);
normal.attr("x1", function(d) { return fromCartesianX(0); } )
      .attr("x2", function(d) { return fromCartesianX(d.normalVector().x); } )
      .attr("y1", function(d) { return fromCartesianY(0); } )
      .attr("y2", function(d) { return fromCartesianY(d.normalVector().y); } )
      .attr("id", "normal")
      .attr("stroke", "black")
      .attr("stroke-width", 2);

function setNormalPosition() {
  d3.select("#normal").attr("x2", function(d) { return fromCartesianX(d.x); })
                      .attr("y2", function(d) { return fromCartesianY(d.y); });
}

let arrowhead = svg.append('g').datum(h).append('path');
var arrowheadSize = 100;  // in pixels squared, for some reason

// Translate and rotate the arrowhead position based on the end of the
// normal vector
function arrowheadPosition(d) {
  let nv = d.normalVector();
  let vAngle = d.normalAngleFromVertical();
  let angleDeg = parseInt(vAngle * 180 / Math.PI);
  let angle = d.normalAngle();
  let halfLength = Math.sqrt(arrowheadSize) / 2;
  let arrowhead_x = fromCartesianX(nv.x) - halfLength * Math.cos(angle);
  let arrowhead_y = fromCartesianY(nv.y) + halfLength * Math.sin(angle);
  return [arrowhead_x, arrowhead_y, angleDeg];
}

function setArrowheadPosition() {
  arrowhead.attr('transform', function(d) {
    let posn = arrowheadPosition(d);
    return ("translate(" + posn[0] + " " + posn[1] + ") " + "rotate(" + posn[2] + ")");
  })
}

arrowhead.style("fill", "black")
         .style("cursor", "pointer")
         .attr('d', d3.symbol()
                      .size(arrowheadSize)
                      .type(d3.symbolTriangle))

function dragged(d) {
  d.x += d3.event.dx;
  d.y -= d3.event.dy;
  setNormalPosition();
  setArrowheadPosition();
  setSpanningPosition();
}

arrowhead.call(d3.drag().on("drag", dragged));

setNormalPosition();
setArrowheadPosition();
setSpanningPosition();
