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

module.exports = { Point };
