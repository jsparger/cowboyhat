define([], () => {

  function node_labels_string(n) {
    return n.labels.join(":");
  }

  function node_properties_string(n) {
    let properties = [];
    for (let k of Object.keys(n.properties)) {
      properties.push(`${k}:"${n.properties[k]}"`)
    }
    return `{${properties.join(",")}}`
  }

  function node_string(n, v="") {
    return `(${v}:${node_labels_string(n)} ${node_properties_string(n)})`;
  }

  // function result_parse(result) {
  //
  // }

  class Neo4jDatatase {
    constructor(url) {
      this.url = "bolt://" + url
      this.driver = neo4j.v1.driver(this.url, neo4j.v1.auth.basic("neo4j","neo4j"));
    }

    async run_query(query) {
      console.log(query);
      let session = this.driver.session();
      let result = await session.run(query);
      session.close();
      return result;
    }

    create_node(n) {
      let query = `CREATE ${node_string(n,"n")} RETURN n`;
      return this.run_query(query);
    }

    delete_node(n) {
      let query = `MATCH (n) where id(n)=${n.id} DETACH DELETE n`;
      return this.run_query(query);
    }
  }

  return {
    "Neo4jDatatase": Neo4jDatatase,
  };

});
