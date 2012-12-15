$(document).ready( function() {

	init();
	animate();
} ); 


var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
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