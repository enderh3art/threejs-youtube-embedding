import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import Stats from 'stats.js'

const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)

let player = null
let cssscene = null;
let cssrenderer = null;
let occlusionMaterial = null;
let webglrepresentation

function loadYouTubeApi() {

    console.log("loading api");
 
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
 
function createYoutubeVideo() {

    cssscene = new THREE.Scene();
    cssrenderer = new CSS3DRenderer();
    cssrenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('css').appendChild(cssrenderer.domElement);

    const iframe = document.createElement( 'div' );
    iframe.style.width = '720px';
    iframe.style.height = '405px';
    iframe.style.border = '0px';
    iframe.setAttribute("id", "iframe");


    var cssobject = new CSS3DObject(iframe);
    cssobject.position.set(0, 0, -4);
    cssobject.rotation.y = 0;
    cssobject.scale.set(0.01, 0.01, 0.01);

    cssscene.add(cssobject);

    occlusionMaterial = new THREE.MeshPhongMaterial({
        opacity: 1.0,
        color: new THREE.Color('black'),
        blending: THREE.NoBlending,
        // side: THREE.DoubleSide,
    });

    webglrepresentation = new THREE.Mesh(new THREE.PlaneGeometry(720, 405), occlusionMaterial);
    webglrepresentation.position.copy(cssobject.position);
    webglrepresentation.rotation.copy(cssobject.rotation);
    webglrepresentation.scale.copy(cssobject.scale);
    scene.add(webglrepresentation);

}

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

const color = 0xFFFFFF;  // white
const near = 10;
const far = 30;
scene.fog = new THREE.Fog(color, near, far);


/**
 * Update all materials
 */
const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            // child.material.envMap = environmentMap
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg'
])

environmentMap.encoding = THREE.sRGBEncoding

scene.background = environmentMap
scene.environment = environmentMap

debugObject.envMapIntensity = 2.5
gui.add(debugObject, 'envMapIntensity').min(0).max(10).step(0.001).onChange(updateAllMaterials)

/**
 * Models
 */
gltfLoader.load(
    '/models/FlightHelmet/glTF/FlightHelmet.gltf',
    (gltf) =>
    {
        gltf.scene.scale.set(10, 10, 10)
        gltf.scene.position.set(0, - 4, 0)
        gltf.scene.rotation.y = Math.PI * 0.5
        scene.add(gltf.scene)

        gui.add(gltf.scene.rotation, 'y').min(- Math.PI).max(Math.PI).step(0.001).name('rotation')

        updateAllMaterials()
    }
)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.camera.far = 15
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 3, - 2.25)
// scene.add(directionalLight)

gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('lightIntensity')
gui.add(directionalLight.position, 'x').min(- 5).max(5).step(0.001).name('lightX')
gui.add(directionalLight.position, 'y').min(- 5).max(5).step(0.001).name('lightY')
gui.add(directionalLight.position, 'z').min(- 5).max(5).step(0.001).name('lightZ')

/**
 * Raycaster
 */
 const raycaster = new THREE.Raycaster()
 let currentIntersect = null

 /**
 * Mouse
 */
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
})

window.addEventListener('click', () =>
{
    if(currentIntersect)
    {
        console.log(player)
        switch(currentIntersect.object)
        {
            case webglrepresentation:
                if (player.getPlayerState() !== 1) {
                    player.playVideo();
                } else {
                    player.pauseVideo()
                }
                break
        }
    }
})

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    cssrenderer.setSize(sizes.width, sizes.height)
    // cssrenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 2000)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMappingExposure = 3
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

gui
    .add(renderer, 'toneMapping', {
        No: THREE.NoToneMapping,
        Linear: THREE.LinearToneMapping,
        Reinhard: THREE.ReinhardToneMapping,
        Cineon: THREE.CineonToneMapping,
        ACESFilmic: THREE.ACESFilmicToneMapping
    })
gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001)

createYoutubeVideo();

loadYouTubeApi();

/**
 * Animate
 */
const tick = () =>
{
    stats.begin()
    // Cast a ray from the mouse and handle events
    raycaster.setFromCamera(mouse, camera)

    const objectsToTest = [webglrepresentation]
    const intersects = raycaster.intersectObjects(objectsToTest)
    
    if(intersects.length)
    {
        if(!currentIntersect)
        {
            console.log('mouse enter')
        }

        currentIntersect = intersects[0]
    }
    else
    {
        if(currentIntersect)
        {
            console.log('mouse leave')
        }
        
        currentIntersect = null
    }

    // Update controls
    controls.update()
    // cubeCamera.update(renderer, scene)

    // Render
    renderer.render(scene, camera)

    cssrenderer.render(cssscene, camera)
    
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    stats.end()
}

tick()

window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube API is loading');
    player = new YT.Player('iframe', {
    height: '2160', // Adjust this resolution to desired video resolution
    width: '100%',
    videoId: 'TqH_E-9FRfM',
    playerVars: {
        autoplay: 0,
        suggestedQuality: 'highdef',
        modestbranding: 'true',
        controls: '0',
        cc_load_policy: 3,
        fs: 0,
        loop: 1,
        playsinline: 1,
        showinfo: 0,
        rel: 0,
        disablekb: 1,
        ecver: 2,
    },
    events: {
        'onReady': () => {
            occlusionMaterial.opacity = 0
        }
    }
    });
}
