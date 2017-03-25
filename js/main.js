import { Point, Hyperplane, innerProduct } from './geometry';


let canvas = document.getElementById('myCanvas');
let context = canvas.getContext('2d');
let originX = canvas.width / 2;
let originY = canvas.height / 2;


var h = new Hyperplane(20, 30, 0);
h.render();

var numPoints = 30;
var data = [];

for (let i=0; i < numPoints; i++) {
  let unlabeledPoint = new Point(0, 0);
  while (Math.abs(innerProduct(unlabeledPoint, h.normalized())) < 40) {
    unlabeledPoint = new Point(
      Math.floor(Math.random() * canvas.width - originX),
      Math.floor(Math.random() * canvas.height - originY)
    );
  }

  if (innerProduct(unlabeledPoint, h) > 0) {
    unlabeledPoint.label = 1;
  } else {
    unlabeledPoint.label = -1;
  }

  data.push(unlabeledPoint);
}

for (let point of data) {
  point.render();
}
