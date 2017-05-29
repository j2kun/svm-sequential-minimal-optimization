import * as d3 from 'd3';
import { Vector, Hyperplane, innerProduct } from './geometry';

let width = 800;
let height = 600;
let svg = d3.select("body").insert("svg", ":first-child")
                           .attr("width", width)
                           .attr("height", height);

let unit = 60;
let numPoints = 40;

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

function createParallelSVG(hyperplane) {
  // Create svg elements for <x, w> = +/-1
  let plusOne = svg.append("line").datum(hyperplane);
  let minusOne= svg.append("line").datum(hyperplane);

  let parallelSVG = {plusOne: plusOne, minusOne: minusOne};
  return parallelSVG;
}

function createPointsSVG(hyperplane) {
  let points = [];

  // Generate some points on each side of the hyperplane, but not too close
  for (let i=0; i < numPoints; i++) {
    let unlabeledPoint = new Vector(0, 0);
    while (Math.abs(innerProduct(unlabeledPoint, h.normalized())) < unit) {
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
    
  let circleContainers = svg.selectAll(".point").data(points).enter().append('g');
  let circles = circleContainers.append('circle');
  circles.attr("cx", function (d) { return fromCartesianX(d.x); })
         .attr("cy", function (d) { return fromCartesianY(d.y); })
         .attr("r", function (d) { return 6; })

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
         .attr("stroke-width", 2);
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

function setupParallelStyle(parallelSVG) {
  let {plusOne, minusOne} = parallelSVG;
  plusOne.attr("stroke", "blue")
         .style("stroke-dasharray", "5,5")
         .attr("stroke-width", 2);
  minusOne.attr("stroke", "blue")
          .style("stroke-dasharray", "5,5")
          .attr("stroke-width", 2);
}

function setVectorText(vector, labelName) {
  let length = vector.norm() / unit;
  let rounded = Math.round(length * 100) / 100;
  d3.select("#" + labelName + "-value").text(rounded.toString());

  if (length > 0) {
    let inverseLength = 1 / length;
    let roundedInv = Math.round(inverseLength * 100) / 100;
    d3.select("#inverse-" + labelName + "-value").text(roundedInv.toString());
  }
}

function setupBehavior(hyperplaneSVG, parallelSVG, pointsSVG) {
  let { spanning, normal, arrowhead } = hyperplaneSVG;
  let { plusOne, minusOne } = parallelSVG;
  let { circles, textLabels } = pointsSVG;

  function setSpanningPosition(svg, translate=0) {
    svg.attr("x1", function(d) { return fromCartesianX(d.spanningX1(width, height, translate)); })
       .attr("x2", function(d) { return fromCartesianX(d.spanningX2(width, height, translate)); })
       .attr("y1", function(d) { return fromCartesianY(d.spanningY1(width, height, translate)); })
       .attr("y2", function(d) { return fromCartesianY(d.spanningY2(width, height, translate)); });
  }

  function setPointsText(hyperplane) {
    textLabels.text(function (d) {
      let ip = innerProduct(d, hyperplane) / (unit * unit);
      let rounded = Math.round(ip * 10) / 10;
      let actualDist = innerProduct(d, hyperplane.normalized()) / unit;
      let roundedActual = Math.round(actualDist * 10) / 10;
      return roundedActual.toString() + ', ' + rounded.toString();
    });
  }

  function setPosition(svg, labelName) {
    svg.attr("x2", function(d) { return fromCartesianX(d.x); })
       .attr("y2", function(d) { return fromCartesianY(d.y); });
    setVectorText(svg.datum(), labelName);
    setPointsText(svg.datum());
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

  function setParallelPositions(vec) {
    let norm = vec.norm() / unit;
    if (norm != 0) {
      setSpanningPosition(plusOne, 1 / (norm * norm));
      setSpanningPosition(minusOne, -1 / (norm * norm));
    }
  }

  arrowhead.call(d3.drag().on("drag", function(d) {
    dragged(d, normal, arrowhead, 'normal');
    setSpanningPosition(spanning);
    setParallelPositions(d);
  }));

  setPosition(normal, 'normal');
  setArrowheadPosition(arrowhead);
  setSpanningPosition(spanning);
  setParallelPositions(normal.datum());

  // updateDecisonText(projected);
}

let h = new Hyperplane(80, 60, 0);
let v = new Vector(80, -10);
let parallelSVG = createParallelSVG(h);
let pointsSVG = createPointsSVG(h);
let hyperplaneSVG = createHyperplaneSVG(h);

setupHyperplaneStyle(hyperplaneSVG);
setupParallelStyle(parallelSVG);
setupPointsStyle(pointsSVG);

setupBehavior(hyperplaneSVG, parallelSVG, pointsSVG);
