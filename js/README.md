# Javascript Demos

![hyperplane](images/example-hyperplane.png)

# Setup

```
$ cd js
$ ls
README.md    geometry.js  gulpfile.js  images       index.html   main.js      package.json
$ node --version
v6.9.4
$ git checkout jeremy-drag-and-drop
```

Use `npm` to install

```
npm install
```

I'm using `gulp` to do all the stupid things that need to be done to convert
the javascript to browser-usable form, including babelify and browserify.

```
npm install -g gulp
```

Now `gulp watch` will continually look for filesystem changes to `.js` files,
and rebuild them into a single file `build/main.bundle.js`, which is what
`index.html` imports. I haven't figured out how to get gulp not to crash if it
encounters a syntax error in the js source. You can also use `gulp build` to
build on demand.

Then open `index.html` in a web browser and drag around the arrowhead.

## Files

`geometry.js` contains the main geometric primitives that are unrelated to
rendering. The coordinate system for these classes is standard Cartesian
(0,0)-in-the-center coordinates.

`main.js` instantiates the geometry objects, and renders them with d3.
