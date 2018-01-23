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
      this._selected = null;
    }

    fetch(f) {
      this._fetch = f;
      return this;
    }

    root_key(key) {
      this._root_key = key;
      return this;
    }

    nodeSelect(f) {
      this._nodeSelect = f;
      return this;
    }

    make_node(name) {
      return {name: name, links: []};
    }

    async init() {

      // create an svg element and select it.
      // setting the width and height is very important
      this._svg = d3.select("#force").append("svg")
        .attr("id", "forcesvg")
        // .attr("width", this._width)
        // .attr("height", this._height);
        // .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("preserveAspectRatio", "none")
        .attr("viewBox", `0 0 ${this._width} ${this._height}`)
        .classed("svg-content", true)
        .on('mousedown', this.mousedown.bind(this));

      // create groups in the svg for links and nodes
      // do links first so links will be drawn underneath nodes.
      this._links = this._svg.append("g").selectAll(".link");
      this._nodes = this._svg.append("g").selectAll(".node");

      // this._cursor = this._svg.append("circle")
      //   .attr("r", 30)
      //   .attr("transform", "translate(-100,-100)")
      //   .attr("class", "cursor")
      //   .attr("visibility","hidden");
      // create a border for the svg.
      // this._svg.append("rect")
      //  			.attr("x", 0)
      //  			.attr("y", 0)
      //  			.attr("height", this._width)
      //  			.attr("width", this._height)
      //       .style("stroke", 'black')
      //  			.style("fill", "none")
      //  			.style("stroke-width", 5);

      // fetch first data from source:
      // this._data = [await this._fetch(this._root_key)];
      // for example with a few balls
      // this._data = [{name: "root", fx: this._width/2+30, fy: this._height/2+30}, {name: "steve", parent: "root"}, {name: "joe", parent: "steve"}, {name: "robert", parent: "steve"}];
      // this._data = {this._root_key: {name: this._root_key}};
      this._data = {};
      let root_node = this.make_node(this._root_key);
      root_node.x = this._width/2;
      root_node.y = this._height/2;
      this._data[this._root_key] = root_node;
      this._fetch(this._root_key);

      // initialize the simulation
      this._sim = d3.forceSimulation()
          .force("charge", d3.forceManyBody().strength(-100))
          // .force("gravity", d3.forceManyBody().strength(300))
          .force("link", d3.forceLink().distance(100).strength(1))
          // .force("forceX", d3.forceX(this._width/2))
          // .force("forceY", d3.forceY(this._height/2))
          .force("center", d3.forceCenter(this._width/2, this._height/2))
          // .force("radial", d3.forceRadial(100, this._width/2, this._height/2))
          .on("tick", this.tick.bind(this));

      // run the simulation and visualization
      this.update();
    }

    assimilate(node) {
      // create a new node from the input CCDB node (this should be abstracted)
      let d = this.make_node(node.name);

      // copy the old coordinates
      let old_d = this._data[d.name];
      if (old_d) {
        d.x = old_d.x; d.vx = old_d.vx; d.fx = old_d.fx;
        d.y = old_d.y; d.vy = old_d.vy; d.fy = old_d.fy;
      }

      // look for links in the CCDB node
      let relationships = ['children','controls','powers'];
      for (let r of relationships) {
        let target_names = node[r];
        if (!target_names) continue;

        // for each linked node named "n" in the relationship "r".
        for (let n of target_names) {
          // pre-fetch the node
          this._fetch(n);
          // if we don't already have a node with the linked node's name,
          // create one.
          let linked_node = this._data[n];
          if (!linked_node) {
            linked_node = this.make_node(n);
            linked_node.x = d.x;
            linked_node.y = d.y
            this._data[n] = linked_node;
          }
          // create a link and put it in d.
          // d.links.push({source: d, target: linked_node, link_type: r});
          d.links.push({source: {name: d.name}, target: {name: n}, link_type: r});
        }
      }

      // indicate that we have fetched the node.
      d.fetched = true;

      // make sure new node stays selected.
      if (this._selected === old_d) {
        this._selected = d;
      }

      // add the newly populated node to our data, overriting any old one
      this._data[d.name] = d;

      // return it just for good measure.
      return d;
    }

    create_links() {
      this._linkData = [];
      for (let d of Object.values(this._data)) {
        for (let l of d.links) {
          let link = {
            source: this._data[l.source.name],
            target: this._data[l.target.name],
            link_type: l.link_type
          };
          this._linkData.push(link);
        }
      }
    }

    update_nodes() {
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
      this._nodes = this._nodes.data(Object.values(this._data), function (d) { return d.name });
      // remove any nodes in the exit group.
      this._nodes.exit().remove();
      // for every new piece of data (the enter grouop), create a new svg group
      let nodeEnter = this._nodes.enter()
          .append("g")
          .attr("class","node")
          .on("click", this.click.bind(this))
          .on("dblclick", this.dblclick.bind(this))
          .call(d3.drag()
            .on("start", this.dragstarted.bind(this))
            .on("drag", this.dragged.bind(this))
            .on("end", this.dragended.bind(this)));
      // append a circle to each group to represent the node. Make it clickable,
      //  binding "this" so it behaves correctly.
      nodeEnter.append("circle")
        .attr("r", (d) => { return d.name==="_ROOT"?20:5;});
      // append a text to each group to act as the node label.
      nodeEnter.append("text")
        .attr("dy", (d) => { return d.name==="_ROOT"?"0.35em":"1.35em";})
        .text(function (d) {
          // take area structure out of names
          if (d.name === "_ROOT") return "ESS";
          return d.name.split(":").pop();
        })

      // merge the enter group with _nodes to store the results
      this._nodes = nodeEnter.merge(this._nodes);

      this._nodes.selectAll("circle")
        .style("fill", this.node_color.bind(this));
    }

    update_links() {
      // update _links
      this._links = this._links.data(this._linkData, function(d) { return d.source.name + "-" + d.link_type + "-" + d.target.name });
      // remove any links in the exit group.
      this._links.exit().remove();
      // create groups for the links and their labels
      let linkEnter = this._links.enter()
        .append("g")
        .attr("class","link")
      // append a line to each group to represent the link
      linkEnter.append("line");
      // append a text to each group to act as the link label
      linkEnter.append("text")
        .attr("dy", "0.35em")
        .text(function (d) {
          return d.link_type;
        });
      // merge the new link groups with the existing
      this._links = linkEnter.merge(this._links);

      this._links.selectAll("line")
        .style("stroke", this.link_color.bind(this));
    }

    update_selections() {
      this.update_nodes();
      this.update_links();
    }

    restart_simulation() {
      this._sim.nodes(Object.values(this._data));
      this._sim.force("link").links(this._linkData);
      this._sim.alpha(1).restart();
    }

    update() {

      // rearange our links to be compatible with d3.
      this.create_links();

      // process any new or deleted data. This will also update the elements
      // in the visualization
      this.update_selections();

      // run the force simulation to animate the visualization
      this.restart_simulation();
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
        .attr("x1", function(d) { return this._data[d.source.name].x; }.bind(this))
        .attr("y1", function(d) { return this._data[d.source.name].y; }.bind(this))
        .attr("x2", function(d) { return this._data[d.target.name].x; }.bind(this))
        .attr("y2", function(d) { return this._data[d.target.name].y; }.bind(this));

      // update the link labels. Put them at the midpoint of the link line
      this._links.selectAll("text")
        .attr("x", function(d) { return (this._data[d.target.name].x + this._data[d.source.name].x)/2; }.bind(this))
        .attr("y", function(d) { return (this._data[d.target.name].y + this._data[d.source.name].y)/2; }.bind(this));
    }

    // async select(name) {
    //   if (!this._data[name]) {
    //     let node = await this._fetch(name);
    //     this.assimilate(node);
    //     this.update();
    //     if (node.parents && node.parents[0]) {
    //       await this.select(node.parents[0]);
    //     }
    //   }
    //   else if (!this._data[name].fetched) {
    //     this.assimilate(await this._fetch(name));
    //   }
    //   this._selected = this._data[name];
    //   this.update();
    //   this._nodeSelect(await this._fetch(name));
    // }

    async select(name) {
      if (!this._data[name]) {
        let node = await this._fetch(name);
        if (node.parents && node.parents[0]) {
          await this.select(node.parents[0]);
        }
      }

      await this.dblclick(this.make_node(name));
      this._selected = this._data[name];
      this.update();
      this._nodeSelect(await this._fetch(name));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async click(d) {
      if (d3.event.defaultPrevented) return; // ignore drag
      // if (d.busy) return;
      d.busy = true;
      this._selected = this._data[d.name];
      this.update_selections();
      let node = d.user_created ? d : await this._fetch(d.name);
      this._nodeSelect(node);
      d.busy = false;
      this.update_selections();
    }

    async dblclick(d) {
      if (d3.event && d3.event.defaultPrevented) return; // ignore drag
      // if (d.busy) return;
      d.busy = true;
      this.update_selections();
      if (!this._data[d.name] || !this._data[d.name].fetched) {
        this.assimilate(await this._fetch(d.name));
      }
      // TODO:
      // d.expanded ? this._collapse(this) : this._expand(this);
      d.busy = false;
      this.update();
    }

    mousedown() {
      console.log("mousedown");
      if (d3.event.shiftKey) {
        console.log("shift+mousedown");
        if (!this._selected) return;
        let name = `${Date.now()}:NEW`;
        let d = this.make_node(name);
        d.user_created = true;
        d.x = this._selected.x;
        d.y = this._selected.y;
        this._data[name] = d;
        // d.links.push({target: {name: this._selected.name}, source: {name: d.name}, link_type: "parent"});
        // TODO: this is correct but requires changes elsewhere.
        this._selected.links.push({source: {name: this._selected.name}, target: {name: d.name}, link_type: "children"});
      }
      else {
        this._selected = null;
        this.update_selections();
        this._nodeSelect({});
      }
      this.update();
    }

    dragstarted(d) {
      // TODO: I don't know what this is doing.
      if (!d3.event.active) this._sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    dragged(d) {
      let node = this._data[d.name];
      node.fx = d3.event.x;
      node.fy = d3.event.y;
    }

    dragended(d) {
      // TODO: I don't know what this is doing.
      if (!d3.event.active) this._sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    node_color(d) {
      let node = this._data[d.name];
  		if (d.busy) {
      	return "#20FF00"; // busy
      }
      else if (this._selected === node) {
        // return "red";
        return "#20FF00"
      }
      else if (node.user_created) {
        return "red";
      }
      else if (!node.fetched) {
        return "#3182bd"; // collapsed package
      }
      else if (node.links.length > 0) {
        return "#c6dbef"; // parent
      }
      else {
        // return "#fd8d3c"; // leaf node
        return "#c6dbef";
      }
    }

    link_color(d) {
      let colors = {
        children: "#9ecae1",
        powers: "red",
        controls: "darkorange",
      };

      return colors[d.link_type];
    }

  }

  return {
    "Force": Force
  };
});
