$(document).ready( function() {

	init();
	animate();
} ); 


var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var camera;
var scene;
var globeMesh;
var globeMaterial;
var renderer;
var sunPointlight;

var container, stats;

function init()
{
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1 } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.domElement.style.position = "relative";
	container.appendChild( renderer.domElement );
	renderer.autoClear = false;

	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 200 );
	camera.position.z = 100;

	scene.camera = camera;


	scene.add( new THREE.AmbientLight( 0x444444 ) );

	sunPointlight = new THREE.PointLight( 0xffffff, 2.0, 1000 );
	sunPointlight.position.x = 100;
	sunPointlight.position.y = 100;
	sunPointlight.position.z = 100;
	scene.add( sunPointlight );

	var colorTex = THREE.ImageUtils.loadTexture( "assets/textures/earthmap1k.jpg" );

	var normalTex;
	var specularTex;



	globeMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, map: colorTex } );

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
	render();
}


function render() 
{
	var r = Date.now() * 0.0005;

	renderer.clear();

	renderer.setViewport( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.render( scene, camera );
}