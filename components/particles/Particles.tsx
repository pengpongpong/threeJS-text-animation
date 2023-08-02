"use client"
import Script from "next/script"
import React, { useEffect } from 'react'
import { LoadingManager, TextureLoader} from "three";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { Environment } from "./particle-animation";


const Particles = () => {
	const preload = () => {
		let manager = new LoadingManager();
		manager.onLoad = function () {
			const environment = new Environment(typo as Font, particle);
		}
		let typo: Font | null = null;
		const loader = new FontLoader(manager);
		const font = loader.load("https://res.cloudinary.com/dzvrnl80x/raw/upload/v1690988872/threeJS-particle-text-animation/yqyty0ccaqbegaahrzks.json", function (font) { typo = font; });
		const particle = new TextureLoader(manager).load("https://res.cloudinary.com/dzvrnl80x/image/upload/v1690990948/threeJS-particle-text-animation/particle_owoykv.png");
	}

	useEffect(() => {
		preload()
	}, [])

	return (
		<>
			<section id="magic"></section>
			<Script src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r125/three.min.js'></Script>
		</>
	)
}

export default Particles