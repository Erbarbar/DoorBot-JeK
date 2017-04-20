var express    = require('express');
var bodyParser = require('body-parser');
var gpio       = require('gpio');
var requestify = require('requestify');

var app = express();
var port = 3000;

var startTime = 0;
var endTime = 0;

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
	res.status(200).send('Hello World!');
});

app.listen(port, function(){
	console.log('Listening on port ' + port);
});

app.post('/', function(req, res, next){
	var userName = req.body.user_name;
	
	if(userName === 'slackbot' || userName === 'Door' || startTime != 0){
		console.log("YOU SHALL NOT PASS!\n");
		return res.status(200).end();
	} else {
		// liga verde
		gpio17.set(1); 
		console.log("green on!");
		
		startTime = getTime();
		console.log("start time = " + startTime);
		
		refreshTimer = setInterval(function(){
			if(gpio27.value == 1){
				console.log("Button press!");
				clearInterval(refreshTimer);
			
				// desliga verde
				gpio17.set(0);
				console.log("green off!");
		
		
				endTime = getTime();
				console.log("end time = " + endTime);
				
				var difTime = (endTime - startTime)/1000;
				startTime = 0;
				endTime = 0;
				console.log("Diff time = " + difTime);
		
				var botPayload = {
					text: 'The time was ' + difTime
				};
				return res.status(200).json(botPayload);
			}
		},60);
	}
			
});

// flashing lights if led is on GPIO4
//red led
var gpio4 = gpio.export(4, {
	direction: 'out',
	interval: 200,
	ready: function(){
		intervalTimer = setInterval(function() { 
			gpio4.set();
			setTimeout(function() { gpio4.reset(); },500);
		},500);
	}
});

// green led
var gpio17 = gpio.export(17, {
	direction: 'out',
	interval: 200,
	ready: function(){
		gpio17.reset();
	}
}); 

// button
var gpio27 = gpio.export(27, {
	direction: 'in',
	interval: 200,
	ready: function(){
		//gpio27.on("change", function(val){
		//	if(!val && gpio17){
		//		gpio17.reset(); 
		//		Console.log("Someone is on the way!");
		//	}
		//});
	}
});

function getTime(){
	var date = Date.now();
	return (date);
}