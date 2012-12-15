monster = new function(data)
{

	this.defaults 	= {
		name		: '',
		type		: '',
		xp 			: 0,
		level 		: 3,
		daily_fee 	: 1000
	};

	this.data = $.extend(this.defaults, data);


	this.getXpRange = function()
	{
		return(Math.round(22 * ((this.data.level)/3)));
	}

	this.addXp = function(amount)
	{
		this.xp += amount;
		if(mymonsters[id].xp >= getXpRange(mymonsters[id].level))
		{
			mymonsters[id].xp -= getXpRange(mymonsters[id].level);
			mymonsters[id].level++;
			giveXp(id, 0);
		}

		// save in local storage and reload monster list
		localStorage.setItem('monsters', JSON.stringify(mymonsters));
		displayMonsters();
	}


}