import * as THREE from 'https://cdn.skypack.dev/three@v0.128';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@v0.128/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.skypack.dev/three@v0.128.0/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@v0.128/examples/jsm/controls/OrbitControls.js';

/*change stuff here not in code*/
let avaFile = "./VideoGameCabinetCastle.glb"
//edit on 7/14, make bubble file array, change the file name to suit the use
let bubbleFile = ["./speech-bubble.glb","./OLDspeech-bubble.glb","./OLDNEWspeech-bubble.glb"]
let bubbleFileCount = bubbleFile.length
let videoTexture = "./vidGamesCabReDoAug20.mp4"
let videoMeshName =  "videoGameCabinetCastle"
let videoMeshMaterial = "interiorVideoGameCabinet_txtr"
let appearTime = 1100;
let disappearTime = 8000;
/*change stuff here not in code*/


//three js components
let scene, camera, renderer, controls
let mixer;
const clock = new THREE.Clock()
let cameraPosition = new THREE.Vector3(0,1,3)
let loaded = false
let bubbles = []
let currentBubble = 0
let videoMode = false

function init(){
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 1000)
  camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
  
  //set up renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#three'),
    antialias: true,
    alpha: true
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  controls = new OrbitControls( camera, renderer.domElement);
  controls.target.set( 0, 1, 0.5 );
  
  //add lights
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(0, 2, 2)
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight2.position.set(0, -2, 2)
  const ambientLight = new THREE.AmbientLight(0xffffff)
  scene.add(directionalLight, ambientLight)

  const manager = new THREE.LoadingManager();
  manager.onLoad = function ( ) {
    //play speech bubble
    //first iteration
    bubbleInteraction()
    //trigger anytime the animation loops
    mixer.addEventListener('loop', e=>{
      bubbleInteraction()
    } )
    
    loaded = true
  };
  
  const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath( 'js/libs/draco/gltf/' );

	const loader = new GLTFLoader(manager);
	loader.setDRACOLoader( dracoLoader );
	loader.load( avaFile, function ( gltf ) {
  	const model = gltf.scene;
  	model.position.set( 0, 0, 0 );
  	model.scale.set( 1, 1, 1 );
  	scene.add( model );
    mixer = new THREE.AnimationMixer( model );
    //console.log(model)
    let material = null;
    model.traverse(d=>{
      if(d.isMesh && d.name === videoMeshName){
        if(d.material.name === videoMeshMaterial){
          material = d.material
        }else{
            console.log(`Find mesh but can't find material with name ${videoMeshMaterial}`)
        }
      }
    })
    //edit on 7/14, make error log to make more sense
    if(material == null){
      console.log(`Can't find mesh with name ${videoMeshName}`)
    }
    
    let texture = createVideoTexture(videoTexture)
    texture.flipY = false
    if(material != null){
      material.map = texture
      material.needsUpdate = true
    }
    
    gltf.animations.forEach(d=>{
      mixer.clipAction(d).play();
    })
	}, undefined, function ( e ) {
		console.error( e );
  } );

  //edit on 7/14, load array of bubbles instead of 1
  bubbleFile.forEach((path,i)=>{
    loader.load(path,function(gltf){
      bubbles[i] = gltf.scene
      bubbles[i].position.set( 0.7, 1.4, 0.7 )
    	bubbles[i].scale.set( 1, 1, 1 )
      bubbles[i].visible = false;
      scene.add( bubbles[i] )
    })
  })
  
  window.onresize = function () {  
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

let timeElapsed = 0
function animate () {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
  
  const delta = clock.getDelta();
  timeElapsed += delta
  controls.update();

  if(loaded){
    mixer.update( delta );
    if(!videoMode){
      //material.map.offset.set(timeElapsed/2,0)
    }
  }
}

//edit on 7/14, iterate through bubbles and show and hide them
function bubbleInteraction(){
  setTimeout(()=>{bubbles[currentBubble].visible = true},appearTime)
  setTimeout(()=>{
    bubbles[currentBubble].visible = false
    currentBubble = (currentBubble +1)%bubbleFileCount
  },disappearTime)
}

function createVideoTexture (src) {
  let videos = document.createElement("video")
  videos.src = src
  videos.muted = true
  videos.loop = true
  videos.playsinline = true
  videos.load() // must call after setting/changing source
  videos.play()
  // // Show loading animation.
  // var playPromise = videos.play()
  // if (playPromise !== undefined) {
  //   playPromise.then(_ => {
  //     // Automatic playback started!
  //     // Show playing UI.
  //   })
  //     .catch(error => {
  //       // Auto-play was prevented
  //       // Show paused UI.
  //     });
  // }
  return new THREE.VideoTexture(videos)
}

init()
animate()