function innerProduct(a, b) {
  return a.x * b.x + a.y * b.y;
}

class Vector {
  constructor(x, y, label=1, arrowheadSize=100) {
    this.x = x;
    this.y = y;
    this.label = label ? label : 1;  // labels are +/-1
    this.arrowheadSize = arrowheadSize;

    this.labelToColor = {
      '-1': 'red',
      '1': 'green',
    };
    this.labelToStrokeColor = {
      '-1': '#330000',
      '1': '#003300',
    };
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.label > 0 ? '+': '-'}1)`;
  }

  arrowheadOffset() {
    let angleFromHorizontal = Math.atan2(this.y, this.x);
    let angleFromVertical = Math.PI/2 - angleFromHorizontal;
    let angleDeg = parseInt(angleFromVertical * 180 / Math.PI);
    let halfLength = Math.sqrt(this.arrowheadSize) / 2;
    let arrowheadOffsetX = - halfLength * Math.cos(angleFromHorizontal);
    let arrowheadOffsetY = halfLength * Math.sin(angleFromHorizontal);
    return [arrowheadOffsetX, arrowheadOffsetY, angleDeg];
  }

  project(w) {
    // project this onto the input vector w
    let normW = Math.sqrt(innerProduct(w, w));
    let normalizedW = new Vector(w.x / normW, w.y / normW);
    let signedLength = innerProduct(this, normalizedW);

    return new Vector(
      normalizedW.x * signedLength,
      normalizedW.y * signedLength
    );
  }
}


class Hyperplane extends Vector {
  constructor(normalX=0, normalY=0, offset=0) {
    // hyperplane is defined by all vectors x for which <normal, x> - b = 0
    // either normalX or normalY must be nonzero
    super(normalX, normalY);
    this.b = offset;
  }

  normalized() {
    let norm = Math.sqrt(this.x * this.x + this.y * this.y);
    return new Vector(this.x / norm, this.y / norm);
  }

  normalVector() {
    return new Vector(this.x, this.y);
  }

  normalAngleFromVertical() {
    return Math.PI/2 - Math.atan2(this.y, this.x);
  }

  normalAngle() {
    return Math.atan2(this.y, this.x);
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
    return new Vector(spanningX / norm, spanningY / norm);
  }

  spanningX1(width, height) {
    // helper for d3
    let direction = this.spanningVector();
    let magnitude = width + height;  // ensure line covers canvas (overkill, but fine)

    return parseInt(magnitude * direction.x);
  }

  spanningX2(width, height) {
    // helper for d3
    let direction = this.spanningVector();
    let magnitude = width + height;  // ensure line covers canvas (overkill, but fine)

    return parseInt(-magnitude * direction.x);
  }

  spanningY1(width, height) {
    // helper for d3
    let direction = this.spanningVector();
    let magnitude = width + height;  // ensure line covers canvas (overkill, but fine)

    return parseInt(magnitude * direction.y);
  }

  spanningY2(width, height) {
    // helper for d3
    let direction = this.spanningVector();
    let magnitude = width + height;  // ensure line covers canvas (overkill, but fine)

    return parseInt(-magnitude * direction.y);
  }
}


module.exports = {
  Hyperplane,
  Vector,
  innerProduct,
};
