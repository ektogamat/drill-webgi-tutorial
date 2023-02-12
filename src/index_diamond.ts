import {
    ViewerApp,
    AssetManagerPlugin,
    GBufferPlugin,
    ProgressivePlugin,
    TonemapPlugin,
    SSRPlugin,
    SSAOPlugin,
    mobileAndTabletCheck,
    BloomPlugin,
    DiamondPlugin,
    Vector3, GammaCorrectionPlugin, MeshBasicMaterial2, Color, AssetImporter
} from "webgi";
import "./styles.css";

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from '@studio-freight/lenis'

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
  direction: 'vertical', // vertical, horizontal
  gestureDirection: 'vertical', // vertical, horizontal, both
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
})

lenis.stop()

function raf(time: number) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  
  requestAnimationFrame(raf)

gsap.registerPlugin(ScrollTrigger)

async function setupViewer(){

    const viewer = new ViewerApp({
        canvas: document.getElementById('webgi-canvas') as HTMLCanvasElement,
        isAntialiased: true,
    })

    const isMobile = mobileAndTabletCheck()
    // console.log(isMobile)

    const manager = await viewer.addPlugin(AssetManagerPlugin)
    const camera = viewer.scene.activeCamera
    const position = camera.position
    const target = camera.target
    const exitButton = document.querySelector('.button--exit') as HTMLElement
    const customizerInterface = document.querySelector('.customizer--container') as HTMLElement

    // Add plugins individually.
    await viewer.addPlugin(GBufferPlugin)
    await viewer.addPlugin(new ProgressivePlugin(32))
    await viewer.addPlugin(new TonemapPlugin(true))
    await viewer.addPlugin(GammaCorrectionPlugin)
    await viewer.addPlugin(SSRPlugin)
    await viewer.addPlugin(SSAOPlugin)
    await viewer.addPlugin(BloomPlugin)
    await viewer.addPlugin(DiamondPlugin)

    // Loader
    const importer = manager.importer as AssetImporter

    importer.addEventListener("onProgress", (ev) => {
        const progressRatio = (ev.loaded / ev.total)
        // console.log(progressRatio)
        document.querySelector('.progress')?.setAttribute('style', `transform: scaleX(${progressRatio})`)
    })

    importer.addEventListener("onLoad", (ev) => {
        gsap.to('.loader', {x: '100%', duration: 0.8, ease: 'power4.inOut', delay: 1, onComplete: () =>{
            document.body.style.overflowY = 'auto'
            lenis.start()

        }})
    })

    viewer.renderer.refreshPipeline()

    await manager.addFromPath("./assets/ring_final.glb")

    const drillMaterial = manager.materials!.findMaterialsByName('diamond')[0] as MeshBasicMaterial2

    viewer.getPlugin(TonemapPlugin)!.config!.clipBackground = true // in case its set to false in the glb

    viewer.scene.activeCamera.setCameraOptions({controlsEnabled: false})

    if (isMobile){
        position.set(-3.5, -1.1, 5.5)
        target.set(-0.8, 1.55, -0.7)
        camera.setCameraOptions({ fov: 40 })
    } else{
        target.set(-1.4, 2, 1)
    }

    onUpdate()
    
    window.scrollTo(0,0)

    function setupScrollanimation(){

        const tl = gsap.timeline()

        // FIRST SECTION

        tl
        .to(position, {x: isMobile ? -6.0 : 1.56, y: isMobile ?  5.5 :  -2.26, z: isMobile ? -3.3 :  -3.85,
            scrollTrigger: {
                trigger: ".second",
                start:"top bottom",
                end: "top top", scrub: true,
                immediateRender: false
        }, onUpdate})

        .to(".section--one--container", { xPercent:'-150' , opacity:0,
            scrollTrigger: {
                trigger: ".second",
                start:"top bottom",
                end: "top 80%", scrub: 1,
                immediateRender: false
        }})
        .to(target, {x: isMobile ? -1.1 : -1.37, y: isMobile ? 1.0 : 1.99 , z: isMobile ? -0.1 : -0.37,
            scrollTrigger: {
                trigger: ".second",
                start:"top bottom",
                end: "top top", scrub: true,
                immediateRender: false
        }})

        // LAST SECTION

        .to(position, {x: -3.4, y: 9.6, z: 1.71,
            scrollTrigger: {
                trigger: ".third",
                start:"top bottom",
                end: "top top", scrub: true,
                immediateRender: false
        }, onUpdate})

        .to(target, {x: -1.5, y: 2.13 , z: -0.4,
            scrollTrigger: {
                trigger: ".third",
                start:"top bottom",
                end: "top top", scrub: true,
                immediateRender: false
        }})

    }

    setupScrollanimation()

    // WEBGI UPDATE
    let needsUpdate = true;

    function onUpdate() {
        needsUpdate = true;
        // viewer.renderer.resetShadows()
        viewer.setDirty()
    }

    viewer.addEventListener('preFrame', () =>{
        if(needsUpdate){
            camera.positionTargetUpdated(true)
            needsUpdate = false
        }
    })

    // KNOW MORE EVENT
	document.querySelector('.button--hero')?.addEventListener('click', () => {
		const element = document.querySelector('.second')
		window.scrollTo({ top: element?.getBoundingClientRect().top, left: 0, behavior: 'smooth' })
	})

	// SCROLL TO TOP
	document.querySelectorAll('.button--footer')?.forEach(item => {
		item.addEventListener('click', () => {
			window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
		})
	})

    // CUSTOMIZE
    const sections = document.querySelector('.container') as HTMLElement
    const mainContainer = document.getElementById('webgi-canvas-container') as HTMLElement
	document.querySelector('.button--customize')?.addEventListener('click', () => {
        sections.style.display = "none"
        mainContainer.style.pointerEvents = "all"
        document.body.style.cursor = "grab"
        lenis.stop()

        gsap.to(position, {x: -2.6, y: 0.2, z: -9.6, duration: 2, ease: "power3.inOut", onUpdate})
        gsap.to(target, {x: -0.15, y: 1.18 , z: 0.12, duration: 2, ease: "power3.inOut", onUpdate, onComplete: enableControlers})
	})

    function enableControlers(){
        exitButton.style.display = "block"
        customizerInterface.style.display = "block"
        viewer.scene.activeCamera.setCameraOptions({controlsEnabled: true})
    }


    // EXIT CUSTOMIZER
	exitButton.addEventListener('click', () => {
        gsap.to(position, {x: -3.4, y: 9.6, z: 1.71, duration: 1, ease: "power3.inOut", onUpdate})
        gsap.to(target, {x: -1.5, y: 2.13 , z: -0.4, duration: 1, ease: "power3.inOut", onUpdate})

        viewer.scene.activeCamera.setCameraOptions({controlsEnabled: false})
        sections.style.display = "contents"
        mainContainer.style.pointerEvents = "none"
        document.body.style.cursor = "default"
        exitButton.style.display = "none"
        customizerInterface.style.display = "none"
        lenis.start()

	})

    document.querySelector('.button--colors.black')?.addEventListener('click', () => {
		changeColor(new Color(0x0022bc).convertSRGBToLinear())
    })

    document.querySelector('.button--colors.red')?.addEventListener('click', () => {
		changeColor(new Color(0xfe2d2d).convertSRGBToLinear())
    })

    document.querySelector('.button--colors.yellow')?.addEventListener('click', () => {
		changeColor(new Color(0xF0D56C).convertSRGBToLinear())
    })

    function changeColor(_colorToBeChanged: Color){
        drillMaterial.color = _colorToBeChanged;
        viewer.scene.setDirty()
    }

}

setupViewer()
