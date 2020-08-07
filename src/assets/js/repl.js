const displayMath = true;

if (displayMath) {
  import("./modules/maths.js").then(function (maths) {
    console.log(maths.square(5));
    console.log(maths.cube(5));
  });
}