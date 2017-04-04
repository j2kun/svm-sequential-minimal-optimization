function innerProduct(a, b) {
  return a.x * b.x + a.y * b.y;
}


class Point {
  constructor(x, y, label=1) {
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

  normalVector() {
    return new Point(this.x, this.y);
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
    return new Point(spanningX / norm, spanningY / norm);
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
  Point,
  innerProduct,
};
