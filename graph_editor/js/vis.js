define(["d3"], (d3) => {

  class ForcePhysics {

    constructor() {
      this._sim = null;
      this._nodes = null;
      this._inks = null;
    }

    init() {
      // initialize the simulation
      this._sim = d3.forceSimulation()
        .force("charge", d3.forceManyBody().strength(-100))
        .force("link", d3.forceLink().distance(100).strength(1))
        .force("center", d3.forceCenter(this._width/2, this._height/2))
        .on("tick", this.tick.bind(this));
    }

    is_relationship(x) {
      return (x.start && x.end);
    }

    add(x) {
      if (is_relationship(x)) {
        this.add(x.start);
        this.add(x.end);
        this._links[x.id] = x;
      }
      else {
        this._nodes[x.id] = x;
      }
    }

    remove(x) {
        if (is_relationship(x)) {
          this.remove(x.start);
          this.remove(x.end);
          delete this._links[x.id];
        }
        else {
          delete this._nodes[x.id];
        }
    }

    restart_simulation() {
      this._sim.nodes(this._nodes);
      this._sim.force("link").links(this._links);
      this._sim.alpha(1).restart();
    }
  }

  class ForceVisualization {

    constructor() {
      // TODO
    }

    init() {
      // create groups in the svg for links and nodes
      // do links first so links will be drawn underneath nodes.
      this._links = this._svg.append("g").selectAll(".link");
      this._nodes = this._svg.append("g").selectAll(".node");
    }

    update_entity_list(n,r) {
      update_nodes(n);
      update_links(r);
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

      this._nodes.selectAll("circle")
        .style("fill", this.node_color.bind(this));
    }

    update_links(r) {
      this._links = this._links.data(r, function(d) { return d.id; });
      this._links.exit().remove();
      let linkEnter = this._links.enter()
        .append("g")
        .attr("class","link");

      linkEnter.append("line");

      this._links = linkEnter.merge(this._links);

      this._links.selectAll("line")
        .style("stroke", this.link_color.bind(this));
    }

    update_positions(n,r) {
      // TODO
    }
  }

  return {
    "ForceVisualization": ForceVisualization,
  };
});
