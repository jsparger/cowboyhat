define(["d3"], (d3) => {

  class CCDB {
    constructor(url) {
      this._url = url;
      this._slots_url = this._url + "/rest/slots/";
      this._slot_names_url = this._url + "/rest/slotNames";
      this._count = 0;
      this._nodes = {};
    }

    query(url) {
      return new Promise(function (resolve, reject) {
        d3.json(url, function (error, result) {
            error ? reject(error) : resolve(result);
          });
      });
    }

    async get_slot(name) {
      if (this._nodes.hasOwnProperty(name)) {
        return this._nodes[name];
      }
      let node = await this.query(this._slots_url + name);
      node.uuid = ++this._count;
      this._nodes[name] = node;
      return node;
    }

    async get_slot_names() {
      if (!this._slot_names) {
        let json = await this.query(this._slot_names_url);
        this._slot_names = [];
        for (let slot of json.names) {
          this._slot_names.push(slot.name);
        }
      }
      return this._slot_names;
    }
  };

  return {
    "CCDB": CCDB,
  };
});
