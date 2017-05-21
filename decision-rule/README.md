# The Inner Product as a Decision Rule

![hyperplane](images/example.png)

# Setup for running on a local machine

Intall prerequisites

```
npm install   # or yarn install
npm install -g gulp
```

Then open `index.html` in a web browser and drag around the arrowhead.

```
open index.html
```

## Files

`geometry.js` contains the main geometric primitives that are unrelated to
rendering. The coordinate system for these classes is standard Cartesian
(0,0)-in-the-center coordinates.

`main.js` instantiates the geometry objects, renders them with d3, and sets up
the relevant behaviors.
