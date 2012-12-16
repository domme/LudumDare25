var SCREEN_WIDTH = $(document).width()-143;
var SCREEN_HEIGHT = $(document).height();
var camera;
var scene;
var cloudScene;
var globeMesh;
var globeRadius = 40;
var globeCloudMesh;
var globeMaterial;
var globeCloudMaterial;
var globeCityMaterial;
var renderer;
var sunPointlight;
var timeSpeed = 2.0;
var centerCubeMesh;
var deltaTime;
var currentHour = 1.0;



var waterLandImageAdapter = function()
{
	var waterLandImage = new Image();
	var waterLandImageData = null;	
	var ready = false;
};

var container, stats;

var soundManager = new soundManager();
soundManager.playAmbiente('a1');

var monsterNameSpace = (function(ns)
{
	/*
	 *	ID-Generator
	 */
	ns.id_generator = function () {
		return ('_'+Math.random().toString(36).substr(2, 9));
	};


    ns.random = function(min, max)
    {
        return Math.round(Math.random() * (max - min)+ 0.5) + min;
    };


    ns.Game = function(title)
    {
        this.title = title;
        this.saveGame = null;
        this.gui = null;
    };

    ns.Game.prototype.start = function()
    {
    	init();
		animate();

        this.saveGame = new ns.SaveGameHandler();
        this.player = new ns.Player(this.saveGame);
        this.gui = new ns.GUI(this.player);
        this.gui.drawHUD();

        this.missionManager = new ns.MissionManager(this.saveGame);
        this.generateMissions();

        ns.shop = new ns.shopManager();
    };

    ns.Game.prototype.generateMissions = function()
    {
        for(var i in this.missionManager.missionList)
        {
            this.missionManager.deleteMission(this.missionManager.missionList[i]);
        }

        var count = ns.random(5, 10);

        var lvl = 0, countOfMonsters = 0;
        for(var i in this.player.monsterManager.monsterList)
        {
            lvl+= this.player.monsterManager.monsterList[i].level;
            ++count;
        }

        var avgLvl = Math.round(lvl/count);

        var p35 = Math.round(count/100*40),
            p15 = Math.round(count/100*5);

        for(var i = 0; i < p35;++i)
        {
            this.missionManager.createMission(this.player, avgLvl+ns.random(1, 3));
        }
        for(var i = 0; i < p35;++i)
        {
            this.missionManager.createMission(this.player, avgLvl+ns.random(3, 5));
        }

        for(var i = 0; i < p15;++i)
        {
            this.missionManager.createMission(this.player, avgLvl+ns.random(4, 6));
        }
        for(var i = 0; i < p15;++i)
        {
            this.missionManager.createMission(this.player, avgLvl-ns.random(0, 5));
        }
    };
    /*******************************************************************************************************************
     * PLAYER
     ******************************************************************************************************************/
    ns.Player = function(saveGameHandler)
    {
        this.saveGame = saveGameHandler;
        this.cash = this.saveGame.get('cash', 0);

        this.monsterManager = new ns.MonsterManager(this.saveGame.get('monsters',[]));
    };

    ns.Player.prototype.payDailyFee = function()
    {
        this.monsterManager.monsterList.sort(function(a, b){
            if(a.level < b.level)
                return(-1);
            if(a.level > b.level)
                return(1);

            if(a.daily_fee < b.daily_fee)
                return(-1);
            if(a.daily_fee > b.daily_fee)
                return(1);

            return(0);
        });


        var total = 0;
        var dies  = new Array();

        for(var i in this.monsterManager.monsterList)
        {
            if(this.cash - (total+this.monsterManager.monsterList[i].daily_fee) < 0)
                dies.push(i);
            else
                total += this.monsterManager.monsterList[i].daily_fee;
        }

        if(dies.length > 0)
        {
            this.monsterManager.multiMonsterDie(dies);
        }

        this.cash -= total;
    };
    /*******************************************************************************************************************
     * GUI
     ******************************************************************************************************************/
    ns.GUI = function(player)
    {
        this.player = player;

        this.player.watch('cash', function(id, oldVal, newVal)
        {
            $('#cash').text(newVal+' $');
            return newVal;
        });
    };    

    ns.GUI.prototype.drawHUD = function()
    {
        $('#cash').text(this.player.cash+' $');

        var list = $('#sidebar #monsters');
        list.html('');

        for(var id in this.player.monsterManager.monsterList)
        {
        	var monster = this.player.monsterManager.monsterList[id];
            list.append('<div id="'+id+'" class="item" data-type="'+monster.type+'">'
                +'<span class="name">'
                +monster.name+' ('+monster.level+')'
                +'</span>'
                +'<span class="xp">'
                +monster.xp+' / '+ns.Monster.getXpRange(monster.level)
                +'</span>'
                +'<div class="outtimebar" style="width: 1px;"></div>'
                +'</div>');
        }
        $("#sidebar #monsters .item").draggable({
            revert	: true,
            scroll	: false,
            helper  : "clone",
            start	: function( event, ui ) {
				soundManager.play('o1');
            }
        });
    };

    /*******************************************************************************************************************
     * MONSTER
     ******************************************************************************************************************/
    ns.Monster = function(data)
    {
        // default values
        this.defaults 	= {
        	id 			: ns.id_generator(),
            name		: '',
            type		: '',
            xp 			: 0,
            level 		: 3,
            daily_fee 	: 1000

        };

        // merger parameters with default values
        data = $.extend(this.defaults, data);

        for(var key in data)
        {
            this[key] = data[key];
        }
    };

    ns.Monster.getXpRange = function(level)
    {
        return(Math.round(22 * (level)/3));
    };

    ns.Monster.TYPES = {
        getRandom: function()
        {
            return Math.floor(Math.random() * (3 - 1 + 1)) + 1;
        },
        CAR: 1,
        CLOWN: 2,
        SPIDER: 3
    };

    ns.Monster.prototype.addXP = function(amount)
    {
        this.xp += amount;

        // if amount of xp are over range: level up
        if(this.xp >= ns.Monster.getXpRange(this.level))
        {
            this.xp = 0;
            this.level++;
            this.daily_fee+=2000;
        }
        game.gui.drawHUD();
    };

    /*******************************************************************************************************************
     * Monster Manager
     ******************************************************************************************************************/
    ns.MonsterManager = function(monsterList)
    {
        this.monsterList = monsterList;
    };

    ns.MonsterManager.prototype.addMonster = function(monster)
    {
        this.monsterList[monster.id] = monster;
        game.gui.drawHUD();
        return this.monsterList.length-1;
    };

    ns.MonsterManager.prototype.removeMonster = function(id)
    {
        delete this.monsterList[id];
        game.gui.drawHUD();
        return this.monsterList.length-1;
    };

	// monster dies because it didn't manage to scare a fucking child...
	ns.MonsterManager.prototype.monsterDie = function(id)
	{
		function objLength(obj) {
		    var size = 0, key;
		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }
		    return size;
		}

		// remove monster from sidebar
		$('#sidebar #'+id).remove();

		if(objLength(game.player.monsterManager.monsterList) > 1 || game.player.cash >= 6000)
		{
			if(objLength(game.player.monsterManager.monsterList) > 1)
			{
				var content 	= '<div class="dialogue">'
								+ 'One of your monsters Monster ('+game.player.monsterManager.monsterList[id].name+') signed off.'
								+ '</div>'
			}
			else
			{
				var content 	= '<div class="dialogue">'
								+ 'Your last Monster signed off. But don\'t panic! You can easily afford a new one.'
								+ '<div class="buttons"><input type="button" value="Get me a fresh monster!" onclick="monsterNameSpace.shop.renderDialog();" /></div>'
								+ '</div>'
			}

			$.fancybox({
				content 	: content,
				margin 		: 0,
				padding 	: 0
			});
		}
		else
		{
			var content 	= '<div class="dialogue">'
							+ 'Your last Monster signed off and you ran out of scare-credits. <br />So basically... YOU ARE FIRED!'
							+ '<div class="buttons"><input type="button" value="Okay..." onclick="window.location.href = \'index.htm\'" /></div>'
							+ '</div>'

			$.fancybox({
				content 	: content,
				margin 		: 0,
				padding 	: 0,
				modal 		: true
			});		
		}

		game.player.monsterManager.removeMonster(id);
	};

	// monster dies because it didn't manage to scare a fucking child...
	ns.MonsterManager.prototype.multiMonsterDie = function(list)
	{
		function objLength(obj) {
		    var size = 0, key;
		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }
		    return size;
		};

		console.log(objLength(game.player.monsterManager.monsterList));

		if(objLength(game.player.monsterManager.monsterList) > list.length)
		{
			var content 	= '<div class="dialogue">'
							+ list.length+' of your Monsters signed off because you couldn\'t pay. You better go to work.'
							+ '</div>'

			$.fancybox({
				content 	: content,
				margin 		: 0,
				padding 	: 0
			});		
		}
		else
		{
			var content 	= '<div class="dialogue">'
							+ 'All your monsters signed off and you ran out of scare-credits. <br />So basically... YOU ARE FIRED!'
							+ '<div class="buttons"><input type="button" value="Okay..." onclick="window.location.href = \'index.htm\'" /></div>'
							+ '</div>'

			$.fancybox({
				content 	: content,
				margin 		: 0,
				padding 	: 0,
				modal 		: true
			});		
		}

		for(i = 0; i < list.length; i++)
		{
			$('.item#'+list[i]).remove();
			game.player.monsterManager.removeMonster(i);
			localStorage.setItem('monsters', JSON.stringify(game.player.monsterManager.monsterList));
		}
	};

    /*******************************************************************************************************************
     * MISSION MANAGER
     ******************************************************************************************************************/
    ns.MissionManager = function(saveGameHandler)
    {
        this.missionList = [];
        this.saveGame = saveGameHandler;
    };

    ns.MissionManager.prototype.createMission = function(player, age)
    {
        var mis = new ns.Mission(player);

        var phi = Math.random() * 2 * Math.PI;
        var theta = Math.random() * Math.PI;

		mis.mesh = createRandomChildMissionGraphics(phi, theta);
        mis.location.phi = phi;
        mis.location.theta = theta;
        mis.children.age = Math.min(10, Math.max(1, age));

        this.missionList.push(mis);
    };

    ns.MissionManager.prototype.deleteMission = function(mission)
    {
        var foundKey = -1;
        for(var i = 0, mis = null;mis = this.missionList[i];++i)
        {
            if(mis != mission) continue;

            foundKey = i;
            break;
        }

        if(foundKey==-1) return;
        this.missionList.splice(foundKey,1);
        globeMesh.remove( mission.mesh );
        $(mission.div).remove();
    };

    /*******************************************************************************************************************
     * MISSION
     ******************************************************************************************************************/
    ns.Mission = function(player)
    {
        this.player = player;


        this.children = {name:'Domi Lazarek', gender: 0, random: ns.Monster.TYPES.getRandom(), age: 1};
        this.location = {phi:0,theta:0};

        this.div = null;
    };

    ns.Mission.prototype.draw = function(x, y)
    {
        if(this.div != null)
        {
            this.div.style.top = y+"px";
            this.div.style.left = x+"px";
            this.div.style.display = "block";
            return;
        }

        this.div = document.createElement('div');
        this.div.className = "missionWindow";
        this.div.dataset['type'] = this.children.random;
        this.div.dataset['level'] = this.children.age;
        this.div.style.position = "absolute";
        this.div.style.top = y+"px";
        this.div.style.left = x+"px";
        this.div.style.display = "block";


        this.missionDetails 		= document.createElement('img');
        if(this.children.age <= 3)
        	this.missionDetails.src	= 'assets/textures/Children/ScaredGirl_1.jpg';
        else if(this.children.age < 7)
        	this.missionDetails.src	= 'assets/textures/Children/Freaky_Boy.jpg';
        else if(this.children.age <= 10)
        	this.missionDetails.src	= 'assets/textures/Children/OldGirl.jpg';

        this.alergic_to = document.createElement('img');
        if(this.children.random == 1)
        	this.alergic_to.src	= 'assets/textures/monster/doggy.jpg';
        else if(this.children.random  == 2)
        	this.alergic_to.src	= 'assets/textures/monster/slime.jpg';
        else if(this.children.random == 3)
        	this.alergic_to.src	= 'assets/textures/monster/spider.jpg';
        this.alergic_to.style.width = '20px';
        this.alergic_to.style.height = '20px';
        this.alergic_to.style.marginTop = '5px';

        $('body').append(this.div);
        this.div.appendChild(this.missionDetails);
        this.div.appendChild(document.createTextNode("Name: "+this.children.name));
        this.div.appendChild(document.createElement("br"));
        this.div.appendChild(document.createTextNode("Age: "+this.children.age));
        this.div.appendChild(document.createElement("br"));
        this.div.appendChild(this.alergic_to);


        this.makeDroppable();
    };

    ns.Mission.prototype.hide = function()
    {
        if( this.div == null )
        {
            return;
        }

        this.div.style.display = "none";
    };

    ns.Mission.prototype.makeDroppable = function()
    {
        var mis = this;
        $(this.div).droppable({
            drop	: function(e, ui) {

                // START calculate timeout of monster, XP to gain and scare-credits player will get
                var monster_id 			= ui.draggable.attr('id');
                var toscare_level 		= $(this).attr('data-level');
                var toscare_type 		= $(this).attr('data-type');
                var monster 			= game.player.monsterManager.monsterList[monster_id];
                var monster_level 		= monster.level;
                var monster_timeout;

                // Monster is same type? Great! Bonus
                if(monster.type == toscare_type)
                    monster_level += 1;

                // Child is on night-side? Yeah! Another bonus...
                if( isOnNightSide( mis ) )
                 	monster_level += 1;

                var chance = 45 + (monster_level - toscare_level) * 20;
                if(Math.round(1+Math.random()*100) < chance)
                {
                    var cashFlow = Math.max(1, (toscare_level - monster.level)) * 500;
                    if(monster.type == toscare_type)
                        cashFlow *= 2;

                    // get me some cash!
                    game.player.cash += cashFlow;

                    // get XP
                    var xp = 11 * (monster_level / 3) - monster_level - toscare_level;
                    ns.Monster.prototype.addXP.call(monster, Math.round(xp));

                    // set timout for monster usability
                    var timeout = toscare_level * 3000;

                    // disable monster and show blinking (timeout)
                    $('.item#'+monster_id).draggable('disable');
                    
                    $('.item#'+monster_id).css({'opacity': 0.5});
                    $('.item#'+monster_id+' .outtimebar').css({'width': 140+'px'});

                    var step = Math.round(140/(timeout/1000));
                    monster_timeout = window.setInterval(function(){
                    	$('.item#'+monster_id+' .outtimebar').css({'width': '-='+step});
                    }, 1000);

                    // make monster available after [timeout] milliseconds
                    window.setTimeout(function(){
                        // make item draggable again
                        $('.item#'+monster_id).draggable('enable');
                        $('.item#'+monster_id).css({'opacity': 1});
                        window.clearInterval(monster_timeout);
                        $('.item#'+monster_id+' .outtimebar').css({'width': '-='+step});
                    }, timeout);

                    var img = document.createElement('img');
                    img.src = 'assets/textures/ScareSplash.jpg';

                    $.fancybox({
                        type        : 'image',
                        content 	: "assets/textures/ScareSplash.jpg",
                        margin 		: 0,
                        padding 	: 0,
                        modal       : true
                    });
					soundManager.play('m1');
                    window.setTimeout(function() {
                        $.fancybox.close();
                    }, 1000);
                }
                else
                {
                    $.fancybox({
                        type        : 'image',
                        content 	: "assets/textures/DefeatSplash.jpg",
                        margin 		: 0,
                        padding 	: 0,
                        modal       : true
                    });
                    soundManager.play('m4');
                    window.setTimeout(function() {
                        $.fancybox.close();
                    }, 1000);
                    game.player.monsterManager.removeMonster(monster_id);
                }

                game.missionManager.deleteMission(mis);
                // END calculate timeout of monster, XP to gain and scare-credits player will get
            }
        });
    };

    return ns;
})(monsterNameSpace);

