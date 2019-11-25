"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
const dns = require("dns");

var cors = require("cors");

var app = express();

var router = express.Router();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.set("useNewUrlParser", true);
mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true
});

// Shemas
var Schema = mongoose.Schema;
var shortLink = new Schema({
  original_url: String,
  short_url: Number
});

// Model
var Link = mongoose.model("link", shortLink);

app.use(cors());

/** this project needs to parse POST bodies **/
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// api endpoint short url
app.post("/api/shorturl/new", function(req, res) {
  var validUrl = req.body.url.replace(/(http:\/\/)|(https:\/\/)/, "");
  console.log(validUrl);

  dns.lookup(validUrl, function(err, address) {
    if (err) return res.json({ error: "invalid URL" });

    Link.countDocuments(function(err, count) {
      if (err) return console.error(err);
      console.log("there is %d documents", count);

      var newLink = new Link({
        original_url: req.body.url,
        short_url: count + 1
      });

      newLink.save(function(err, data) {
        if (err) return console.error(err);
        return data;
      });
      res.json({
        original_url: newLink.original_url,
        short_url: newLink.short_url
      });
    });
  });
});

app.get("/api/shorturl/:number", function(req, res) {
  var shortcut = req.params.number;
  var shortUrlFilter = new RegExp(/(^\d+$)/);

  shortUrlFilter.test(shortcut)
    ? Link.findOne({ short_url: shortcut }, function(err, data) {
        if (err) return console.error(err);
        data ? res.redirect(data.original_url) : res.send("404: SHORTCUT NOT FOUND");
      })
    : res.send("INVALID SHORCUT SINTAX");
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
