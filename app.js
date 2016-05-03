var express = require('express'),
    multer = require('multer'),
    path = require('path'),
    fs = require('fs'),
    bodyParser = require('body-parser')

var app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'app')));
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));

/////db
var mongoose = require('mongoose');
// Connect to mongodb
var connect = function () {
    var options = {server: {socketOptions: {keepAlive: 1}}};
    mongoose.connect('mongodb://localhost:27017/grapheditor', options);
};
connect();

var Schema = mongoose.Schema;

var GraphSchema = new Schema({name: String, json: String, date: {type: Date, default: Date.now}});
//定义静态方法
GraphSchema.statics.findByName = function (name, cb) {
    this.find({name: new RegExp(name, 'i')}, cb);
}
var Graph = mongoose.model('graphs', GraphSchema);

function saveGraph(name, json, cb) {
    var graph = new Graph({name: name, json: json});
    graph.save(cb);
    return graph;
}

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Start the application after the database connection is ready
app.listen(3000);
console.log("Listening on port 3000");

function dropDB(cb) {
    Graph.remove({}, function (err) {
        if (err) return console.error(err);
        if (cb) {
            cb.call();
        }
    })
}

//dropDB();

var defaultGraph, defaultGraphName = 'Default Graph';

function initDB() {
    dropDB(function () {
        var json = fs.readFileSync('data/default.json', 'utf8');
        defaultGraph = saveGraph(defaultGraphName, json);
    })
}

Graph.findOne({name: defaultGraphName}, function (err, graph) {
    if (!graph) {
        return initDB();
    }
    defaultGraph = graph;
});
app.get('/data', function (req, res) {
    if (!defaultGraph) {
        return;
    }
    res.send(defaultGraph);
})

app.post('/save', function (req, res) {
    var json = req.body.json;
    if (json) {
        var name = req.body.name;
        if (name && name != defaultGraphName) {
            return saveGraph(req.body.name, json, function (err, saved) {
                if (err) return console.error(err);
                res.send('save success - ' + name);
            })
        }

        defaultGraph.json = json;
        defaultGraph.save(function (err, updated) {
            if (err) return console.error(err);
            res.send('save success - ' + defaultGraphName);
        });
    }
})

app.get("/list", function (req, res) {
    Graph.find(function (err, list) {
        if (err) return console.error(err);
        res.send(list);
    })
});

app.get('/data/:id', function (req, res) {
    Graph.findById(req.params.id, function (err, model) {
        if (err) return console.error(err);
        res.send(model);
    })
})

app.post('restore', function(req, res){
    initDB();
})