var game = null;


function payDailyFee()
{
	mymonsters.sort(function(a, b){
		if(a.level < b.level)
			return(-1);
		if(a.level > b.level)
			return(1);

		if(a.daily_fee < b.daily_fee)
			return(-1);
		if(a.daily_fee > b.daily_fee)
			return(1);

		return(0);
	});


	var total = 0;
	var dies  = new Array();

	for(i = 0; i < mymonsters.length; i++)
	{
		if(parseInt(localStorage.getItem('cash')) - (total+mymonsters[i].daily_fee) < 0)
			dies.push(i);
		else
			total += mymonsters[i].daily_fee;
	}

	if(dies.length > 0)
	{
		multipleMonsterDeath(dies);
	}

	localStorage.setItem('cash', parseInt(localStorage.getItem('cash')) - total);
	$('#cash').html(localStorage.getItem('cash')+' $');
}

function init()
{
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	lastTime = Date.now();

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x000000, clearAlpha: 1 } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.domElement.style.position = "relative";
	container.appendChild( renderer.domElement );
	renderer.autoClear = false;

	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 1000 );
	camera.position.z = 100;

	cameraControls = new THREE.OrbitControls( camera );
	cameraControls.addEventListener( 'change', render );

	scene.camera = camera;
	
	
    centerCubeMesh = new THREE.Mesh( new THREE.SphereGeometry( 0.1, 1, 1 ), new THREE.MeshBasicMaterial() );
    scene.add( centerCubeMesh );

	sunPointlight = new THREE.PointLight( 0xffffff, 1.0, 1000 );
	sunPointlight.position.x = 100;
	sunPointlight.position.y = 100;
	sunPointlight.position.z = 100;
	centerCubeMesh.add( sunPointlight );

	var colorTex = THREE.ImageUtils.loadTexture( "assets/textures/earthmap1k.jpg" );
	var normalTex = THREE.ImageUtils.loadTexture( "assets/textures/earthbump1k.jpg" );
	var specularTex = THREE.ImageUtils.loadTexture( "assets/textures/earthspec1k.jpg" );
	
	waterLandImageAdapter.waterLandImage = new Image();
	waterLandImageAdapter.waterLandImage.onload = function(){ waterLandTexLoaded();}
	waterLandImageAdapter.waterLandImage.src = "assets/textures/earthspec_small_debug.jpg";


	var cloudTex = THREE.ImageUtils.loadTexture( "assets/textures/Earth-Clouds2700.jpg" );
	cloudTex.wrapS = THREE.MirroredRepeatWrapping;
	cloudTex.wrapT = THREE.MirroredRepeatWrapping;
	cloudTex.needsUpdate = true;

	var cityTex = THREE.ImageUtils.loadTexture( "assets/textures/earthlights1k.jpg" );

	
	var earthShader = MonsterShaderLib[ "earth" ];
	earthShaderUniforms = THREE.UniformsUtils.clone( earthShader.uniforms );

	earthShaderUniforms[ "cloudTexture" ].value = cloudTex;
	earthShaderUniforms[ "nightTexture" ].value = cityTex;
	earthShaderUniforms[ "map" ].value = colorTex;

	globeMaterial = new THREE.ShaderMaterial( {
		uniforms: earthShaderUniforms,
		vertexShader: earthShader.vertexShader,
		fragmentShader: earthShader.fragmentShader,
		normalMap: normalTex,
		normalScale: new THREE.Vector2( 0.2, 0.2 ),
		specularMap: specularTex,
		map: colorTex
	});

	globeMaterial.color = new THREE.Color( 0xffffff ); // diffuse
	globeMaterial.ambient = new THREE.Color( 0xffffff );
	globeMaterial.emissive = new THREE.Color( 0x000000 );
	globeMaterial.specular = new THREE.Color( 0x111111 );
	globeMaterial.shininess = 30;
	globeMaterial.metal = false;
	globeMaterial.perPixel = true;
	globeMaterial.wrapAround = false;
	globeMaterial.wrapRGB = new THREE.Vector3( 1, 1, 1 );
	globeMaterial.map = null;
	globeMaterial.lightMap = null;
	globeMaterial.bumpMap = null;
	globeMaterial.bumpScale = 1;
	globeMaterial.normalMap = null;
	globeMaterial.normalScale = new THREE.Vector2( 1, 1 );
	globeMaterial.specularMap = null;
	globeMaterial.envMap = null;
	globeMaterial.combine = THREE.MultiplyOperation;
	globeMaterial.reflectivity = 1;
	globeMaterial.refractionRatio = 0.98;
	globeMaterial.fog = true;
	globeMaterial.shading = THREE.SmoothShading;
	globeMaterial.wireframe = false;
	globeMaterial.wireframeLinewidth = 1;
	globeMaterial.wireframeLinecap = 'round';
	globeMaterial.wireframeLinejoin = 'round';
	globeMaterial.vertexColors = THREE.NoColors;
	globeMaterial.skinning = false;
	globeMaterial.morphTargets = false;
	globeMaterial.morphNormals = false;
	globeMaterial.map = colorTex;
	globeMaterial.normalMap = normalTex;
	globeMaterial.normalScale = new THREE.Vector2( 0.2, 0.2 );
	globeMaterial.specularMap = specularTex;
	//globeMaterial.

	globeMesh = new THREE.Mesh( new THREE.SphereGeometry( globeRadius, 100, 100 ), globeMaterial );
	globeMesh.position.x = 0;
	globeMesh.position.y = 0;
	globeMesh.position.z = 0;
	scene.add( globeMesh );




	//Init star-system
	var numStars = 10000;
	var maxStarDistance = 500;
	var minEarthDistance = 300;

	var starGeometry = new THREE.Geometry();

	for( var i = 0; i < numStars; ++i )
	{
		var radius = Math.random() * 1.0 + 0.1; 

		var currMesh = new THREE.Mesh( new THREE.SphereGeometry( radius, 1, 1 ) );

		currMesh.position.x = ( Math.random() * 2 - 1 ) * maxStarDistance;
		currMesh.position.y = ( Math.random() * 2 - 1 ) * maxStarDistance;
		currMesh.position.z = ( Math.random() * 2 - 1 ) * maxStarDistance;

        var meshEarth = new THREE.Vector3();
        meshEarth.x = globeMesh.position.x - currMesh.position.x;
        meshEarth.y = globeMesh.position.y - currMesh.position.y;
        meshEarth.z = globeMesh.position.z - currMesh.position.z;

        if( meshEarth.length() >= minEarthDistance )
		  THREE.GeometryUtils.merge( starGeometry, currMesh );
	}

	var starMesh = new THREE.Mesh( starGeometry, new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
	scene.add( starMesh );

	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener( 'mousemove', onMouseMove, false );
	//document.addEventListener( 'keydown', onKeyDown, false );

}

