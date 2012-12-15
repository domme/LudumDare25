var SCREEN_WIDTH = $(document).width()-143;
var SCREEN_HEIGHT = $(document).height();
var camera;
var scene;
var cloudScene;
var globeMesh;
var globeCloudMesh;
var globeMaterial;
var globeCloudMaterial;
var globeCityMaterial;
var renderer;
var sunPointlight;
var sunPointlightCloud;

var container, stats;

var soundManager = new soundManager();
soundManager.playAmbiente('a1');

var monsterNameSpace = (function(ns)
{
    ns.Game = function(title)
    {
        this.title = title;
        this.saveGame = null;
        this.gui = null;
    };

    ns.Game.prototype.start = function()
    {
        this.saveGame = new ns.SaveGameHandler();
        this.player = new ns.Player(this.saveGame);
        this.gui = new ns.GUI(this.player);
        this.gui.drawHUD();

        this.missionManager = new ns.MissionManager(this.saveGame);
        this.missionManager.createMission(this.player);

        init();
		animate();
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
    /*******************************************************************************************************************
     * PLAYER
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

        for(var i = 0, monster = null; monster = this.player.monsterManager.monsterList[i]; ++i)
        {
            list.append('<div id="'+i+'" class="item '+monster.type+'">'
                +'<span class="name">'
                +monster.name+' ('+monster.level+')'
                +'</span>'
                +'<span class="xp">'
                +monster.xp+' / '+ns.Monster.prototype.getXpRange(monster.level)
                +'</span>'
                +'</div>');
        }
        $("#sidebar #monsters .item").draggable({
            revert	: true,
            scroll	: false,
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

    ns.Monster.prototype.addXP = function(amount)
    {
        this.xp += amount;

        // if amount of xp are over range: level up
        if(this.xp >= monster.getXpRange(this.level))
        {
            this.xp = 0;
            this.level++;
        }
        game.gui.drawHUD();
    };
    ns.Monster.prototype.getXpRange = function(level)
    {
        return(Math.round(22 * (level)/3));
    };
    /*******************************************************************************************************************
     * Monster Manager
     ******************************************************************************************************************/
    ns.MonsterManager = function(monsterList)
    {
        this.monsterList = monsterList;
        for(var i = 0, monster = null; monster = this.monsterList[i]; ++i)
        {
            monster.prototype = ns.Monster;
        }
    };

    ns.MonsterManager.prototype.addMonster = function(monster)
    {
        this.monsterList.push(monster);
        game.gui.drawHUD();
        return this.monsterList.length-1;
    };
    /*******************************************************************************************************************
     * MISSION MANAGER
     ******************************************************************************************************************/
    ns.MissionManager = function(saveGameHandler)
    {
        this.missionList = [];
        this.saveGame = saveGameHandler;
    };

    ns.MissionManager.prototype.createMission = function(player)
    {
        var mis = new ns.Mission(player);

        this.missionList.push(mis);
    };

    /*******************************************************************************************************************
     * MISSION
     ******************************************************************************************************************/
    ns.Mission = function(player)
    {
        this.player = player;

        this.children = {name:'Domi Lazarek', age:4, gender: 0, random: 1, location:{}};
    };

    ns.Mission.prototype.draw = function()
    {
        missionWindow = '<div class="missionWindow" data-type="'+this.children.random+'" data-level="'+this.children.age+'"></div>';
    };

    ns.Mission.prototype.makeDroppable = function()
    {
        $(".missionWindow").droppable({
            drop	: function(e, ui) {

                // START calculate timeout of monster, XP to gain and scare-credits player will get
                var monster_id 			= ui.draggable.attr('id');
                var toscare_level 		= $(this).attr('data-level');
                var toscare_type 		= $(this).attr('data-type');
                var monster = game.player.monsterManager.monsterList[monster_id];
                var monster_level 		= monster.level;

                // Monster is same type? Great! Bonus
                if(monster.type == toscare_type)
                    monster_level += 2;

                // Child is on night-side? Yeah! Another bonus...
                // if(mymonsters[monster_id].type == toscare_type)
                // 	monster_level += 1;

                var chance = 60 + (monster_level - toscare_level) * 20;
                if(Math.round(1+Math.random()*100) < chance)
                {
                    var cashFlow = Math.abs((monster_level - toscare_level)) * 1000;
                    if(monster.type == toscare_type)
                        cashFlow *= 2;

                    // get me some cash!
                    game.player.cash += cashFlow;

                    // get XP
                    var xp = 11 * (monster_level / 3) - monster_level - toscare_level;
                    monster.addXP(Math.round(xp));

                    // set timout for monster usability
                    timeout = toscare_level * 5000;

                    // disable monster and show blinking (timeout)
                    $('.item#'+monster_id).draggable('disable');
                    monster.interval = window.setInterval(function(){
                        $('.item#'+monster_id).fadeOut(500).fadeIn(500);
                    }, 1000);

                    // end timeout for monster after [timeout] milliseconds
                    window.setTimeout(function(){
                        // make item draggable again
                        $('.item#'+monster_id).draggable('enable');
                        window.clearInterval(monster.interval);
                    }, timeout);
                }
                else
                {
                    //monsterDeath(monster_id);
                }


                // END calculate timeout of monster, XP to gain and scare-credits player will get
            }
        });
    };

    return ns;
})(monsterNameSpace);

var game = null;
$(document).ready(function(){
	game = new monsterNameSpace.Game('Scare Factory');
    game.start();
});

// monster dies because it didn't manage to scare a fucking child...
function monsterDeath(id)
{
	$('.item#'+id).remove();

	if(mymonsters.length > 1 || parseInt(localStorage.getItem('cash')) >= 1000)
	{
		if(mymonsters.length > 1)
		{
			var content 	= '<div class="dialogue">'
							+ 'Your Monster "'+mymonsters[id].name+'" deceased.'
							+ '</div>'
		}
		else
		{
			var content 	= '<div class="dialogue">'
							+ 'Your last Monster deceased. But don\'t panic! You can easily afford a new one.'
							+ '<div class="buttons"><input type="button" value="Get me a fresh monster!" onclick="$.fancybox.close(); openShop();" /></div>'
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
						+ 'Your last Monster deceased and you ran out of scare-credits. <br />So basically... You lost the game'
						+ '<div class="buttons"><input type="button" value="Okay..." onclick="window.location.href = \'start.htm\'" /></div>'
						+ '</div>'

		$.fancybox({
			content 	: content,
			margin 		: 0,
			padding 	: 0,
			modal 		: true
		});		
	}

	mymonsters.slice(id);
	localStorage.setItem('monsters', JSON.stringify(mymonsters));
}


// monster dies because it didn't manage to scare a fucking child...
function multipleMonsterDeath(list)
{
	if(mymonsters.length > list.length)
	{
		var content 	= '<div class="dialogue">'
						+ list.length+' of your Monsters deceased.'
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
						+ 'All your monsters deceased and you ran out of scare-credits. <br />So basically... You lost the game'
						+ '<div class="buttons"><input type="button" value="Okay..." onclick="window.location.href = \'start.htm\'" /></div>'
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
		mymonsters.splice(list[i], 1);
		localStorage.setItem('monsters', JSON.stringify(mymonsters));
	}
}


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


// open dialogue to buy new monsters
function openShop()
{
		var content 	= '<div class="shop">'
						+ '<h2>Shop</h2>'
						+ '</div>'

		$.fancybox({
			content 	: content,
			margin 		: 0,
			padding 	: 0
		});		
}

// START play ambient loop



// END play ambient loop


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

	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 200 );
	camera.position.z = 100;

	cameraControls = new THREE.OrbitControls( camera );
	cameraControls.addEventListener( 'change', render );

	scene.camera = camera;
	
	//scene.add( new THREE.AmbientLight( 0x111111 ) );
	
	sunPointlight = new THREE.PointLight( 0xffffff, 1.0, 1000 );
	sunPointlight.position.x = 100;
	sunPointlight.position.y = 100;
	sunPointlight.position.z = 100;
	scene.add( sunPointlight );

	var colorTex = THREE.ImageUtils.loadTexture( "assets/textures/earthmap1k.jpg" );
	var normalTex = THREE.ImageUtils.loadTexture( "assets/textures/earthbump1k.jpg" );
	var specularTex = THREE.ImageUtils.loadTexture( "assets/textures/earthspec1k.jpg" );
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


	


	globeMesh = new THREE.Mesh( new THREE.SphereGeometry( 40, 100, 100 ), globeMaterial );
	globeMesh.position.x = 0;
	globeMesh.position.y = 0;
	globeMesh.position.z = 0;
	scene.add( globeMesh );



	window.addEventListener( 'resize', onWindowResize, false );
	//document.addEventListener( 'keydown', onKeyDown, false );

}



function onWindowResize( event ) 
{
	SCREEN_WIDTH = window.innerWidth;
	SCREEN_HEIGHT = window.innerHeight;

	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );

	camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
	camera.updateProjectionMatrix();
}


function animate() 
{
	requestAnimationFrame( animate );
	update();
	render();
}


function update()
{
	globeMesh.rotation.y += 0.001;
	cameraControls.update();
}


function render() 
{
	var currTime = Date.now();
	var deltaTime = ( currTime - lastTime ) * 0.0002;
	//lastTime = currTime;
	//console.log( deltaTime );

	//earthShaderUniforms[ "time" ].value = deltaTime;


	//if( earthShaderUniforms[ "time" ].value > 1.0 )
	//	earthShaderUniforms[ "time" ].value = 0.0;
	
	//globeMaterial.dirty = true;

	renderer.setViewport( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.clear();

	renderer.render( scene, camera );

}