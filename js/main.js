import { Point } from './point';


var positivePoints = [
  [10, 30],
  [20, 10],
  [90, 60],
];

var negativePoints = [
  [-15, 25],
  [-20, -10],
  [-90, -60],
];


var data = [];

for (let coords of positivePoints) {
  data.push(new Point(coords[0], coords[1], 1));
}

for (let coords of negativePoints) {
  data.push(new Point(coords[0], coords[1], -1));
}

for (let point of data) {
  point.render();
}
