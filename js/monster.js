// Monster class
var monster = function(data)
{

	// default values
	this.defaults 	= {

		name		: '',
		type		: '',
		xp 			: 0,
		level 		: 3,
		daily_fee 	: 1000
		
	};

	// merger parameters with default values
	this.data = $.extend(this.defaults, data);


	// add amount of xp to monster
	this.addXp = function(amount)
	{
		this.xp += amount;

		// if amount of xp are over range: level up
		if(this.xp >= monster.getXpRange(this.level))
		{
			this.xp = 0;
			this.level++;
		}

		// save in local storage and reload monster list
		localStorage.setItem('monsters', JSON.stringify(mymonsters));
		displayMonsters();
	}
};


// general function to determine xp-range for next level
monster.prototype.getXpRange = function(level)
{
	return(Math.round(22 * (level)/3));
};