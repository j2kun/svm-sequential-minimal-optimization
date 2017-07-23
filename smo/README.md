# Sequential Minimal Optimization

[Associated blog post]()

[![example](images/example.png)](http://j2kun.github.io/smo/index.html)

(Click the image above or [this link](http://j2kun.github.io/smo/index.html) for a demo)

# Setup for running on a local machine

Intall prerequisites

```
npm install   # or yarn install
gulp watch    # demo live updates when code changes
```

Then open `index.html` in a web browser.

```
open index.html
```

## Files

 - `geometry.js` contains the main geometric primitives that are unrelated to
rendering. The coordinate system for these classes is standard Cartesian
(0,0)-in-the-center coordinates.
 - `main.js` instantiates the geometry objects, renders them with d3, and sets up
the relevant behaviors.

## Appendix

 - `smo-derivation.pdf` contains a detailed writeup of the analytic derivation
   of the solution to the dual SVM two-variable subproblem.
 - `smo-derivation.nb` is a Mathematica notebook that contains the symbolic algebra
   performed in the derivation from `smo-derivation.pdf`.
 - `smo-derivation.png` is a screenshot of the Mathematica notebook for those who 
   don't have Mathematica.
