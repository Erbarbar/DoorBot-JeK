var express    = require('express');
var bodyParser = require('body-parser');
var gpio       = require('gpio');
var Slack      = require('slack-node');
var fs         = require('fs');
var jsonfile   = require('jsonfile'); 

var app = express();
slack = new Slack();
var port = 3000; // same port as ngrok
var highScoresFile = 'HighScores.json';

// number of milliseconds elapsed since 1 January 1970 
var startTime = 0; // when the user is notified
var endTime   = 0; // when the user returns from opening the door

var messageLink = process.env.LINK;
var token       = process.env.TOKEN;

slack.setWebhook(messageLink);

app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(req, res) {
  res.status(200).send('Hello World!\n');
});

app.listen(port, function(){
  console.log('Listening on port ' + port);
  console.log(messageLink);
});



//===========================================================

app.post('/', function(req, res, next) {

  var requesterName = req.body.user_name;
  var channel = req.body.trigger_word;
  var tok = req.body.token;   
  // make sure there are no message loops, and only one user is being timed
  if(requesterName === 'slackbot' || requesterName === 'Door' || startTime != 0 || tok !== token){
    console.log('YOU SHALL NOT PASS!\n');
    return res.status(200).end();
  } else {
    // Turn on red LED (TODO: sound buzzer)
    var chosenName = OnDoorCall(channel, requesterName);
    
    // checks if button was pressed in 10ms intervals
    firstButtonPressCheck = setInterval(function() {
      if (gpio27.value == 1) { 
        clearInterval(firstButtonPressCheck);

        console.log('\nBUTTON -> press (1)');
        OnFirstButtonPress(requesterName,chosenName);
    
        // checks if button was released in 60ms intervals
        firstButtonReleaseCheck = setInterval(function() {
          if (gpio27.value == 0) {
            clearInterval(firstButtonReleaseCheck);

            console.log('BUTTON -> release (1)');

            // checks if button was pressed in 10ms intervals
            secondButtonPressCheck = setInterval(function() {
              if (gpio27.value == 1) {
                clearInterval(secondButtonPressCheck); 

                console.log('\nBUTTON -> press (2)');
                var score = OnSecondButtonPress(requesterName,chosenName);  

                // checks if button was released in 60ms intervals
                secondButtonReleaseCheck = setInterval(function() {
                  if (gpio27.value == 0) {
                    clearInterval(secondButtonReleaseCheck);

                    console.log('BUTTON -> release (2)');
                    updateScore(chosenName, score);
                    startTime = 0;
                    endTime = 0;
                    return res.status(200).end();
                  }
                },60);
              }
            },10);
          }
        },60);
      }
    },10);
  } 
});

function updateScore(playerName, playerScore){
  var highScore;
  var obj = JSON.parse(fs.readFileSync(highScoresFile, 'utf8'));
  for(var s in obj.scores) {
      console.log(obj.scores[s].name + '-> ' + obj.scores[s].score);
      if (obj.scores[s].name === playerName) {
        console.log('\nfound name');
        if (obj.scores[s].score > playerScore) {
          console.log(obj.scores[s].score + ' > ' + playerScore + '\n');
          obj.scores[s].score = playerScore;
        }
        return;
      }
  }
  obj.scores[name] = playerName;
  obj.scores[score] = playerScore;

  jsonfile.writeFile(highScoresFile, scores, function(err){
    if (err)
      console.error(err);
  })
}

function sendMessage(msgChannel, msgText) {
  slack.webhook({
    channel:msgChannel,
    username:'HODOR',
    text:msgText
  }, function(err, response) {
    if(err === null)
      console.log('[MESSAGE]\n' + msgChannel + ' -> ' + msgText);
  });
}

function pickRandom(department) {
  var members = JSON.parse(fs.readFileSync('members/' + department + '.json', 'utf8'));
  var chosenOne = members[Math.floor(Math.random() * members.length)];
  console.log('pickRandom -> ' + chosenOne);

  return chosenOne;
};

// flashing lights if led is on GPIO4
//green led
var gpio4 = gpio.export(4, {
  direction: 'out',
  interval: 200,
  ready: function(){
    intervalTimer = setInterval(function() { 
      gpio4.set();
      setTimeout(function() { 
        gpio4.reset(); 
      },500);
    },500);
  }
});

// red led
var gpio17 = gpio.export(17, {
  direction: 'out',
  interval: 200,
  ready: function() {
    gpio17.reset();
  }
}); 

// button
var gpio27 = gpio.export(27, {
  direction: 'in',
  interval: 200
});

function OnDoorCall(callerChannel, callerName){
  // Green ON
  gpio17.set(1); 
  console.log('Gren LED -> ON');

  // get a random user
  var chosenName = pickRandom(callerChannel);
  var channel = '@' + chosenName;
  var privateMessage = '@' + callerName + ' pede que abras a porta, por favor!';
  var publicMessage = '@' + chosenName + ' é a tua vez de abrir a porta :heart:';
  sendMessage(channel, privateMessage);
  sendMessage('#door-channel',publicMessage);

  return chosenName;
}

function OnFirstButtonPress(requester, buttonPresser) {

  // Green OFF
  gpio17.set(0);
  console.log('Gren LED -> OFF');

  // start the timer
  startTime = getTime();
  console.log('Start time -> ' + startTime);

  // at this time, the user should be on his way to get the door
  var msgChannel = '@' + requester;
  var msgText = '@' + buttonPresser + ' está a caminho!';
  sendMessage(msgChannel,msgText);
}

function OnSecondButtonPress(requesterName, chosenName) {

  // stop the timer
  endTime = getTime();
  console.log('End time -> ' + endTime);

  var deltaTime = getDeltaTime();
  var timeString = getTimeString(deltaTime);
  var publicMessage = '@' + chosenName + ' abriu a porta em ' + timeString + '!';
  sendMessage('#door-channel',publicMessage);

  return deltaTime;
}

function getDeltaTime() {
  // get diff time inseconds
  var deltaTime = Math.round((endTime - startTime)/1000);
  console.log('Delta time -> ' + deltaTime);

  return deltaTime;
}

function getTime() {
  var date = Date.now();

  return (date);
}

var getTimeString = function(deltaT) {
  var hours = 0;
  var minutes = 0;
  var seconds = 0;
  var string = '';
  while (deltaT >= (3600)) {
    hours++;
    deltaT -= 3600;
  }

  while (deltaT >= 60) {
    minutes++;
    deltaT -= 60;
  }

  while (deltaT >= 1) {
    seconds++;
    deltaT-= 1;
  }

  if (hours > 0) {
    string = hours + ' hora';
    if (hours > 1)
      string = string + 's';

    string = string + ', ';
  }

  if (minutes > 0) {
    string = string + minutes + ' minuto';
    if (minutes > 1)
      string = string + 's';

    string = string + ' e ';
  }

  string = string + seconds + ' segundo';
    if (seconds > 1)
      string = string + 's';

  return string;
}
