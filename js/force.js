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
      this._links = this._svg.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link");

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
      this._data = [{name: "root", fx: this._width/2+30, fy: this._height/2+30}, {name: "steve", parent: "root"}, {name: "joe", parent: "steve"}, {name: "robert", parent: "steve"}];

      // initialize the simulation
      this._sim = d3.forceSimulation()
          .force("charge", d3.forceManyBody().strength(-500))
          // .force("gravity", d3.forceManyBody().strength(300))
          .force("link", d3.forceLink().distance(10))
          // .force("forceX", d3.forceX(this._width/2))
          // .force("forceY", d3.forceY(this._height/2))
          // .force("center", d3.forceCenter(this._width/2, this._height/2))
          // .force("radial", d3.forceRadial(100, this._width/2, this._height/2))
          .on("tick", this.tick.bind(this));

      // run the simulation and visualization
      this.update();
    }

    create_hierarchy() {

      // This whole method is a hack to get the links made for us.
      // At some point this is prbably more confusing than building the
      // links ourselves.

      // turn our _data into a hierarchy (tree);
      // use "name" as the id
      // use "parent" as the parentID unless it doesn't exist. In that case,
      // return an empty string, which signifies the root node.
      this._hierarchy = d3.stratify()
      .id(function(d) { return d.name; })
      .parentId(function(d) { return d.parent ? d.parent : null; })
      (this._data);

      // get the nodes
      // node.data is where we find the objects from _data
      this._nodeData = this._hierarchy.descendants();

      // get the links from the hierarchy
      // this will return links between the nodes, but we want links between the
      // _data, so let's replace them.
      this._linkData = this._hierarchy.links();
      this._linkData.forEach( (l) => {
        l.source = l.source.data;
        l.target = l.target.data;
      });
    }

    update_selections() {
      // To understand this code, check out this explanation of d3.js selections.
      // detailed:   https://bost.ocks.org/mike/selection/
      // simplified: https://bost.ocks.org/mike/join/

      // Join our new _data with the old data in the selection (initially none),
      // updating any nodes associated with elements in _data and creating new.
      // nodes for new elements. In this case, we use the "name" property of
      // the node as the node "id".

      // After this call, we have four selections available to us:
      // _nodes: Nodes in both the new and old data which were updated.
      // _nodes.enter() : Nodes associated with any new elements in the _data
      // _nodes.exit()  : Nodes associated with any elements deleted from _data.
      this._nodes = this._nodes.data(this._data, function (d) { return d.name });

      // remove any nodes in the exit group.
      this._nodes.exit().remove();

      // for every new piece of data, create a circle in the svg group.
      // then merge the enter group with _nodes and store the result.
      this._nodes = this._nodes.enter()
          .append("circle")
          .attr("r", 10)
          .merge(this._nodes);

      // update _links
      this._links = this._links.data(this._linkData, function(d) { return d.source.name + "-" + d.target.name; });
      this._links.exit().remove();

      this._links = this._links.enter()
          .append("line")
          .merge(this._links);
    }

    restart_simulation() {
      this._sim.nodes(this._data);
      this._sim.force("link").links(this._linkData);
      this._sim.alpha(1).restart();
    }

    update() {

      // rearange our _data to be compatible with d3.
      this.create_hierarchy();

      // process any new or deleted data. This will also update the elements
      // in the visualization
      this.update_selections();

      // run the force simulation to animate the visualization
      this.restart_simulation();
    }

    tick() {

      // update the positions of the nodes in the svg based on their coordinates
      // as computed by the force layout.
      this._nodes
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

      // update the endpoints of the lines based on their source and end node
      // locations.
      this._links
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
    }
  }

  return {
    "Force": Force
  };
});