function waterLandTexLoaded()
{
	var imgCanvas = document.getElementById( "myCanvas" );
	var imgContext = imgCanvas.getContext( '2d' );
	imgContext.drawImage( waterLandImageAdapter.waterLandImage, 0, 0 );

	waterLandImageAdapter.waterLandImageData = imgContext.getImageData( 0, 0, 200, 100 );
	waterLandImageAdapter.ready = true;
	createRandomChildMissionGraphics();
}


function isOnLand( phi, theta )
{
	var normX = phi / ( Math.PI * 2 );
	var normY =  theta / ( Math.PI );

	var x = normX * 200;
	var y = normY * 100;

	var i = y * 200 + x;
	var pixelValue = waterLandImageAdapter.waterLandImageData.data[ Math.floor( i ) ]; 
	return pixelValue < 230;
}

function createRandomChildMissionGraphics( phi, theta )
{
	var newMissionMesh = new THREE.Mesh( new THREE.SphereGeometry( 1, 10, 10 ), new THREE.MeshBasicMaterial( { color: 0x0000dd } ) );
	newMissionMesh.position.x = globeRadius * Math.sin( theta ) * Math.cos( phi );
	newMissionMesh.position.y = globeRadius * Math.sin( theta ) * Math.sin( phi );
	newMissionMesh.position.z = globeRadius * Math.cos( theta );
	globeMesh.add( newMissionMesh );

    return newMissionMesh;
}



