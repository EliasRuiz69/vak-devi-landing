export const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D uTex1;
  uniform sampler2D uTex2;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uHover;
  uniform vec2 uResolution;
  uniform vec2 uTexRes1;
  uniform vec2 uTexRes2;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  vec2 coverUv(vec2 uv, vec2 res, vec2 texRes) {
    float resRatio = res.x / res.y;
    float texRatio = texRes.x / texRes.y;
    vec2 newUv = uv - 0.5;
    if (resRatio < texRatio) {
      newUv.x *= resRatio / texRatio;
    } else {
      newUv.y *= texRatio / resRatio;
    }
    return newUv + 0.5;
  }

  void main() {
    vec2 aspectCorrect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 dir = (vUv - uMouse) * aspectCorrect;
    float dist = length(dir);
    float falloff = smoothstep(0.22, 0.0, dist);

    float ambient = fbm(vUv * 3.0 + uTime * 0.04);
    float ambient2 = fbm(vUv * 5.0 - uTime * 0.03 + 4.2);

    float strength = (0.006 + 0.02 * uHover) * uIntensity;

    vec2 offset = vec2(ambient - 0.5, ambient2 - 0.5) * strength;
    offset += normalize(dir + 0.0001) * falloff * strength * 1.8;

    vec2 uv1 = coverUv(vUv + offset, uResolution, uTexRes1);
    vec2 uv2 = coverUv(vUv + offset * 1.2, uResolution, uTexRes2);

    vec4 c1 = texture2D(uTex1, uv1);
    vec4 c2 = texture2D(uTex2, uv2);

    float mixAmt = clamp(falloff * 0.6, 0.0, 1.0) * uIntensity;
    vec4 color = mix(c1, c2, mixAmt);

    float vig = smoothstep(1.0, 0.35, length(vUv - 0.5));
    color.rgb *= mix(0.82, 1.0, vig);

    gl_FragColor = color;
  }
`;
