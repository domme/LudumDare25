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

	renderer = new THREE.WebGLRenderer( { antialias: true, clearColor: 0x000000, clearAlpha: 1 } );
	renderer.setSize( SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.domElement.style.position = "relative";
	container.appendChild( renderer.domElement );
	renderer.autoClear = false;

	camera = new THREE.PerspectiveCamera( 60, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 200 );
	camera.position.z = 100;

	scene.camera = camera;
	
	scene.add( new THREE.AmbientLight( 0x111111 ) );
	
	sunPointlight = new THREE.PointLight( 0xffffff, 2.0, 1000 );
	sunPointlight.position.x = 100;
	sunPointlight.position.y = 100;
	sunPointlight.position.z = 100;
	scene.add( sunPointlight );

	var colorTex = THREE.ImageUtils.loadTexture( "assets/textures/earthmap1k.jpg" );
	var normalTex = THREE.ImageUtils.loadTexture( "assets/textures/earthbump1k.jpg" );
	var specularTex = THREE.ImageUtils.loadTexture( "assets/textures/earthspec1k.jpg" );
	var cloudTex = THREE.ImageUtils.loadTexture( "assets/textures/Earth-Clouds2700.jpg" );
	var cityTex = THREE.ImageUtils.loadTexture( "assets/textures/earthlights1k.jpg" );

	
	var earthShader = MonsterShaderLib[ "earth" ];
	var earthShaderUniforms = THREE.UniformsUtils.clone( earthShader.uniforms );

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
}


function render() 
{
	var r = Date.now() * 0.0005;

	renderer.setViewport( 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT );
	renderer.clear();

	renderer.render( scene, camera );

}