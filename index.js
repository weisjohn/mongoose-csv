
var _ = require('lodash');

module.exports = function(schema, options) {

    var paths = _(schema.tree).keys().without('_id', 'id').map(function(key) {
        return { name : key, value : schema.tree[key] }
    }).filter(function(node) {
        // remove paths that are annotated with csv: false
        return typeof node.value.csv === 'undefined' || node.value.csv;
    }).filter(function(node) {
        // remove virtuals that are annotated with csv: false
        var opts = node.value.options;
        if (!opts) return true;
        return typeof opts.csv === 'undefined' || opts.csv;
    }).filter(function(node) {
        // remove complex object types
        var path = schema.paths[node.name];
        if (!path) return true;
        if (path.instance === 'Array' || path.instance === 'Object') return false;
        return true;
    }).pluck('name').value();

    // put the _id at the beginning
    paths.unshift('_id');

    console.log(paths);

    schema.statics.csv_headers = function() {
        return paths;
    }

    schema.methods.toCSV = function() {
        var doc = this;

        // TODO: map 
    }

};
