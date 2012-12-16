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
var sunPointlightCloud;
var missionMeshes = [];


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
        this.missionManager.createMission(this.player);
        this.missionManager.createMission(this.player);
        this.missionManager.createMission(this.player);

        ns.shop = new ns.shopManager();
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

        for(var i = 0, monster = null; monster = this.player.monsterManager.monsterList[i]; ++i)
        {
            list.append('<div id="'+i+'" class="item" data-type="'+monster.type+'">'
                +'<span class="name">'
                +monster.name+' ('+monster.level+')'
                +'</span>'
                +'<span class="xp">'
                +monster.xp+' / '+ns.Monster.getXpRange(monster.level)
                +'</span>'
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
            return Math.round(1+Math.random()*3)
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
        }
        game.gui.drawHUD();
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

        var phi = Math.random() * 2 * Math.PI;
        var theta = Math.random() * Math.PI;

		createRandomChildMissionGraphics(phi, theta, (function(obj, method) { return function() {method.apply(obj, arguments)}; })(mis,mis.draw));
        mis.location.phi = phi;
        mis.location.theta = theta;


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
        globeMesh.remove(missionMeshes.splice(foundKey,1)[0]);
    };

    /*******************************************************************************************************************
     * MISSION
     ******************************************************************************************************************/
    ns.Mission = function(player)
    {
        this.player = player;

        this.children = {name:'Domi Lazarek', age:4, gender: 0, random: ns.Monster.TYPES.getRandom()};
        this.location = {phi:0,theta:0};

        this.div = null;
    };

    ns.Mission.prototype.draw = function()
    {
        if(this.div != null) return;

        this.div = document.createElement('div');
        this.div.className = "missionWindow";
        this.div.dataset['type'] = this.children.random;
        this.div.dataset['level'] = this.children.age;

        $('body').append(this.div);

        this.makeDroppable();
    };

    ns.Mission.prototype.makeDroppable = function()
    {
        var mis = this;
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
                    ns.Monster.prototype.addXP.call(monster, Math.round(xp));

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

                $(this).remove();
                game.missionManager.deleteMission(mis);
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
    $('#sidebar #monsters').height($(window).height()-120);
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
	
	//scene.add( new THREE.AmbientLight( 0x111111 ) );
	
	sunPointlight = new THREE.PointLight( 0xffffff, 1.0, 1000 );
	sunPointlight.position.x = 100;
	sunPointlight.position.y = 100;
	sunPointlight.position.z = 100;
	scene.add( sunPointlight );

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
	var minEarthDistance = 200;

	var starGeometry = new THREE.Geometry();

	for( var i = 0; i < numStars; ++i )
	{
		var radius = Math.random() * 0.5 + 0.1; 

		var currMesh = new THREE.Mesh( new THREE.SphereGeometry( radius, 1, 1 ) );

		currMesh.position.x = ( Math.random() * 2 - 1 ) * maxStarDistance;
		currMesh.position.y = ( Math.random() * 2 - 1 ) * maxStarDistance;
		currMesh.position.z = ( Math.random() * 2 - 1 ) * maxStarDistance;

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
	console.log( pixelValue );
	return pixelValue < 230;
}

function createRandomChildMissionGraphics( phi, theta )
{
	var newMissionMesh = new THREE.Mesh( new THREE.SphereGeometry( 2, 10, 10 ), new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
	newMissionMesh.position.x = globeRadius * Math.sin( theta ) * Math.cos( phi );
	newMissionMesh.position.y = globeRadius * Math.sin( theta ) * Math.sin( phi );
	newMissionMesh.position.z = globeRadius * Math.cos( theta );

	missionMeshes.push( newMissionMesh );
	globeMesh.add( newMissionMesh );

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

function getProjectedScreenPos( mesh )
{
    var modelWorld = mesh.matrixWorld;
    var view = camera.matrixWorldInverse;
    var proj = camera.projectionMatrix;

    var worldViewProj = new THREE.Matrix4();
    worldViewProj.multiply( proj, view );
    worldViewProj.multiply( worldViewProj, modelWorld );


    var pos = new THREE.Vector4( mesh.position.x, mesh.position.y, mesh.position.z, 1.0 );
    pos = worldViewProj.multiplyVector4( pos );

    pos.x = pos.x / pos.w;
    pos.y = pos.y / pos.w;
    pos.z = pos.z / pos.w;

    //ClipSpace -> NDC
    pos.x = ( pos.x + 1.0 ) / 2.0;
    pos.y = ( pos.y + 1.0 ) / 2.0;

    var x = pos.x * SCREEN_WIDTH;
    var y = pos.y * SCREEN_HEIGHT;

    console.log( x );
    console.log( y );
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

	for( var i = 0; i < missionMeshes.length; ++i )
	{
		var intersections = mouseRay.intersectObject( missionMeshes[ i ], false );

		if( intersections[ 0 ] != null )
			return intersections[ 0 ].object;

	}

	return null;
}


function onMouseMove( event )
{
	var pickedMesh = intersectWithMouse( event );

    if( pickedMesh != null )
        getProjectedScreenPos( pickedMesh );
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