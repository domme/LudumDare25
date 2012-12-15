$(document).ready( function() {

	init();

} ); 


var SCREEN_WIDTH = window.innerWidth;
var SCREEN_HEIGHT = window.innerHeight;
var camera;
var scene;
var globeMesh;

var container, stats;

function init()
{
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	


}