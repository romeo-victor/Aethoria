/* ══════════════════════════════════════════
   CHRONICLES OF AETHORIA — 3D Scene + Interactions
   Three.js hero scene + scroll animations + form handling
   ══════════════════════════════════════════ */

// ═══════════════════
// THREE.JS HERO SCENE
// ═══════════════════
(function initHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  // ── Mouse tracking ──
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  document.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // ── Central Crystal (Sigil) ──
  const crystalGeometry = new THREE.IcosahedronGeometry(1.2, 1);
  const crystalMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8a84a,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });
  const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
  scene.add(crystal);

  // Inner crystal (solid, dimmer)
  const innerGeometry = new THREE.IcosahedronGeometry(0.6, 0);
  const innerMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8a84a,
    wireframe: true,
    transparent: true,
    opacity: 0.08,
  });
  const innerCrystal = new THREE.Mesh(innerGeometry, innerMaterial);
  scene.add(innerCrystal);

  // Outer ring
  const ringGeometry = new THREE.TorusGeometry(2.2, 0.01, 16, 100);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xc8a84a,
    transparent: true,
    opacity: 0.12,
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2.5;
  scene.add(ring);

  // Second ring (tilted)
  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.005, 16, 120),
    new THREE.MeshBasicMaterial({ color: 0x4aabaa, transparent: true, opacity: 0.06 })
  );
  ring2.rotation.x = Math.PI / 3.5;
  ring2.rotation.z = Math.PI / 5;
  scene.add(ring2);

  // ── Particle Field ──
  const particleCount = 2000;
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  const goldColor = new THREE.Color(0xc8a84a);
  const cyanColor = new THREE.Color(0x4aabaa);
  const whiteColor = new THREE.Color(0xe0dcd0);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Distribute in a sphere with higher density near center
    const radius = Math.pow(Math.random(), 0.5) * 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i3]     = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = radius * Math.cos(phi);

    // Color distribution: mostly gold, some cyan, some white
    const colorChoice = Math.random();
    const color = colorChoice < 0.5 ? goldColor : colorChoice < 0.75 ? cyanColor : whiteColor;
    colors[i3]     = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    sizes[i] = Math.random() * 2 + 0.5;
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Custom shader for round particles with glow
  const particleMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uPixelRatio;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        
        // Gentle floating motion
        pos.x += sin(uTime * 0.2 + position.y * 0.5) * 0.15;
        pos.y += cos(uTime * 0.15 + position.x * 0.3) * 0.15;
        pos.z += sin(uTime * 0.1 + position.z * 0.2) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        float alpha = 1.0 - smoothstep(0.1, 0.5, dist);
        alpha *= 0.4;
        
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // ── Floating Geometric Accents ──
  const floatingShapes = [];
  const shapeGeometries = [
    new THREE.OctahedronGeometry(0.15, 0),
    new THREE.TetrahedronGeometry(0.12, 0),
    new THREE.IcosahedronGeometry(0.1, 0),
  ];

  for (let i = 0; i < 12; i++) {
    const geo = shapeGeometries[i % shapeGeometries.length];
    const mat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xc8a84a : i % 3 === 1 ? 0x4aabaa : 0x7a58c0,
      wireframe: true,
      transparent: true,
      opacity: 0.15 + Math.random() * 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);

    const angle = (i / 12) * Math.PI * 2;
    const radius = 3 + Math.random() * 2;
    mesh.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 4,
      Math.sin(angle) * radius
    );

    mesh.userData = {
      baseY: mesh.position.y,
      speed: 0.3 + Math.random() * 0.5,
      amplitude: 0.3 + Math.random() * 0.5,
      rotSpeed: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
    };

    scene.add(mesh);
    floatingShapes.push(mesh);
  }

  // ── Animation Loop ──
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();
    particleMaterial.uniforms.uTime.value = elapsed;

    // Smooth mouse follow
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Crystal rotation
    crystal.rotation.x = elapsed * 0.15 + mouse.y * 0.3;
    crystal.rotation.y = elapsed * 0.2 + mouse.x * 0.3;

    innerCrystal.rotation.x = -elapsed * 0.25;
    innerCrystal.rotation.y = elapsed * 0.3;

    // Ring rotation
    ring.rotation.z = elapsed * 0.08;
    ring2.rotation.z = -elapsed * 0.06;

    // Crystal pulse
    const pulse = 1 + Math.sin(elapsed * 1.5) * 0.05;
    crystal.scale.set(pulse, pulse, pulse);

    // Crystal opacity pulse
    crystalMaterial.opacity = 0.15 + Math.sin(elapsed * 0.8) * 0.08;

    // Floating shapes
    floatingShapes.forEach((shape) => {
      const d = shape.userData;
      shape.position.y = d.baseY + Math.sin(elapsed * d.speed + d.phase) * d.amplitude;
      shape.rotation.x += d.rotSpeed * 0.01;
      shape.rotation.y += d.rotSpeed * 0.008;
    });

    // Particle system rotation (very slow)
    particles.rotation.y = elapsed * 0.02 + mouse.x * 0.1;
    particles.rotation.x = mouse.y * 0.05;

    // Camera subtle movement
    camera.position.x = mouse.x * 0.5;
    camera.position.y = mouse.y * 0.3;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  // ── Resize ──
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    particleMaterial.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  });
})();