function onWindowResize( event ) 
{
	SCREEN_WIDTH = $(document).width()-143;
	SCREEN_HEIGHT = $(document).height();

	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();

	$('#sidebar #monsters').height($(window).height()-120);
}

function setTime( hour )
{
    currentHour = hour;
    $('#clock').html(Math.round(currentHour)+':00')

    var rotation = ( currentHour / 24.0 ) * Math.PI * 2.0; 

    centerCubeMesh.rotation.y = rotation;
}

function updateTime()
{
    var lastHour = Math.floor(currentHour),
        t = currentHour + timeSpeed * deltaTime;

    setTime( t%24 );

    if(lastHour == Math.floor(currentHour)) return;

    if(Math.floor(currentHour)==0)
    {
        game.player.payDailyFee();
    } else if(Math.floor(currentHour)==12) {
        game.generateMissions();
    }
}

function animate() 
{
	requestAnimationFrame( animate );
	update();
	render();
}


function update()
{
	cameraControls.update();

    updateTime();

    if( game !== undefined && game.missionManager !== undefined )
    {
        var missionList = game.missionManager.missionList;
        for( var i = 0; i < missionList.length; ++i )
        {
            var mission = missionList[ i ];
            var pos = updateMissionDivPosition( mission );

            if( isBehindEarthForCamera( mission ) )
                mission.hide();

            else
                mission.draw( pos.x, pos.y );
        }
    }
    

 
}

