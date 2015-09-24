
var _ = require('lodash');

module.exports = function(schema, options) {
    
    var props = _(schema.tree).keys().without('_id', 'id')
        
        // opt-out private path names which start with `__`
        .filter(function(key) { return !/^__/.test(key); })
        
        // transform the schema tree into an array for filtering
        .map(function(key) { return { name : key, value : schema.tree[key] } })
        
        // remove paths that are annotated with csv: false
        .filter(function(node) {
            return typeof node.value.csv === 'undefined' || node.value.csv;
        })
        
        // remove virtuals that are annotated with csv: false
        .filter(function(node) {
            var opts = node.value.options;
            if (!opts) return true;
            return typeof opts.csv === 'undefined' || opts.csv;
        })
        
        // remove complex object types
        .filter(function(node) {
            var path = schema.paths[node.name];
            if (!path) return true;
            return (path.instance !== 'Array' && path.instance !== 'Object')
        })
        
        // materialize , end chain
        .pluck('name').value();

    // _id at the beginning
    props.unshift('_id');

    schema.statics.csv_headers = function() {
        return props;
    }

    schema.methods.toCSV = function() {
        var doc = this;
        
    }

};
