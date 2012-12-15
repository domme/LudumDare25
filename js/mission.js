mission = function(data)
{

	// default values
	this.defaults 	= {

		name		: '',
		age			: 0,
		gender 		: 0,
		random 		: 0

	};

	// merger parameters with default values
	this.data = $.extend(this.defaults, data);


	this.draw = function()
	{
		missionWindow = '<div class="missionWindow" data-type="'+this.random+'" data-level="'+this.age+'"></div>';
	}


	this.makeDroppable = function()
	{
		$(".missionWindow").droppable({
			drop	: function(e, ui) {

				// START calculate timeout of monster, XP to gain and scare-credits player will get
				var monster_id 			= ui.draggable.attr('id');
				var toscare_level 		= $(this).attr('data-level');
				var toscare_type 		= $(this).attr('data-type');
				var monster_level 		= mymonsters[monster_id].level;

				// Monster is same type? Great! Bonus
				if(mymonsters[monster_id].type == toscare_type)
					monster_level += 2;

				// Child is on night-side? Yeah! Another bonus...
				// if(mymonsters[monster_id].type == toscare_type)
				// 	monster_level += 1;

				var chance = 60 + (monster_level - toscare_level) * 20;
				if(Math.round(1+Math.random()*100) < chance)
				{
					var cashFlow = Math.abs((monster_level - toscare_level)) * 1000;
					if(mymonsters[monster_id].type == toscare_type)
						cashFlow *= 2;

					// get me some cash!
					localStorage.setItem('cash', parseInt(localStorage.getItem('cash')) + cashFlow);
					$('#cash').html(localStorage.getItem('cash')+' $');

					// get XP
					var xp = 11 * (monster_level / 3) - monster_level - toscare_level;
					giveXp(monster_id, Math.round(xp));

					// set timout for monster usability
					timeout = toscare_level * 5000;

					// disable monster and show blinking (timeout)
					$('.item#'+monster_id).draggable('disable');
					mymonsters[monster_id].interval = window.setInterval(function(){
						$('.item#'+monster_id).fadeOut(500).fadeIn(500);
					}, 1000);

					// end timeout for monster after [timeout] milliseconds
					window.setTimeout(function(){
						// make item draggable again
						$('.item#'+monster_id).draggable('enable');
						window.clearInterval(mymonsters[monster_id].interval);
					}, timeout);
				}
				else
				{
					monsterDeath(monster_id);
				}

				
				// END calculate timeout of monster, XP to gain and scare-credits player will get
			}
		});		
	}

}