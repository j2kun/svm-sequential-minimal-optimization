import * as d3 from 'd3';
import { Vector, Hyperplane, innerProduct } from './geometry';

let width = 800;
let height = 600;
let svg = d3.select("body").insert("svg", ":first-child")
                           .attr("width", width)
                           .attr("height", height);

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

function createProjectionSVG(v, h) {
  // Create the vector and projected vector d3 objects
  let vector = svg.append("line").datum(v);
  let vectorArrowhead = svg.append('g').datum(v).append('path');

  let p = {vector: v, hyperplane: h};  // need both to compute the projection
  let projected = svg.append("line").datum(p);
  let projectedArrowhead = svg.append('g').datum(p).append('path');

  let projectionSVG = {
    vector: vector,
    vectorArrowhead: vectorArrowhead,
    projected: projected,
    projectedArrowhead: projectedArrowhead,
  };

  return projectionSVG;
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
  return arrowheadSVG;
}

function setupHyperplaneStyle(hyperplaneSVG) {
  let { spanning, normal, arrowhead } = hyperplaneSVG;

  vectorStyle(normal, "normal", "black");
  arrowheadStyle(arrowhead, "black");
  spanning.attr("stroke", "black")
          .attr("id", "spanning")
          .attr("stroke-width", 2);
}

function chooseProjectionColor(d) {
  let signedLength = innerProduct(d.vector, d.hyperplane);
  return signedLength >= 0 ? 'green' : 'red';
}

function setupProjectionStyle(projectionSVG) {
  let { vector, vectorArrowhead, projected, projectedArrowhead } = projectionSVG;

  vectorStyle(vector, "vector", "grey");
  arrowheadStyle(vectorArrowhead, "grey");

  // need special styles for projected vector/arrowhead because the
  // datum is a vector and hyperplane, and we dont want an arrowhead
  projected.attr("x1", function(d) { return fromCartesianX(0); })
           .attr("y1", function(d) { return fromCartesianY(0); })
           .attr("id", "projected")
           .attr("stroke-width", vectorStroke)
           .attr("stroke", chooseProjectionColor);
  let triangleSymbol = d3.symbol().size(arrowheadSize).type(d3.symbolTriangle);
  projectedArrowhead.style("fill", chooseProjectionColor)
                    .attr('d', triangleSymbol);
}


function setVectorText(vector, labelName) {
  d3.select("#" + labelName + "-value").text(vector.toString());
}

function updateDecisonText(projected) {
  let text = "opposite side";
  d3.select("#projected-label").style("color", "red");
  d3.select("#decision-label").style("color", "red");
  if (projected.attr("stroke") == "green") {
    text = "same side";
    d3.select("#projected-label").style("color", "green");
    d3.select("#decision-label").style("color", "green");
  }
  d3.select("#decision-value").text(text);
}

function setupBehavior(hyperplaneSVG, projectionSVG) {
  let { spanning, normal, arrowhead } = hyperplaneSVG;
  let { vector, vectorArrowhead, projected, projectedArrowhead} = projectionSVG;

  function setSpanningPosition(svg) {
    svg.attr("x1", function(d) { return fromCartesianX(d.spanningX1(width, height)); })
       .attr("x2", function(d) { return fromCartesianX(d.spanningX2(width, height)); })
       .attr("y1", function(d) { return fromCartesianY(d.spanningY1(width, height)); })
       .attr("y2", function(d) { return fromCartesianY(d.spanningY2(width, height)); });
  }

  function setPosition(svg, labelName) {
    svg.attr("x2", function(d) { return fromCartesianX(d.x); })
       .attr("y2", function(d) { return fromCartesianY(d.y); });
    setVectorText(svg.datum(), labelName);
  }

  function setProjectedPosition(svg, labelName) {
    let { vector, hyperplane } = svg.datum();
    let projection = vector.project(hyperplane);
    svg.attr("x2", fromCartesianX(projection.x))
       .attr("y2", fromCartesianY(projection.y))
       .attr("stroke", chooseProjectionColor);
    setVectorText(projection, labelName);
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

  function setProjectedArrowheadPosition(svg) {
    svg.attr('transform', function(d) {
      let vector = d.vector.project(d.hyperplane);
      let offset = vector.arrowheadOffset();
      let displayX = fromCartesianX(vector.x) + offset[0];
      let displayY = fromCartesianY(vector.y) + offset[1];
      let rotationFromVertical = offset[2];
      return ("translate(" + displayX + " " + displayY + ") " + "rotate(" + rotationFromVertical + ")");
    })
    .style("fill", chooseProjectionColor)
    .style("stroke", chooseProjectionColor);
  }

  function dragged(d, vector, arrowhead, labelName) {
    d.x += d3.event.dx;
    d.y -= d3.event.dy;
    setPosition(vector, labelName);
    setArrowheadPosition(arrowhead);

    setProjectedPosition(projected, 'projected');
    setProjectedArrowheadPosition(projectedArrowhead);
    updateDecisonText(projected);
  }

  arrowhead.call(d3.drag().on("drag", function(d) {
    dragged(d, normal, arrowhead, 'normal');
    setSpanningPosition(spanning);
  }));

  vectorArrowhead.call(d3.drag().on("drag", function(d) {
    dragged(d, vector, vectorArrowhead, 'vector');
  }));

  setPosition(normal, 'normal');
  setArrowheadPosition(arrowhead);
  setSpanningPosition(spanning);

  setPosition(vector, 'vector');
  setArrowheadPosition(vectorArrowhead);

  setProjectedPosition(projected, 'projected');
  setProjectedArrowheadPosition(projectedArrowhead);
  updateDecisonText(projected);
}

let h = new Hyperplane(80, 60, 0);
let v = new Vector(80, -10);
let hyperplaneSVG = createHyperplaneSVG(h);
let projectionSVG = createProjectionSVG(v, h);

setupHyperplaneStyle(hyperplaneSVG);
setupProjectionStyle(projectionSVG);

setupBehavior(hyperplaneSVG, projectionSVG);
