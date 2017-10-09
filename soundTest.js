var play = require('play')

 
play.sound('./sound.mp3', function(){

    
  });

play.on('error', function () {
    console.log('I cant play!');
  });
