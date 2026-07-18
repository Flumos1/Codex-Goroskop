const canvas = document.querySelector("#portal-canvas");
let context = null;
let width = 0;
let height = 0;
let pixelRatio = 1;
let stars = [];
let time = 0;
let fallbackActive = false;

async function setupHomeProfile() {
  const form = document.querySelector("#home-profile-form");
  const placeSelect = document.querySelector("#home-place-select");
  if (!form || !placeSelect || !window.CodexProfile) return;
  await CodexProfile.setupPlaceSelect(placeSelect);
  CodexProfile.applyToForm(form);
  CodexProfile.bindForm(form);
}

function resize() {
  if (!fallbackActive) return;
  if (!context) context = canvas.getContext("2d");
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  stars = Array.from({ length: Math.min(360, Math.floor(width * height / 2600)) }, (_, index) => ({
    angle: (index / 360) * Math.PI * 2 + Math.random() * 0.8,
    radius: 90 + Math.random() * Math.max(width, height) * 0.55,
    depth: 0.28 + Math.random() * 0.9,
    size: 0.8 + Math.random() * 2.2,
    hue: Math.random(),
  }));
}

function draw() {
  if (!fallbackActive) return;
  time += 0.006;
  context.clearRect(0, 0, width, height);

  const cx = width * 0.52;
  const cy = height * 0.48;
  const gradient = context.createRadialGradient(cx, cy, 30, cx, cy, Math.max(width, height) * 0.75);
  gradient.addColorStop(0, "rgba(255, 250, 226, 0.92)");
  gradient.addColorStop(0.28, "rgba(67, 118, 126, 0.24)");
  gradient.addColorStop(0.62, "rgba(47, 38, 72, 0.38)");
  gradient.addColorStop(1, "rgba(14, 18, 28, 0.96)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  drawOrbit(cx, cy, Math.min(width, height) * 0.18, time * 0.8, "rgba(255,255,255,0.45)");
  drawOrbit(cx, cy, Math.min(width, height) * 0.31, -time * 0.45, "rgba(191,157,91,0.38)");
  drawOrbit(cx, cy, Math.min(width, height) * 0.44, time * 0.3, "rgba(102,164,161,0.32)");

  for (const star of stars) {
    const perspective = 0.58 + Math.sin(time + star.depth * 4) * 0.08;
    const x = cx + Math.cos(star.angle + time * star.depth) * star.radius * perspective;
    const y = cy + Math.sin(star.angle * 0.72 + time * star.depth * 0.7) * star.radius * 0.42;
    const alpha = 0.18 + star.depth * 0.54;
    context.beginPath();
    context.fillStyle = star.hue > 0.72 ? `rgba(190, 218, 221, ${alpha})` : `rgba(255, 244, 210, ${alpha})`;
    context.arc(x, y, star.size * star.depth, 0, Math.PI * 2);
    context.fill();
  }

  context.beginPath();
  context.fillStyle = "rgba(255, 250, 226, 0.9)";
  context.arc(cx, cy, Math.max(16, Math.min(width, height) * 0.035), 0, Math.PI * 2);
  context.fill();

  requestAnimationFrame(draw);
}

function drawOrbit(cx, cy, radius, rotation, color) {
  context.save();
  context.translate(cx, cy);
  context.rotate(rotation);
  context.scale(1, 0.36);
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = 1.2;
  context.ellipse(0, 0, radius, radius, 0, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function startFallbackScene() {
  fallbackActive = true;
  window.addEventListener("resize", resize);
  resize();
  draw();
}

async function startThreeScene() {
  const THREE = await import("https://unpkg.com/three@0.165.0/build/three.module.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  const group = new THREE.Group();
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 900;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = 2.2 + Math.random() * 7.2;
    const angle = Math.random() * Math.PI * 2;
    const heightOffset = (Math.random() - 0.5) * 3.6;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = heightOffset;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(group);
  scene.add(new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0xfff2c5, size: 0.026, transparent: true, opacity: 0.78 })
  ));

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xf0cf87, wireframe: true, transparent: true, opacity: 0.42 });
  const tealMaterial = new THREE.MeshBasicMaterial({ color: 0x74bbb5, wireframe: true, transparent: true, opacity: 0.26 });
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xfff4cf });

  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.012, 10, 120), ringMaterial);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.01, 10, 140), tealMaterial);
  const ringC = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.008, 10, 160), ringMaterial);
  ringA.rotation.x = Math.PI * 0.58;
  ringB.rotation.x = Math.PI * 0.44;
  ringB.rotation.y = Math.PI * 0.16;
  ringC.rotation.x = Math.PI * 0.7;
  ringC.rotation.y = -Math.PI * 0.12;
  group.add(ringA, ringB, ringC, new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 32), coreMaterial));

  camera.position.set(0, 0.6, 8.2);

  function resizeThree() {
    const rect = canvas.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(1, rect.height);
    camera.updateProjectionMatrix();
  }

  function animateThree() {
    group.rotation.y += 0.0035;
    ringA.rotation.z += 0.008;
    ringB.rotation.z -= 0.004;
    ringC.rotation.z += 0.0025;
    renderer.render(scene, camera);
    requestAnimationFrame(animateThree);
  }

  window.addEventListener("resize", resizeThree);
  resizeThree();
  animateThree();
}

setupHomeProfile().catch(() => {});
startThreeScene().catch(startFallbackScene);
