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

// She Sharp 品牌色彩预设 - 明亮活泼浅色调版本
export const brandColors = {
  // 超明亮浅色调紫色系 - Hero 主色调
  heroPeriwinkle: [0.890, 0.870, 1.0] as [number, number, number],     // #e3deff - 超浅长春花蓝，明亮活泼
  heroPurpleLight: [0.950, 0.890, 0.940] as [number, number, number],   // #f2e3f0 - 超浅紫色，温柔明亮
  
  // 明亮中等色调 - 次要板块
  commitmentsPastel: [0.850, 0.920, 1.0] as [number, number, number],   // #d9ebff - 浅蓝白色调
  commitmentsLavender: [0.920, 0.890, 1.0] as [number, number, number], // #ebe3ff - 浅薰衣草色
  
  // 清新薄荷系 - 活力板块
  eventsMinty: [0.880, 0.980, 0.950] as [number, number, number],       // #e0faf2 - 超浅薄荷绿
  eventsSoftGreen: [0.900, 0.985, 0.965] as [number, number, number],   // #e6fbf6 - 极浅绿色
  
  // 温和粉彩系 - 温馨板块  
  testimonialsBlush: [0.970, 0.920, 0.950] as [number, number, number], // #f7ebf2 - 浅粉调
  testimonialsSky: [0.920, 0.950, 0.990] as [number, number, number],   // #ebf2fd - 浅天空蓝
  
  // CTA 区域 - 柔和但有存在感
  ctaSoftMint: [0.930, 0.990, 0.980] as [number, number, number],       // #edfcf7 - 极浅薄荷白
  ctaDreamyPurple: [0.940, 0.930, 0.980] as [number, number, number],   // #f0edf9 - 梦幻浅紫
  
  // 导航下拉框专用配色 - 基于项目品牌色彩系统的协调搭配
  navAbout: [0.784, 0.275, 0.671] as [number, number, number],          // #c846ab - 品牌紫色中调，团队和使命感
  navPrograms: [0.537, 0.510, 1.0] as [number, number, number],         // #8982ff - 长春花蓝，教育和活动感  
  navGetInvolved: [0.694, 0.965, 0.914] as [number, number, number],    // #b1f6e9 - 薄荷绿，参与和行动感
  navResources: [0.075, 0.471, 0.820] as [number, number, number],      // #1378d1 - 功能蓝色，资源和知识感
  
  // 原有颜色保留（兼容性）
  purpleBright: [0.784, 0.275, 0.671] as [number, number, number],
  periwinkleBright: [0.647, 0.620, 1.0] as [number, number, number],
  mintBright: [0.694, 0.965, 0.914] as [number, number, number],
  purpleDark: [0.608, 0.180, 0.514] as [number, number, number],
  purpleMid: [0.784, 0.275, 0.671] as [number, number, number],
  periwinkleDark: [0.537, 0.510, 1.0] as [number, number, number],
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
    // Observe element size changes to ensure canvas always fills container
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(ctn);
    }
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
      ro?.disconnect();
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
