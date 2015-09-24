
var _ = require('lodash');
var mapstream = require('map-stream');
var mongoose;

try {
    mongoose = require('mongoose');
} catch(e) {
    var prequire = require('parent-require');
    mongoose = prequire('mongoose');
}


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
        return array_to_row(props);
    }

    schema.methods.toCSV = function() {
        var doc = this;
        var json = doc.toJSON({ deleted : true, virtuals : true });

        // map the props to values in this doc
        return array_to_row(props.map(function(prop) {
            return json[prop];
        }));
    }

    // register a global static function to stream a file repsonse
    if (mongoose.Query.prototype.csv) return;
    mongoose.Query.prototype.csv = function(stream) {

        // write header
        stream.write(this.model.csv_headers());

        // write data
        this.stream()
            .pipe(mapstream(function(data, cb) {
                cb(null, data.toCSV());
            }))
            .pipe(stream);
    }

};

// generate the line in the CSV file
function array_to_row(arr) {
    return arr.map(prop_to_csv).join(',') + '\n';
}

// return empty string if not truthy, escape quotes
function prop_to_csv(prop) {
    return '"' + (String(prop) || "").replace(/"/g, '""') + '"';
}