function updateMissionDivPosition( mission )
{
    var modelWorld = mission.mesh.matrixWorld;
    var view = camera.matrixWorldInverse;
    var proj = camera.projectionMatrix;

    var worldViewProj = new THREE.Matrix4();
    worldViewProj.multiply( proj, view );
    worldViewProj.multiply( worldViewProj, modelWorld );


    var pos = new THREE.Vector4( 0.0, 0.0, 0.0, 1.0 );
    pos = worldViewProj.multiplyVector4( pos );

    pos.x = pos.x / pos.w;
    pos.y = pos.y / pos.w;
    pos.z = pos.z / pos.w;

    //ClipSpace -> NDC
    pos.x = ( pos.x + 1.0 ) / 2.0;
    pos.y = 1.0 - ( pos.y + 1.0 ) / 2.0;

    var x = pos.x * SCREEN_WIDTH;
    var y = pos.y * SCREEN_HEIGHT;

    return new THREE.Vector2( x, y );
}

function intersectWithMouse( event )
{
	var mouseScenePos = new THREE.Vector3();
	mouseScenePos.x = ( event.clientX / SCREEN_WIDTH ) * 2.0 - 1.0;
	mouseScenePos.y = ( ( SCREEN_HEIGHT - event.clientY ) / SCREEN_HEIGHT ) * 2.0 - 1.0;
	mouseScenePos.z = -1.0;

	var viewProjI = new THREE.Matrix4();
	viewProjI.identity();
	var projI = new THREE.Matrix4();
	var viewI = new THREE.Matrix4();
	projI.getInverse( camera.projectionMatrix );
	viewI.getInverse( camera.matrixWorldInverse );
	viewProjI.multiply( viewI, projI );
	
	var rayNear = new THREE.Vector4();
	
	rayNear.x = mouseScenePos.x;
	rayNear.y = mouseScenePos.y;
	rayNear.z = mouseScenePos.z;
	rayNear.w = 1.0;
	
	rayNear = viewProjI.multiplyVector4( rayNear );
	rayNear.x /= rayNear.w;
	rayNear.y /= rayNear.w;
	rayNear.z /= rayNear.w;
	rayNear.w = 1.0;
	
	var mouseRay = new THREE.Ray();		
	mouseRay.origin.copy( camera.position );
    
	mouseRay.direction.x = rayNear.x - camera.position.x;
	mouseRay.direction.y = rayNear.y - camera.position.y;
	mouseRay.direction.z = rayNear.z - camera.position.z;
	mouseRay.direction.normalize();

    var missionList = game.missionManager.missionList;

	for( var i = 0; i < missionList.length; ++i )
	{
		var intersections = mouseRay.intersectObject( missionList[ i ].mesh, false );

		if( intersections[ 0 ] != null )
			return missionList[ i ];

	}

	return null;
}


