"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { vertexShader, fragmentShader } from "./heroShaders";

type HeroCanvasProps = {
  image1: string;
  image2: string;
  onReady?: () => void;
};

export default function HeroCanvas({ image1, image2, onReady }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTex1: { value: null as THREE.Texture | null },
        uTex2: { value: null as THREE.Texture | null },
        uMouse: { value: new THREE.Vector2(0.5, 0.55) },
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uHover: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTexRes1: { value: new THREE.Vector2(1, 1) },
        uTexRes2: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let loadedCount = 0;
    const onTextureReady = () => {
      loadedCount += 1;
      if (loadedCount === 2) onReady?.();
    };

    const loader = new THREE.TextureLoader();
    const tex1 = loader.load(image1, (t) => {
      material.uniforms.uTexRes1.value.set(t.image.width, t.image.height);
      onTextureReady();
    });
    const tex2 = loader.load(image2, (t) => {
      material.uniforms.uTexRes2.value.set(t.image.width, t.image.height);
      onTextureReady();
    });
    [tex1, tex2].forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    });
    material.uniforms.uTex1.value = tex1;
    material.uniforms.uTex2.value = tex2;

    const target = { x: 0.5, y: 0.55 };
    const current = { x: 0.5, y: 0.55 };
    let hoverTarget = 0;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(w, h);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      target.x = (e.clientX - rect.left) / rect.width;
      target.y = 1 - (e.clientY - rect.top) / rect.height;
      hoverTarget = 1;
    };
    const onPointerLeave = () => {
      hoverTarget = 0;
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    gsap.to(material.uniforms.uIntensity, {
      value: 1,
      duration: 2.4,
      ease: "power2.out",
      delay: 0.15,
    });

    const tick = (time: number) => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      material.uniforms.uMouse.value.set(current.x, current.y);
      material.uniforms.uTime.value = time;
      material.uniforms.uHover.value +=
        (hoverTarget - material.uniforms.uHover.value) * 0.05;
      hoverTarget *= 0.985;
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      mesh.geometry.dispose();
      material.dispose();
      tex1.dispose();
      tex2.dispose();
      renderer.dispose();
    };
  }, [image1, image2, onReady]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
