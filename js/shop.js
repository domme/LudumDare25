var monsterNameSpace = (function(ns)
{

	ns.shopManager = function()
	{
		self = this;
		self.items = new Object();

		this.generateNewItems();

		this.renderDialog = function(){
			var content     = '<div class="shop">'
							+ '<h2>Shop</h2>';

				for(k in self.items)
				{
					content += '<div data-name="'+self.items[k].name+'" class="item" data-type="'+self.items[k].type+'"'
							 + 'onclick="if(monsterNameSpace.shop.buyItem(\''+self.items[k].name+'\') != true) '
							 + 'monsterNameSpace.shop.buyItem(\''+self.items[k].name+'\') ">'
							 + '<div class="name">'+self.items[k].name+' ('+self.items[k].level+')</div>'
                             + '<div class="price">'+self.items[k].price+' $</div>'
							 + '</div>'
				}

			content 		+= '</div>'

			$.fancybox({
				content     : content,
				margin      : 0,
				padding     : 0
			});     
		}

		this.noCredits = function(){
			var content     = '<div class="dialogue">'
							+ 'You don\'t have enough Scare-Credits <br />to buy this monster.<br />Keep scaring little kids!'
							+ '</div>';

			$.fancybox({
				content     : content,
				margin      : 0,
				padding     : 0
			});     
		}

		this.inventarFull = function(){
			var content     = '<div class="dialogue">'
							+ 'You can only master 5 monsters at once. Don\'t get too greedy!'
							+ '</div>';

			$.fancybox({
				content     : content,
				margin      : 0,
				padding     : 0
			});     
		}
	};

	ns.shopManager.prototype.addItem = function(monster)
	{
		self.items[monster.name] = monster;
	}

	ns.shopManager.prototype.removeItem = function(name)
	{
		delete self.items[name];
	}

	ns.shopManager.prototype.buyItem = function(name)
	{
		console.log(1);
		monsterManager = game.player.monsterManager;
		console.log(objLength(game.player.monsterManager.monsterList));
        if(game.player.cash - self.items[name].price < 0)
        {
            this.noCredits();
            return false;
        }

        if(objLength(game.player.monsterManager.monsterList) >= 5)
        {
            this.inventarFull();
            return false;
        }

        monsterManager = game.player.monsterManager;
        monsterManager.addMonster(self.items[name]);
        game.player.cash -= self.items[name].price;
        $('.shop .item[data-name="'+name+'"]').remove();
        delete self.items[name];
        return(true);

		function objLength(obj) {
		    var size = 0, key;
		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }
		    return size;
		};
	}

	ns.shopManager.prototype.generateNewItems = function()
	{
		var level_1 = Math.floor(Math.random() * (4 - 3 + 1)) + 3;
		var level_2 = Math.floor(Math.random() * (7 - 5 + 1)) + 5;
		var level_3 = Math.floor(Math.random() * (10 - 8 + 1)) + 8;

		self.addItem({
			name		: 'mmmone',
			type		: ns.Monster.TYPES.getRandom(),
			xp 			: 0,
			level 		: level_1,
			daily_fee	: getDaily(level_1),
			price		: getPrice(level_1)
		});
		self.addItem({
			name		: 'ergvsdg',
			type		: ns.Monster.TYPES.getRandom(),
			xp 			: 0,
			level 		: level_2,
			daily_fee	: getDaily(level_2),
			price		: getPrice(level_2)
		});
		self.addItem({
			name		: 'sdfsdfgh',
			type		: ns.Monster.TYPES.getRandom(),
			xp 			: 0,
			level 		: level_3,
			daily_fee	: getDaily(level_3),
			price		: getPrice(level_3)
		});

		function getPrice(level)
		{
			switch(level){
				case 3: return(6000); break;
				case 4: return(8000); break;
				case 5: return(11000); break;
				case 6: return(13000); break;
				case 7: return(15000); break;
				case 8: return(18000); break;
				case 9: return(20000); break;
				case 10: return(25000); break;
			}
		}
		
		function getDaily(level)
		{
			switch(level){
				case 3: return(1000); break;
				case 4: return(3000); break;
				case 5: return(6000); break;
				case 6: return(8000); break;
				case 7: return(10000); break;
				case 8: return(13000); break;
				case 9: return(15000); break;
				case 10: return(18000); break;
			}
		}
		
	}

	return ns;
})(monsterNameSpace = monsterNameSpace || {});