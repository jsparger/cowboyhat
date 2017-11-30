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
      this._data = [await this._fetch(this._root_key)];
      // for example with a few balls
      // this._data = [{name: "steve"}, {name: "joe"}, {name: "robert"}];

      // initialize the simulation
      this._sim = d3.forceSimulation(this._data)
          .force("charge", d3.forceManyBody())
          // .force("link", d3.forceLink(links))
          .force("center", d3.forceCenter(this._width/2,this._height/2))
          .on("tick", this.tick.bind(this));

      // run the simulation and visualization
      this.update();
    }

    update() {
      this._sim.restart();

      // compare the content of the svg group "nodes" with our data
      // nodes represents the elements which were in both the svg and our data.
      let nodes = this._svg.selectAll("node")
        .data(this._data);

      // remove any nodes which were in the svg but not in our data.
      // FYI this is called the "exit" group
      nodes.exit().remove();

      // for every node in our data which was not in the svg (the "enter" group)
      // create a circle. Then merge this "enter" group with nodes. Finally,
      // update the positions of every svg element based on their node.
      nodes.enter().append("circle")
          .attr("r", 10)
        .merge(nodes)
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    }

    tick() {
      this._svg.selectAll("circle")
      .attr("transform", function(d) {
      		return "translate(" + d.x + "," + d.y + ")";
        });
    }
  }

  return {
    "Force": Force
  };
});
