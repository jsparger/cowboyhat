define(["d3"], function (d3) {
  class Force {
    contructor() {
      this.sim = null;
      this.fetch = null;
      this.root_key = null;
      this.data = null;
      this.svg = null;
    }

    fetch(f) {
      this.fetch = f;
      return this;
    }

    root_key(key) {
      this.root_key = key;
      return this;
    }

    async init() {
      // create an svg element
      this.svg = d3.select("body").append("svg");

      // fetch first data from source:
      this.data = [await this.fetch(this.root_key)];

      // initialize the simulation
      this.sim = d3.forceSimulation(this.data)
          .force("charge", d3.forceManyBody())
          .force("link", d3.forceLink(links))
          .force("center", d3.forceCenter())
          .on("tick", this.tick);

      // run the simulation and visualization
      update();
    }

    update() {

      // compare the content of the svg group "nodes" with our data
      // nodes represents the elements which were in both the svg and our data.
      let nodes = this.svg.selectAll("node")
        .data(this.data);

      // remove any nodes which were in the svg but not in our data.
      // FYI this is called the "exit" group
      nodes.exit().remove();

      // for every node in our data which was not in the svg (the "enter" group)
      // create a circle. Then merge this "enter" group with nodes. Finally,
      // update the positions of every svg element based on their node.
      nodes.enter().append("circle")
          .attr("r", 2.5)
        .merge(nodes)
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

    }
  }
});
