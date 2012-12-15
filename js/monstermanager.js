var monsterManager = function()
{
	this.monsterList = JSON.parse(localStorage.getItem('monsters'));


	this.addMonster = function(m)
	{
		this.monsterList.push(m)
	};


	this.getMonsterList = function()
	{
		return(this.monsterList);
	};


	this.renderList = function()
	{
		// clear list of monsters before redrawing them
        var list = $('#sidebar #monsters');
        list.html('');

		if(typeof this.monsterList != 'undefined' && this.monsterList[0] != null)
		{
			for(i = 0; i < this.monsterList.length; i++)
			{
                list.append('<div id="'+i+'" class="item '+this.monsterList[i].type+'">'
											  +'<span class="name">'
											  +this.monsterList[i].name+' ('+this.monsterList[i].level+')'
											  +'</span>'
											  +'<span class="xp">'
											  +this.monsterList[i].xp+' / '+monster.prototype.getXpRange(this.monsterList[i].level)
											  +'</span>'
											  +'</div>');

				// on last step of loop make list items dragable
				if(i+1 == this.monsterList.length)
				{
					$("#sidebar #monsters  .item").draggable({
						revert	: true,
						scroll	: false,
						snap 	: true
					});
				}
			}
		}
	}
};