var soundManager = function()
{

	var snd = {
		'm1': new Audio("assets/sound/monster_1.wav"),
		'm2': new Audio("assets/sound/monster_2.wav"),
		'm3': new Audio("assets/sound/monster_3.wav"),
		'm4': new Audio("assets/sound/monster_4.wav"),
		'a1': new Audio("assets/sound/ambient_1.wav"),
		'o1': new Audio("assets/sound/klick_1.wav")
	};


	this.play = function(key){
		snd[key].play();
	}

	this.playAmbiente = function(key){
		snd[key].addEventListener('ended', function() {
			this.currentTime = 0;
			this.play();
		}, false);
		snd[key].volume = 0.2;
		snd[key].play();	// this line starts the loop...		
	}

}