function isBehindEarthForCamera( missionObject )
{
    var mesh = missionObject.mesh;

    var vMeshPos = new THREE.Vector3();
    vMeshPos.copy( mesh.matrixWorld.getPosition() );

    var vGlobePos = new THREE.Vector3();
    vGlobePos.copy( globeMesh.matrixWorld.getPosition() );

    var vMissionNormal = new THREE.Vector3();
    vMissionNormal.sub( vMeshPos, vGlobePos );
    vMissionNormal.normalize();

    var vCamVec = new THREE.Vector3();
    var vCamPos = new THREE.Vector3();
    vCamPos.copy( camera.matrixWorld.getPosition() );
    vCamVec.sub( vCamPos, vMeshPos );
    vCamVec.normalize();   

    return vCamVec.dot( vMissionNormal ) < -0.2;
}

function isOnNightSide( missionObject )
{
    var mesh = missionObject.mesh;

    var vMeshPos = new THREE.Vector3();
    vMeshPos.copy( mesh.matrixWorld.getPosition() );

    var vGlobePos = new THREE.Vector3();
    vGlobePos.copy( globeMesh.matrixWorld.getPosition() );

    var vMissionNormal = new THREE.Vector3();
    vMissionNormal.sub( vMeshPos, vGlobePos );
    vMissionNormal.normalize();

    var vLightVec = new THREE.Vector3();
    var vLightPos = new THREE.Vector3();
    vLightPos.copy( sunPointlight.matrixWorld.getPosition() );
    vLightVec.sub( vLightPos, vMeshPos );
    vLightVec.normalize();

    return vLightVec.dot( vMissionNormal ) < 0.0;
}


