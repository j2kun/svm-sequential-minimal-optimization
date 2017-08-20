import * as d3 from 'd3';
import { Vector, Hyperplane, innerProduct } from './geometry';

let width = 800;
let height = 600;
let svg = d3.select("body").insert("svg", ":first-child")
                           .attr("width", width)
                           .attr("height", height);

var allPoints;

let unit = 60;
let numPoints = 1000;

let originX = width / 2;
let originY = height / 2;
let arrowheadSize = 125;
let vectorStroke = 4;

function fromCartesianX(x) { return originX + x; }
function fromCartesianY(y) { return originY - y; }
function toCartesianX(x) { return x - originX; }
function toCartesianY(y) { return -y + originY; }


function createHyperplaneSVG(hyperplane) {
  // Create the hyperplane normal and spanning line as d3 objects and bundle them up
  let spanning = svg.append("line").datum(hyperplane);
  let normal = svg.append("line").datum(hyperplane);
  let arrowhead = svg.append('g').datum(hyperplane).append('path');

  let hyperplaneSVG = {spanning: spanning, normal: normal, arrowhead: arrowhead};
  return hyperplaneSVG;
}

function createPointsSVG(hyperplane) {
  let points = [];

  // Generate some points on each side of the hyperplane, but not too close
  for (let i=0; i < numPoints; i++) {
    let unlabeledPoint = new Vector(0, 0);
    while (Math.abs(innerProduct(unlabeledPoint, h.normalized())) < 5) {
      unlabeledPoint = new Vector(
        Math.floor(toCartesianX(Math.random() * width)),
        Math.floor(toCartesianY(Math.random() * height))
      );
    }

    if (innerProduct(unlabeledPoint, h) > 0) {
      unlabeledPoint.label = 1;
    } else {
      unlabeledPoint.label = -1;
    }

    points.push(unlabeledPoint);
  }

  allPoints = points;

  let circleContainers = svg.selectAll(".point").data(points).enter().append('g');
  let circles = circleContainers.append('circle');
  circles.attr("cx", function (d) { return fromCartesianX(d.x); })
         .attr("cy", function (d) { return fromCartesianY(d.y); })
         .attr("r", function (d) { return 3; })

  let textLabels = circleContainers.append("text");
  textLabels.attr("x", function (d) { return fromCartesianX(d.x + 8); })
            .attr("y", function (d) { return fromCartesianY(d.y - 9); })
            .attr("class", "point-label");

  return {circles: circles, textLabels: textLabels};
}

function setupPointsStyle(pointsSVG) {
  let {circles, textLabels} = pointsSVG;
  circles.attr("fill", function (d) { return d.labelToColor[d.label]; })
         .attr("stroke", function (d) { return d.labelToStrokeColor[d.label]; })
         .attr("stroke-width", 1);
}

function vectorStyle(vectorSVG, id, color) {
  vectorSVG.attr("x1", function(d) { return fromCartesianX(0); })
           .attr("y1", function(d) { return fromCartesianY(0); })
           .attr("x2", function(d) { return fromCartesianX(d.x); })
           .attr("y2", function(d) { return fromCartesianY(d.y); })
           .attr("id", id)
           .attr("stroke", color)
           .attr("stroke-width", vectorStroke);
  return vectorSVG;
}

function arrowheadStyle(arrowheadSVG, color) {
  let triangleSymbol = d3.symbol().size(arrowheadSize).type(d3.symbolTriangle);
  arrowheadSVG.style("fill", color)
              .style("cursor", "pointer")
              .attr('d', triangleSymbol);
}

function setupHyperplaneStyle(hyperplaneSVG) {
  let { spanning, normal, arrowhead } = hyperplaneSVG;

  vectorStyle(normal, "normal", "black");
  arrowheadStyle(arrowhead, "black");
  spanning.attr("stroke", "black")
          .attr("id", "spanning")
          .attr("stroke-width", 2);
}

function setupVectorStyle(vectorSVG) {
  let { vector, arrowhead } = vectorSVG;
  vectorStyle(vector, "", "blue");
  arrowheadStyle(arrowhead, "blue");
}

function setupBehavior(hyperplaneSVG, pointsSVG, vectorSVG) {
  let { spanning, normal, arrowhead } = hyperplaneSVG;
  let { circles, textLabels } = pointsSVG;

  function setSpanningPosition(svg, translate=0) {
    svg.attr("x1", function(d) { return fromCartesianX(d.spanningX1(width, height, translate)); })
       .attr("x2", function(d) { return fromCartesianX(d.spanningX2(width, height, translate)); })
       .attr("y1", function(d) { return fromCartesianY(d.spanningY1(width, height, translate)); })
       .attr("y2", function(d) { return fromCartesianY(d.spanningY2(width, height, translate)); });
  }

  function setPosition(svg, labelName) {
    svg.attr("x2", function(d) { return fromCartesianX(d.x); })
       .attr("y2", function(d) { return fromCartesianY(d.y); });
  }

  function setArrowheadPosition(svg) {
    svg.attr('transform', function(d) {
      let offset = d.arrowheadOffset();
      let displayX = fromCartesianX(d.x) + offset[0];
      let displayY = fromCartesianY(d.y) + offset[1];
      let rotationFromVertical = offset[2];
      return ("translate(" + displayX + " " + displayY + ") " + "rotate(" + rotationFromVertical + ")");
    });
  }

  function dragged(d, vector, arrowhead, labelName) {
    d.x += d3.event.dx;
    d.y -= d3.event.dy;
    setPosition(vector, labelName);
    setArrowheadPosition(arrowhead);

    // updateDecisonText(projected);
  }

  arrowhead.call(d3.drag().on("drag", function(d) {
    dragged(d, normal, arrowhead, 'normal');
    setSpanningPosition(spanning);
  }));

  setPosition(normal, 'normal');
  setArrowheadPosition(arrowhead);
  setSpanningPosition(spanning);
  setArrowheadPosition(vectorSVG.arrowhead);
}

function normalFromRandomAlphas(points, norm) {
  let hyperplane = [0, 0];

  for (let i = 0; i < points.length; i++) {
    let alpha = Math.random();  // in [0,1)
    let scaledPoint = points[i].scale(points[i].label * alpha);
    hyperplane[0] += scaledPoint.x;
    hyperplane[1] += scaledPoint.y;
  }


  let v = new Vector(hyperplane[0], hyperplane[1]);
  return v.normalized().scale(norm);
}

function createVectorSVG(v) {
  // Create the vector and projected vector d3 objects
  let vector = svg.append("line").datum(v);
  let vectorArrowhead = svg.append('g').datum(v).append('path');

  return {
    vector: vector,
    arrowhead: vectorArrowhead,
  };
}


let length = 100;
let hNormal = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1).normalized().scale(length);
let h = new Hyperplane(hNormal.x, hNormal.y, 0);
let pointsSVG = createPointsSVG(h);
let hyperplaneSVG = createHyperplaneSVG(h);

let v = normalFromRandomAlphas(allPoints, length);
let vectorSVG = createVectorSVG(v);

setupHyperplaneStyle(hyperplaneSVG);
setupPointsStyle(pointsSVG);
setupVectorStyle(vectorSVG);

setupBehavior(hyperplaneSVG, pointsSVG, vectorSVG);
