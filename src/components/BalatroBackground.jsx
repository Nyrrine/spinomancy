import { useRef, useEffect } from 'react'

// Balatro background shader — ported from the official Godot shader
// Supports dynamic color changes per ante

const VERT = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

// Ported from the Godot Balatro Background Shader
// Three color uniforms change per ante for visual progression
const FRAG = `
  #ifdef GL_ES
  precision highp float;
  #endif

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;

  #define SPIN_ROTATION_SPEED 0.6
  #define MOVE_SPEED 2.0
  #define SPIN_AMOUNT 0.25
  #define PIXEL_FILTER 740.0
  #define CONTRAST 2.8
  #define LIGHTING 0.35
  #define SPIN_EASE 1.0

  vec4 effect(vec2 screenSize, vec2 screen_coords) {
    float pixel_size = length(screenSize) / PIXEL_FILTER;
    vec2 uv = (floor(screen_coords * (1.0 / pixel_size)) * pixel_size - 0.5 * screenSize) / length(screenSize);
    float uv_len = length(uv);

    float speed = SPIN_ROTATION_SPEED * SPIN_EASE * 0.2;
    speed = u_time * speed + 302.2;

    float new_pixel_angle = atan(uv.y, uv.x) + speed - SPIN_EASE * 20.0 * (SPIN_AMOUNT * uv_len + (1.0 - SPIN_AMOUNT));
    vec2 mid = (screenSize / length(screenSize)) / 2.0;
    uv = vec2(uv_len * cos(new_pixel_angle) + mid.x, uv_len * sin(new_pixel_angle) + mid.y) - mid;

    uv *= 30.0;
    speed = u_time * MOVE_SPEED;
    vec2 uv2 = vec2(uv.x + uv.y);

    for (int i = 0; i < 5; i++) {
      uv2 += sin(max(uv.x, uv.y)) + uv;
      uv += 0.5 * vec2(cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121), sin(uv2.x - 0.113 * speed));
      uv -= 1.0 * cos(uv.x + uv.y) - 1.0 * sin(uv.x * 0.711 - uv.y);
    }

    float contrast_mod = 0.25 * CONTRAST + 0.5 * SPIN_AMOUNT + 1.2;
    float paint_res = min(2.0, max(0.0, length(uv) * 0.035 * contrast_mod));
    float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
    float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
    float c3p = 1.0 - min(1.0, c1p + c2p);

    float ligth = (LIGHTING - 0.2) * max(c1p * 5.0 - 4.0, 0.0) + LIGHTING * max(c2p * 5.0 - 4.0, 0.0);

    vec4 col1 = vec4(u_color1, 1.0);
    vec4 col2 = vec4(u_color2, 1.0);
    vec4 col3 = vec4(u_color3, 1.0);

    vec4 ret_col = (0.3 / CONTRAST) * col1 + (1.0 - 0.3 / CONTRAST) * (col1 * c1p + col2 * c2p + vec4(c3p * col3.rgb, c3p * col1.a)) + ligth;
    ret_col.a = 1.0;
    return ret_col;
  }

  void main() {
    gl_FragColor = effect(u_resolution, gl_FragCoord.xy);
  }
`

// Color schemes per ante (inspired by Balatro's visual progression)
const ANTE_COLORS = [
  // Ante 1: Classic red/blue (default Balatro)
  { c1: [0.871, 0.267, 0.231], c2: [0.0, 0.42, 0.706], c3: [0.086, 0.137, 0.145] },
  // Ante 2: Purple/teal
  { c1: [0.6, 0.2, 0.7], c2: [0.1, 0.5, 0.5], c3: [0.08, 0.1, 0.15] },
  // Ante 3: Orange/deep blue
  { c1: [0.9, 0.45, 0.1], c2: [0.1, 0.2, 0.6], c3: [0.1, 0.08, 0.12] },
  // Ante 4: Gold/navy
  { c1: [0.85, 0.7, 0.15], c2: [0.05, 0.15, 0.45], c3: [0.1, 0.1, 0.08] },
  // Ante 5: Green/crimson
  { c1: [0.2, 0.7, 0.3], c2: [0.7, 0.1, 0.15], c3: [0.06, 0.12, 0.08] },
  // Ante 6: Pink/dark teal
  { c1: [0.85, 0.25, 0.55], c2: [0.05, 0.35, 0.4], c3: [0.1, 0.08, 0.1] },
  // Ante 7: Ice blue/silver
  { c1: [0.3, 0.6, 0.9], c2: [0.5, 0.5, 0.55], c3: [0.05, 0.08, 0.12] },
  // Ante 8: Pure gold/black (final boss energy)
  { c1: [0.95, 0.75, 0.1], c2: [0.15, 0.05, 0.0], c3: [0.05, 0.03, 0.02] },
]

export default function BalatroBackground({ className = '', ante = 0 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const colorsRef = useRef(ANTE_COLORS[0])

  // Smoothly update colors when ante changes
  useEffect(() => {
    colorsRef.current = ANTE_COLORS[Math.min(ante, ANTE_COLORS.length - 1)]
  }, [ante])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: false, antialias: false })
    if (!gl) return

    function compileShader(src, type) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s))
      }
      return s
    }

    const vs = compileShader(VERT, gl.VERTEX_SHADER)
    const fs = compileShader(FRAG, gl.FRAGMENT_SHADER)
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog))
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uColor1 = gl.getUniformLocation(prog, 'u_color1')
    const uColor2 = gl.getUniformLocation(prog, 'u_color2')
    const uColor3 = gl.getUniformLocation(prog, 'u_color3')

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    function render() {
      const t = (performance.now() - start) / 1000
      const c = colorsRef.current
      gl.uniform1f(uTime, t)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform3f(uColor1, c.c1[0], c.c1[1], c.c1[2])
      gl.uniform3f(uColor2, c.c2[0], c.c2[1], c.c2[2])
      gl.uniform3f(uColor3, c.c3[0], c.c3[1], c.c3[2])
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animRef.current = requestAnimationFrame(render)
    }
    animRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  )
}
