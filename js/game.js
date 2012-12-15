mymonsters = null;

$(document).ready(function(){

	// get monsters from local storage
	mymonsters = JSON.parse(localStorage.getItem('monsters'));

	// display cash
	$('#cash').html(localStorage.getItem('cash')+' $');

	displayMonsters();
});


// give an amount of experience points to a monster
function giveXp(id, amount)
{
	mymonsters[id].xp += amount;

	// on level up give again 0 XP to monster to go through process again (in case of more than 1 level up at once)
	if(mymonsters[id].xp >= Math.pow(mymonsters[id].level, 2)*100)
	{
		mymonsters[id].level++;
		giveXp(id, 0);
	}

	// save in local storage and reload monster list
	localStorage.setItem('monsters', JSON.stringify(mymonsters));
	displayMonsters();
}


// generate monster list in sidebar
function displayMonsters()
{
	// clear list of monsters before redrawing them
	$('#sidebar #monsters').html('');

	// START display all monsters in sidebar
	for(i = 0; i < mymonsters.length; i++)
	{
		$('#sidebar #monsters').append('<div id="'+i+'" class="item '+mymonsters[i].type+'">'
									  +'<span class="name">'
									  +mymonsters[i].name+' ('+mymonsters[i].level+')'
									  +'</span>'
									  +'<span class="xp">'
									  +mymonsters[i].xp+' / '+Math.pow(mymonsters[i].level, 2)*100
									  +'</span>'
									  +'</div>');

		// on last step of loop make list items dragable
		if(i+1 == mymonsters.length)
		{
			$("#sidebar #monsters .item").draggable({
				revert	: true,
				scroll	: false
			});

			make_droppable();
		}
	}
	// END display all monsters in sidebar
}


// make droppable elements
function make_droppable()
{
	$(".toscare").droppable({
		drop	: function(e, ui) {

			// START calculate timeout of monster, XP to gain and scare-credits player will get
			var monster_id 			= ui.draggable.attr('id');
			var toscare_level 		= $(this).attr('data-level');
			var toscare_type 		= $(this).attr('data-type');
			var timeout				= 10000 + (toscare_level - mymonsters[monster_id].level)*1000;
			
			// Monster is not same type as target? Woah, extra 10 seconds on timeout...
			if(mymonsters[monster_id].type != toscare_type)
				timeout += 10000;
			
			// timeout can never be less than 0
			timeout = (timeout <= 0) ? 0 : timeout;

			// disable monster and show blinking (timeout)
			$('.item#'+monster_id).draggable('disable');
			mymonsters[monster_id].interval = window.setInterval(function(){
				$('.item#'+monster_id).fadeOut(500).fadeIn(500);
			}, 1000);

			// end timeout for monster after [timeout] milliseconds
			window.setTimeout(function(){
				// get scream-credits
				localStorage.setItem('cash', parseInt(localStorage.getItem('cash'))+timeout/10);
				$('#cash').html(localStorage.getItem('cash')+' $');

				// make item draggable again
				$('.item#'+monster_id).draggable('enable');
				window.clearInterval(mymonsters[monster_id].interval);
			}, timeout);
			// END calculate timeout of monster, XP to gain and scare-credits player will get
		}
	});
}