"use client";

import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps {
  color?: [number, number, number];
  speed?: number;
  amplitude?: number;
  mouseReact?: boolean;
  className?: string;
}

// She Sharp 品牌色彩预设 - 明亮活泼版本
export const brandColors = {
  // 明亮活泼的紫色系
  purpleBright: [0.784, 0.275, 0.671] as [number, number, number],     // #c846ab - 明亮紫色
  purpleVibrant: [0.847, 0.408, 0.741] as [number, number, number],    // #d868bd - 活力紫色
  
  // 明亮的长春花蓝
  periwinkleBright: [0.647, 0.620, 1.0] as [number, number, number],   // #a59eff - 明亮长春花蓝
  periwinkleVibrant: [0.749, 0.722, 1.0] as [number, number, number],  // #bfb8ff - 活力长春花蓝
  
  // 明亮的薄荷绿
  mintBright: [0.694, 0.965, 0.914] as [number, number, number],       // #b1f6e9 - 明亮薄荷绿
  mintVibrant: [0.800, 0.980, 0.941] as [number, number, number],      // #ccfaf0 - 活力薄荷绿
  
  // 明亮的蓝色系
  blueBright: [0.408, 0.722, 0.949] as [number, number, number],       // #68b8f2 - 明亮蓝色
  blueVibrant: [0.510, 0.800, 1.0] as [number, number, number],        // #82ccff - 活力蓝色
  
  // 渐变组合 - 明亮活泼
  gradientPurplePeriwinkle: [0.784, 0.275, 0.671] as [number, number, number],  // 紫色到长春花蓝
  gradientMintBlue: [0.694, 0.965, 0.914] as [number, number, number],          // 薄荷绿到蓝色
  
  // 保留一些原始颜色用于对比
  purpleDark: [0.608, 0.180, 0.514] as [number, number, number],       // #9b2e83
  purpleMid: [0.784, 0.275, 0.671] as [number, number, number],        // #c846ab
  periwinkleDark: [0.537, 0.510, 1.0] as [number, number, number],     // #8982ff
};

export default function Iridescence({
  color = [1, 1, 1],
  speed = 1.0,
  amplitude = 0.1,
  mouseReact = true,
  className = "",
  ...rest
}: IridescenceProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!ctnDom.current) return;
    const ctn = ctnDom.current;
    const renderer = new Renderer();
    const gl = renderer.gl;
    gl.clearColor(1, 1, 1, 1);

    let program: Program;

    function resize() {
      const scale = 1;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    }
    window.addEventListener("resize", resize, false);
    resize();

    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: {
          value: new Color(
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height
          ),
        },
        uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
        uAmplitude: { value: amplitude },
        uSpeed: { value: speed },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    function handleMouseMove(e: MouseEvent) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      mousePos.current = { x, y };
      program.uniforms.uMouse.value[0] = x;
      program.uniforms.uMouse.value[1] = y;
    }
    if (mouseReact) {
      ctn.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (mouseReact) {
        ctn.removeEventListener("mousemove", handleMouseMove);
      }
      ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [color, speed, amplitude, mouseReact]);

  return (
    <div
      ref={ctnDom}
      className={`w-full h-full ${className}`}
      {...rest}
    />
  );
}

// 便捷的品牌色彩组件
export function IridescenceWithBrandColor({
  colorKey,
  ...props
}: Omit<IridescenceProps, 'color'> & {
  colorKey: keyof typeof brandColors;
}) {
  return (
    <Iridescence
      color={brandColors[colorKey]}
      {...props}
    />
  );
}
