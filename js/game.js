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


var myMonsters = new monsterManager();

$(document).ready(function(){

	// display cash
	$('#cash').html(localStorage.getItem('cash')+' $');

	myMonsters.renderList();

		init();
	animate();
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


function init()
{
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	cloudScene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x000000, clearAlpha: 1 } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.domElement.style.position = "relative";
	container.appendChild( renderer.domElement );
	renderer.autoClear = false;

	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 200 );
	camera.position.z = 100;

	scene.camera = camera;
	cloudScene.camera = camera;


	scene.add( new THREE.AmbientLight( 0x111111 ) );
	cloudScene.add( new THREE.AmbientLight( 0x111111 ) );

	sunPointlight = new THREE.PointLight( 0xffffff, 2.0, 1000 );
	sunPointlight.position.x = 100;
	sunPointlight.position.y = 100;
	sunPointlight.position.z = 100;
	scene.add( sunPointlight );


	sunPointlightCloud = new THREE.PointLight( 0xffffff, 2.0, 1000 );
	sunPointlightCloud.position.x = 100;
	sunPointlightCloud.position.y = 100;
	sunPointlightCloud.position.z = 100;
	cloudScene.add( sunPointlightCloud );

	var colorTex = THREE.ImageUtils.loadTexture( "assets/textures/earthmap1k.jpg" );
	var normalTex = THREE.ImageUtils.loadTexture( "assets/textures/earthbump1k.jpg" );
	var specularTex = THREE.ImageUtils.loadTexture( "assets/textures/earthspec1k.jpg" );
	var cloudTex = THREE.ImageUtils.loadTexture( "assets/textures/Earth-Clouds2700.jpg" );
	var cityTex = THREE.ImageUtils.loadTexture( "assets/textures/earthlights1k.jpg" );

	globeMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, map: colorTex, normalMap: normalTex, normalScale: new THREE.Vector2( 0.2, 0.2 ), specularMap: specularTex, transparent: true } );
	globeCloudMaterial = new THREE.MeshLambertMaterial( { map: cloudTex, transparent: true, blending: THREE.AdditiveBlending } );
	globeCityMaterial = new THREE.MeshLambertMaterial( { map: cityTex, transparent: true, blending: THREE.AdditiveBlending } );
	

	globeMesh = new THREE.Mesh( new THREE.SphereGeometry( 40, 100, 100 ), globeMaterial );
	globeMesh.position.x = 0;
	globeMesh.position.y = 0;
	globeMesh.position.z = 0;
	scene.add( globeMesh );

	globeCloudMesh = new THREE.Mesh( new THREE.SphereGeometry( 40, 100, 100 ), globeCloudMaterial );
	globeCloudMesh.position.x = 0;
	globeCloudMesh.position.y = 0;
	globeCloudMesh.position.z = 0;
	globeCloudMesh.scale.x = 1.001;
	globeCloudMesh.scale.y = 1.001;
	globeCloudMesh.scale.z = 1.001;
	cloudScene.add( globeCloudMesh );

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
	globeCloudMesh.rotation.y += 0.0015;
}


function render() 
{
	var r = Date.now() * 0.0005;

	renderer.setViewport( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.clear();

	globeMesh.material = globeMaterial;
	renderer.render( scene, camera );

	globeMesh.material = globeCityMaterial;
	renderer.render( scene, camera );

	renderer.render( cloudScene, camera );

}