/*
	gogo.js - An IRC bot used in #StartupGo for handling HackerNews things

	Dependencies:
		Node.js
		npm install irc

	Copyright (c) 2013 Jesse Horne

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/

var irc = require("irc");
var http = require("http");
var fs = require("fs");

var users = [];
var dataFile = "users.txt";

var conf = {
	server: "irc.freenode.net",
	channels: ["##jesseh"],
	name: "GoGoBot"
};

var bot = new irc.Client(conf.server, conf.name, {
	channels: conf.channels
});

var users_stat = fs.statSync(dataFile);
if (users_stat.size > 0) {
	user_arr = fs.readFileSync(dataFile).toString().split(" ");
	for (var i=0; i<user_arr.length; i++) {
		register(user_arr[i], "private");
	}
}

bot.addListener("join", function(channel, who) {
	if (who != conf.name) {
		bot.say(channel, who + ", welcome! Use '!register <hacker news username>' if you have not already.");
	}
});

function save() {
	var data = "";
	for (var i=0; i<users.length; i++) {
		if (i == 0) {
			data += users[i].name;
		} else {
			data += " " + users[i].name;
		}
	}
	fs.writeFileSync(dataFile, data.toString())
}

function register(username, option) {
	if (username) {
		var options = {
			host: "api.thriftdb.com",
			path: "/api.hnsearch.com/users/_search?q=" + username
		};
		callback = function(response) {
			var str = '';
			response.on("data", function (chunk) {
				str += chunk;
			});
			response.on("end", function() {
				userObj = {
					name: username,
					json: JSON.parse(str)
				};
				users.push(userObj);
				save();
			});
		};

	http.request(options, callback).end();

		if (option == "public") {
			bot.say(conf.channels[0], "User " + username + " was successfully registered!");
		}
	} else {
		bot.say(conf.channels[0], "Please supply a second argument to '!register'.");
	}
}

function listUsers() {
	str = "";
	for (var i=0; i<users.length; i++) {
		str += users[i].name;
		if (i - users.length-1) {
			str += ", ";
		}
	}
	bot.say(conf.channels[0], "Users: " + str);
}

function unregister(username) {
	if (username) {
		for (var i=0; i<users.length; i++) {
			if (users[i] == username) {
				users.splice(i, 1);
				bot.say(conf.channels[0], "Successfully unregistered " + username + "!");
				break;
			}
		}
	} else {
		bot.say(conf.channels[0], "Please supply a second argument for '!unregister'.");
	}
}

function hits(name) {
	if (name) {
		for (var i=0; i<users.length; i++) {
			if (users[i].name == name) {
				bot.say(conf.channels[0], users[i].json.hits);
			}
		}
	} else {
		bot.say(conf.channels[0], "Please supply a second argument for '!hits'.");
	}
}

function printJSON(name) {
	for (var i=0; i<users.length; i++) {
		if (users[i].name == name) {
			console.log(users[i].json.hits);
		}
	}
}

function username(name) {
	if (name) {
		for (var i=0; i<users.length; i++) {
			if (users[i].name == name) {
				bot.say(conf.channels[0], users[i].json.results[0].item.username);
			}
		}
	} else {
		bot.say(conf.channels[0], "Please supply a second argument for '!user'.");
	}
}

bot.addListener('error', function(message) {
    console.log('error: ', message);
});

bot.addListener("message", function(from, to, text, message) {
	message = text.split(" ");
	if (message[0] == "!register") {
		register(message[1], "public");
	} else if (message[0] == "!unregister") {
		unregister(message[1]);
	} else if (message[0] == "!list") {
		listUsers();
	} else if (message[0] == "!hits") {
		hits(message[1]);
	} else if (message[0] == "!username") {
		username(message[1]);
	}
});