function innerProduct(a, b) {
  return a.x * b.x + a.y * b.y;
}


class Point {

  constructor(x, y, label) {
    this.x = x;
    this.y = y;
    this.label = label ? label : 1;  // labels are +/-1

    this.radius = 7;
    this.labelToColor = {
      '-1': 'red',
      '1': 'green',
    };
    this.labelToStrokeColor = {
      '-1': '#330000',
      '1': '#003300',
    };
  }

  render() {
    let canvas = document.getElementById('myCanvas');
    let context = canvas.getContext('2d');
    let centerX = canvas.width / 2 + this.x;
    let centerY = canvas.height / 2 - this.y;

    context.beginPath();
    context.arc(centerX, centerY, this.radius, 0, 2 * Math.PI, false);
    context.fillStyle = this.labelToColor[this.label];
    context.fill();
    context.lineWidth = 2;
    context.strokeStyle = this.labelToStrokeColor[this.label];
    context.stroke();
    context.closePath();
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.label > 0 ? '+': '-'}1)`;
  }
}


class Hyperplane {

  constructor(normalX=0, normalY=0, offset=0) {
    // hyperplane is defined by all vectors x for which <normal, x> - b = 0
    // either normalX or normalY must be nonzero
    if (normalX || normalY) {
      this.x = normalX;
      this.y = normalY;
      this.b = offset;
    } else {
      throw 'normalX or normalY must be nonzero';
    }
    console.log(`Normal vector: (${this.x}, ${this.y})`);
  }

  normalized() {
    let norm = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Point(this.x / norm, this.y / norm);
  }

  spanningVector() {
    // since this demo is in 2d, the hyerplane is just a line. spanningVector
    // outputs a unit vector v such that the line is the set { c*v + this.b } for
    // all reals c. There are infinitely many such vectors, being the solutions
    // to <this.normal, x> = 0 , and we just need to find one.
    // We can do this by fixing a coordinate of x and solving for the other.
    let spanningX, spanningY;
    if (this.x != 0) {
      spanningY = 1;
      spanningX = -this.y / this.x;
    } else {
      spanningX = 1;
      spanningY = -this.x / this.y;
    }
    let norm = Math.sqrt(spanningX * spanningX + spanningY * spanningY);
    let vec = [spanningX / norm, spanningY / norm];
    console.log(`Spanning vector: (${vec[0]}, ${vec[1]})`);
    return vec;
  }

  arrow(context, fromX, fromY, toX, toY){
    var headLen = 10;   // length of head in pixels
    var angle = Math.atan2(toY - fromY, toX - fromX);
    context.beginPath();
    context.lineWidth = 2;
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.lineTo(toX - headLen * Math.cos(angle - Math.PI/6), toY - headLen * Math.sin(angle - Math.PI/6));
    context.moveTo(toX, toY);
    context.lineTo(toX - headLen * Math.cos(angle + Math.PI/6), toY - headLen * Math.sin(angle + Math.PI/6));
    context.stroke();
    context.closePath();
  }

  render() {
    let canvas = document.getElementById('myCanvas');
    let context = canvas.getContext('2d');
    let originX = canvas.width / 2;
    let originY = canvas.height / 2;
    let direction = this.spanningVector();
    let magnitude = canvas.width + canvas.height;  // ensure line covers canvas (overkill, but fine)

    let startX = parseInt(originX + magnitude * direction[0]);
    let startY = parseInt(originY - magnitude * direction[1]);
    let endX = parseInt(originX - magnitude * direction[0]);
    let endY = parseInt(originY + magnitude * direction[1]);

    context.beginPath();
    context.lineWidth = 2;
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();
    context.closePath();

    this.arrow(context, originX, originY, originX + this.x, originY - this.y);
  }
}


module.exports = {
  Hyperplane,
  Point,
  innerProduct,
};
