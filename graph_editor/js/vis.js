define(["d3"], (d3) => {

  class ForceSimulation {

    constructor(width,height) {
      this._sim = null;
      this._nodes = {};
      this._links = {};
      this._width = width;
      this._height = height;
    }

    init() {
      // initialize the simulation
      this._sim = d3.forceSimulation()
        .force("charge", d3.forceManyBody().distanceMax(50).strength(-30))
        .force("gravity", d3.forceManyBody().distanceMin(50).strength(30))
        .force("link", d3.forceLink().distance(50).strength(1))
        // .force("center", d3.forceCenter(this._width/2, this._height/2));
        // .on("tick", this.tick.bind(this));
    }

    is_relationship(x) {
      return (x.source && x.target);
    }

    add(x) {
      if (this.is_relationship(x)) {
        this.add(x.source);
        this.add(x.target);
        this._links[x.id] = x;
      }
      else {
        x.x = this._width/2;
        x.y = this._height/2;
        this._nodes[x.id] = x;
      }
    }

    remove(x) {
        if (this.is_relationship(x)) {
          this.remove(x.source);
          this.remove(x.target);
          delete this._links[x.id];
        }
        else {
          delete this._nodes[x.id];
        }
    }

    restart_simulation() {
      this._sim.nodes(Object.values(this._nodes));
      this._sim.force("link").links(Object.values(this._links));
      this._sim.alpha(1).restart();
    }
  }

  class ForceVisualization {

    constructor(width, height) {
      this._width = width;
      this._height = height;
    }

    init() {
      // create svg
      this._svg = d3.select("#force").append("svg")
        .attr("id", "forcesvg")
        .attr("preserveAspectRatio", "none")
        .attr("viewBox", `0 0 ${this._width} ${this._height}`)
        .classed("svg-content", true);
        // .on('mousedown', this.mousedown.bind(this));

      // create groups in the svg for links and nodes
      // do links first so links will be drawn underneath nodes.
      this._links = this._svg.append("g").selectAll(".link");
      this._nodes = this._svg.append("g").selectAll(".node");
    }

    update_entity_list(n,r) {
      this.update_nodes(n);
      this.update_links(r);
    }

    update_nodes(n) {
      this._nodes = this._nodes.data(n, (d) => { return d.id; });
      this._nodes.exit().remove();
      let nodeEnter = this._nodes.enter()
        .append("g")
        .attr("class","node");

      nodeEnter.append("circle")
        .attr("r", 5);

      this._nodes = nodeEnter.merge(this._nodes);

      // this._nodes.selectAll("circle")
      //   .style("fill", this.node_color.bind(this));
    }

    update_links(r) {
      this._links = this._links.data(r, function(d) { return d.id; });
      this._links.exit().remove();
      let linkEnter = this._links.enter()
        .append("g")
        .attr("class","link");

      linkEnter.append("line");

      this._links = linkEnter.merge(this._links);

      // this._links.selectAll("line")
      //   .style("stroke", this.link_color.bind(this));
    }

    tick() {
      // update the positions of the nodes in the svg based on their coordinates
      // as computed by the force layout.
      // this._nodes
      //   .attr("cx", function(d) { return d.x; })
      //   .attr("cy", function(d) { return d.y; });

      this._nodes.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

      // update the endpoints of the lines based on their source and end node
      // locations.
      this._links.selectAll("line")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x })
        .attr("y2", function(d) { return d.target.y });

      // // update the link labels. Put them at the midpoint of the link line
      // this._links.selectAll("text")
      //   .attr("x", function(d) { return (this._data[d.target.name].x + this._data[d.source.name].x)/2; }.bind(this))
      //   .attr("y", function(d) { return (this._data[d.target.name].y + this._data[d.source.name].y)/2; }.bind(this));
      }
  }

  return {
    "ForceSimulation": ForceSimulation,
    "ForceVisualization": ForceVisualization,
  };
});
