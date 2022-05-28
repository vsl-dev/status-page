const express = require('express');
const bodyparser = require("body-parser");
const session = require("express-session");
const path = require("path");
const ejs = require("ejs");
const url = require("url"); 
const rateLimit = require("express-rate-limit")
const moment = require('moment')
var momento = require('moment-timezone');
const axios = require("axios")
const request = require('request')
const app = express();
var clc = require("cli-color");
const config = require('./config.json')
const now = moment().format("YYYY, MM, DD, HH:mm")
const port = 8080
const {
	JsonDatabase
} = require("wio.db");
const db = new JsonDatabase({
	databasePath: "./db/database.json"
});
const log = new JsonDatabase({
	databasePath: "./db/logs.json"
});

// View engines & others

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));
app.engine("html", ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "/web/views"));
app.use(express.static(path.join(__dirname, "/web/public")));
app.set('json spaces', 1)

// Pages

app.get('/', (req, res) => { 
	const vsl = Object.values(config.links)
	res.render('index', {
		user: req.user,
		config, req, vsl, db, moment, log
	})
})

setInterval(() => {
  var links = config.links;
  if (!links) return;
  var linkA = Object.values(links)
  var lnks = linkA.map(c => c);
  lnks.forEach(link => {
request(link.link, function (error, response) {
  console.log(link)
  console.error('error:', error);
  console.log('statusCode:', response && response.statusCode);
	if(error == null) {
  var Data = {
	  "last_req": now,
	  "status_code": response.statusCode,
	  "error": false
  }
  var LogData = {
	  "id": link.link_id,
	  "last_req": now,
	  "status_code": response.statusCode,
	  "error": false
  }
	} else {
  var Data = {
	  "last_req": now,
	  "status_code": 999,
	  "error": true
  }
  var LogData = {
	  "id": link.link_id,
	  "last_req": now,
	  "status_code": 999,
	  "error": true
  }
	}
	db.add('requests.total', 1)
	db.set(`requests.${link.link_id}`, Data)
	log.push(`${link.link_id}`, LogData)

});
});
}, config.refresh_time)

 // random string generator

function randomstring(length) {
	var result = '';
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() *
			charactersLength));
	}
	return result;
} 

// Other

app.listen(port, () => {
	console.log('[System Manager]: System running on port ' + port)
	console.log('[System Manager]: https://github.com/vsl-dev')
})