function onMouseMove( event )
{
	var pickedMission = intersectWithMouse( event );

    /*if( pickedMission != null )
    {
       
       pickedMission.draw( pos.x, pos.y );
    }*/
       

    /*

	if( pickedMesh != null )
	{
		console.log( "Hit!" );
        if(!pickedMesh.wasActive)
        {
            pickedMesh.cb();
            pickedMesh.wasActive = true;
        }
		pickedMesh.material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
		pickedMesh.dirty = true;
	}

    for(var i= 0,mesh =null;mesh=missionMeshes[i];++i)
    {
        if(pickedMesh==mesh || mesh.wasActive == 0) continue;

        mesh.wasActive = 0;
        mesh.material = new THREE.MeshBasicMaterial( { color: 0x0000ff } );
        mesh.dirty = true;
    } */
		
}


function render() 
{
	var currTime = Date.now();
	deltaTime = ( currTime - lastTime ) * 0.0002;
	lastTime = currTime;
	//console.log( deltaTime );

	//earthShaderUniforms[ "time" ].value = deltaTime;


	//if( earthShaderUniforms[ "time" ].value > 1.0 )
	//	earthShaderUniforms[ "time" ].value = 0.0;
	
	//globeMaterial.dirty = true;

	renderer.setViewport( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.clear();

	renderer.render( scene, camera );

}