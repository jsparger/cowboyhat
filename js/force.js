define(["d3"], function (d3) {
  class Force {

    constructor(width, height) {
      this._sim = null;
      this._fetch = null;
      this._root_key = null;
      this._data = null;
      this._svg = null;
      this._width = width;
      this._height = height;
    }

    fetch(f) {
      this._fetch = f;
      return this;
    }

    root_key(key) {
      this._root_key = key;
      return this;
    }

    async init() {
      // create an svg element and select it.
      // setting the width and height is very important
      this._svg = d3.select("body").append("svg")
        .attr("width", this._width)
        .attr("height", this._height);

      this._nodes = this._svg.append("g").selectAll(".node");

      // create a border for the svg.
      this._svg.append("rect")
       			.attr("x", 0)
       			.attr("y", 0)
       			.attr("height", this._width)
       			.attr("width", this._height)
            .style("stroke", 'black')
       			.style("fill", "none")
       			.style("stroke-width", 5);

      // fetch first data from source:
      //this._data = [await this._fetch(this._root_key)];
      // for example with a few balls
      this._data = [{name: "steve"}, {name: "joe"}, {name: "robert"}];

      // initialize the simulation
      this._sim = d3.forceSimulation()
          .force("charge", d3.forceManyBody().strength(-500))
          // .force("gravity", d3.forceManyBody().strength(100))
          // .force("link", d3.forceLink(links))
          .force("forceX", d3.forceX(this._width/2))
          .force("forceY", d3.forceY(this._height/2))
          // .force("center", d3.forceCenter(this._width/2, this._height/2))
          // .force("radial", d3.forceRadial(100, this._width/2, this._height/2))
          .on("tick", this.tick.bind(this));

      // run the simulation and visualization
      this.update();
    }

    update() {
      // To understand this code, check out this explanation of d3.js selections.
      // detailed:   https://bost.ocks.org/mike/selection/
      // simplified: https://bost.ocks.org/mike/join/

      // Join our new _data with the old data in the selection (initially none)
      // "_nodes" now represents nodes which existed both our new and old data.
      this._nodes = this._nodes.data(this._data);

      // remove any nodes which associated with data we deleted (the exit group)
      this._nodes.exit().remove();

      // for every new piece of data, (the "enter" group), create a circle in
      // the svg group. Then, merge the "enter" group with _nodes. Now _nodes
      // is a selection with one node per piece of element in _data.
      this._nodes = this._nodes.enter()
          .append("circle")
          .attr("r", 10)
        .merge(this._nodes);

      this._sim.nodes(this._data);
      this._sim.alpha(5).restart();
    }

    tick() {
      // update the positions of the nodes in the svg based on their coordinates
      // as computed by the force layout.
      this._nodes
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    }
  }

  return {
    "Force": Force
  };
});
