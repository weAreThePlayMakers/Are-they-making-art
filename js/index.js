var path = document.getElementById("my-path");

var length = path.getTotalLength();

// alert(length);


var width = 200,
    height = width;

var front = d3.geo.orthographic()
    .translate([width / 2, height / 2])
    .scale(height / 2 - 2)
    .clipAngle(90)
    .rotate([0, -70]);

var back = d3.geo.projection(function(λ, φ) {
      var coordinates = d3.geo.orthographic.raw(λ, φ);
      coordinates[0] = -coordinates[0];
      return coordinates;
    })
    .translate(front.translate())
    .scale(front.scale())
    .clipAngle(front.clipAngle())
    .rotate([front.rotate()[0] + 180, -front.rotate()[1], -front.rotate()[2]]);

var initial = front.rotate(),
    velocity = [.05, -.01],
    t0 = Date.now(),
    path = d3.geo.path().projection(front),
    backPath = d3.geo.path().projection(back);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(d3.behavior.drag()
      .origin(function() { var r = front.rotate(); return {x: r[0], y: -r[1]}; })
      .on("drag", function() {
        t0 = -1;
        rotate(d3.event.x, -d3.event.y);
      })
      .on("dragend", function() {
        initial = front.rotate();
        t0 = Date.now();
      }));

function rotate(λ, φ) {
  front.rotate([λ, φ, front.rotate()[2]]);
  back.rotate([180 + λ, -φ, back.rotate()[2]]);
  svg.selectAll("path:not(.back)").attr("d", path);
  svg.selectAll("path.back").attr("d", backPath);
}

var mercator = d3.geo.mercator().scale(1 / Math.PI).translate([0, 0]),
    n = 4;

var spirals = {type: "GeometryCollection", geometries: d3.range(-1, 1 + 1 / n, 2 / n).map(function(x) {
  var angle = .5;
  return {type: "Polygon", coordinates: [rhumb(x, angle).concat(rhumb(x + 1 / n, angle).reverse())]};
})};

function rhumb(x0, angle) {
  return d3.range(x0, x0 + 1.5 * 2 / angle + .5 * 1 / 100, 1 / 100).map(function(x) {
    return mercator.invert([(x + 1) % 2 - 1, 1.5 - (x - x0) * angle]);
  });
}

svg.append("path")
    .attr("class", "back")
    .datum(spirals)
    .attr("d", backPath);

svg.append("path")
    .attr("class", "front")
    .datum(spirals)
    .attr("d", path);

svg.append("path")
    .datum(d3.geo.graticule())
    .attr("class", "graticule")
    .attr("d", path);

svg.append("path")
    .datum({type: "Sphere"})
    .attr("class", "outline")
    .attr("d", path);

d3.timer(function() {
  if (t0 < 0) return;
  var t = Date.now() - t0;
  rotate(initial[00] + velocity[0] * t, initial[1] + velocity[1] * t);
});