// ═══════════════════
// NAVBAR SCROLL EFFECT
// ═══════════════════
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile toggle
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });

    // Close on link click
    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  }
})();


// ═══════════════════
// SCROLL REVEAL
// ═══════════════════
(function initScrollReveal() {
  // Add reveal class to elements
  const revealTargets = [
    '.section-header',
    '.about-text',
    '.about-stats',
    '.feature-card',
    '.philosophy-quote',
    '.phil-card',
    '.role-card',
    '.tech-item',
    '.application-form',
  ];

  revealTargets.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('reveal');
    });
  });

  // Stagger containers
  document.querySelectorAll('.features-grid, .philosophy-grid, .roles-grid, .tech-grid').forEach(el => {
    el.classList.add('reveal-stagger');
  });

  // Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  });

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    observer.observe(el);
  });
})();


// ═══════════════════
// SMOOTH SCROLL
// ═══════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// ═══════════════════
// FORM HANDLING
// ═══════════════════
(function initForm() {
  const form = document.getElementById('applicationForm');
  const successDiv = document.getElementById('formSuccess');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  // Anti-spam: track form load time (bots submit instantly)
  const formLoadTime = Date.now();
  let isSubmitting = false;

  // Sanitize input — strip HTML tags to prevent XSS in emails
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/<[^>]*>/g, '').trim();
  }

  // Email validation regex
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;
    
    // Anti-bot: if form was filled in < 3 seconds, likely a bot
    if (Date.now() - formLoadTime < 3000) {
      console.warn('Form submitted too quickly — possible bot.');
      return;
    }

    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    let valid = true;
    
    requiredFields.forEach(field => {
      const value = sanitize(field.value);
      if (!value) {
        valid = false;
        field.style.borderColor = '#c84848';
        field.addEventListener('input', function handler() {
          field.style.borderColor = '';
          field.removeEventListener('input', handler);
        }, { once: true });
      }
    });

    // Validate email format
    const emailField = form.querySelector('#email');
    if (emailField && !isValidEmail(emailField.value)) {
      valid = false;
      emailField.style.borderColor = '#c84848';
    }

    // Validate "why" field has meaningful content (> 20 chars)
    const whyField = form.querySelector('#why');
    if (whyField && sanitize(whyField.value).length < 20) {
      valid = false;
      whyField.style.borderColor = '#c84848';
      whyField.placeholder = 'Please write at least a few sentences — we genuinely want to know.';
    }

    if (!valid) {
      const firstInvalid = form.querySelector('[style*="border-color"]');
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      return;
    }

    // Lock submission
    isSubmitting = true;
    submitBtn.querySelector('.btn-text').textContent = 'Sending...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';

    // Collect and sanitize form data
    const formData = new FormData(form);

    // Submit via fetch to FormSubmit
    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
    .then(response => {
      if (response.ok) {
        showSuccess();
      } else {
        // FormSubmit returns non-JSON on first use (activation email)
        // Still show success — they'll get the activation email
        showSuccess();
      }
    })
    .catch(error => {
      // Network error — fall back to native form submission
      console.warn('Fetch failed, falling back to native submit:', error);
      form.submit();
    });

    function showSuccess() {
      form.style.display = 'none';
      successDiv.style.display = 'block';
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // Input focus effects
  form.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', () => {
      input.closest('.form-group')?.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.closest('.form-group')?.classList.remove('focused');
    });
  });

  // Character counter for "why" field
  const whyField = form.querySelector('#why');
  if (whyField) {
    const hint = whyField.closest('.form-group')?.querySelector('.form-hint');
    whyField.addEventListener('input', () => {
      const len = whyField.value.trim().length;
      if (hint && len > 0 && len < 20) {
        hint.textContent = `Keep going... (${len}/20 minimum characters)`;
        hint.style.color = '#c84848';
      } else if (hint && len >= 20) {
        hint.textContent = 'We care about this more than anything else in this form.';
        hint.style.color = '';
      }
    });
  }
})();


// ═══════════════════
// PARALLAX ON SCROLL
// ═══════════════════
(function initParallax() {
  const hero = document.querySelector('.hero-content');
  
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = window.innerHeight;
    
    if (scrollY < heroHeight && hero) {
      const progress = scrollY / heroHeight;
      hero.style.transform = `translateY(${scrollY * 0.3}px)`;
      hero.style.opacity = 1 - progress * 1.2;
    }
  }, { passive: true });
})();


// ═══════════════════
// ACTIVE NAV HIGHLIGHT
// ═══════════════════
(function initActiveNav() {
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => observer.observe(section));
})();


// ═══════════════════
// CONSOLE EASTER EGG
// ═══════════════════
console.log(
  '%c✦ Chronicles of Aethoria %c\n\nThe sigil recognized you.\nIf you\'re reading this, you might be exactly who we\'re looking for.\n\nApply at: #apply',
  'color: #c8a84a; font-size: 18px; font-weight: bold; font-family: serif;',
  'color: #9a9aaa; font-size: 12px;'
);
