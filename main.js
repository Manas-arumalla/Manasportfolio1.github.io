/* ==========================================================
   ROBUST SCRIPT FOR ANIMATIONS & INTERACTION
========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Enable Custom Cursor only on Desktop
  const cursor = document.querySelector(".cursor");
  const follower = document.querySelector(".cursor-follower");

  if (window.matchMedia("(pointer: fine)").matches && cursor && follower) {
    document.body.classList.add("cursor-active");

    let posX = 0, posY = 0;
    let mouseX = 0, mouseY = 0;

    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      cursor.style.left = mouseX + "px";
      cursor.style.top = mouseY + "px";

      // Hover logic
      const target = e.target;
      if (target.matches('a, button, .bento-item, input, textarea, .skill-badge') || target.closest('a, button, .skill-badge')) {
        document.body.classList.add("hovering");
      } else {
        document.body.classList.remove("hovering");
      }
    });

    // Smooth follower
    setInterval(() => {
      posX += (mouseX - posX) / 8;
      posY += (mouseY - posY) / 8;
      follower.style.left = posX + "px";
      follower.style.top = posY + "px";
    }, 10);
  }

  // 2. Initialize Lenis (Smooth Scroll) if available
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      smooth: true,
      lerp: 0.1
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } else {
    console.warn("Lenis not loaded - standard scroll active");
  }

  // 3. GSAP Animations (Check strictly if loaded)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Animate elements that have .reveal-text
    // We use from() so that if GSAP fails, the CSS state (opacity: 1) remains valid
    const reveals = document.querySelectorAll(".reveal-text");

    reveals.forEach((el) => {
      gsap.from(el, {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none reverse"
        }
      });
    });

    // Stagger for grids
    if (document.querySelector('.bento-grid')) {
      gsap.from(".bento-item", {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".bento-grid",
          start: "top 80%"
        }
      });
    }

    // 6. Magnetic Skills Effect
    const badges = document.querySelectorAll('.skill-badge');

    badges.forEach(badge => {
      badge.addEventListener('mousemove', (e) => {
        const rect = badge.getBoundingClientRect();
        const x = e.clientX - rect.left; // x position within the element.
        const y = e.clientY - rect.top;  // y position within the element.

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const featureX = (x - centerX) * 0.4; // movement strength
        const featureY = (y - centerY) * 0.4;

        gsap.to(badge, {
          x: featureX,
          y: featureY,
          duration: 0.3,
          ease: "power2.out"
        });
      });

      badge.addEventListener('mouseleave', () => {
        gsap.to(badge, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)"
        });
      });
    });

  } else {
    console.warn("GSAP not loaded - animations disabled");
  }

  // 4. Modal Logic (Vanilla JS)
  const modalTriggers = document.querySelectorAll('[data-modal]');
  const closeButtons = document.querySelectorAll('.close-modal');

  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.getAttribute('data-modal');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
      }
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const overlay = e.target.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('open');
    });
  });

  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });

  // 5. Navbar Highlight
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    // Handle "Bottom of Page" case for Contact section
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
      current = 'contact';
    }

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
        updateNavBlob(link); // Move the blob
      }
    });
  });

  // Gooey Nav Blob Logic
  const navBlob = document.querySelector('.nav-blob');
  function updateNavBlob(activeLink) {
    if (activeLink && navBlob) {
      const left = activeLink.offsetLeft;
      const width = activeLink.offsetWidth;
      navBlob.style.left = left + 'px';
      navBlob.style.width = width + 'px';
    }
  }

  // Init blob on load
  const initialActive = document.querySelector('.nav-link.active');
  if (initialActive) updateNavBlob(initialActive);

  // Hover effect for blob
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      updateNavBlob(link);
    });
  });

  // Return to active on leave (optional, or stick to last hovered)
  document.querySelector('.nav-links').addEventListener('mouseleave', () => {
    const active = document.querySelector('.nav-link.active');
    if (active) updateNavBlob(active);
  });

  // 7. Particle Network Background (Connecting Dots)
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuration
    // Increased density per user request
    const particleCount = window.innerWidth < 768 ? 100 : 250;
    const connectionDistance = 140; // Slightly tighter connections for cleaner web
    const moveSpeed = 0.5;

    // Mouse State
    let mouse = { x: null, y: null, radius: 200 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    // Clear mouse on leave
    window.addEventListener('mouseout', () => {
      mouse.x = null;
      mouse.y = null;
    });

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * moveSpeed;
        this.vy = (Math.random() - 0.5) * moveSpeed;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? 'rgba(0, 243, 255,' : 'rgba(188, 19, 254,'; // Cyan or Purple
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse Interaction (Repel)
        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * 3; // Push strength
            const directionY = forceDirectionY * force * 3;

            this.x -= directionX;
            this.y -= directionY;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + ' 0.7)';
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = 1 - (dist / connectionDistance);
            ctx.strokeStyle = `rgba(0, 243, 255, ${opacity * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }

        // Connect to Mouse
        if (mouse.x != null) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200) {
            const opacity = 1 - (dist / 200);
            ctx.strokeStyle = `rgba(188, 19, 254, ${opacity * 0.5})`; // Purple connection to mouse
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animateParticles);
    }

    resize();
    initParticles();
    animateParticles();

    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });
  }

  // 8. 3D Tilt Effect (Vanilla JS)
  const tiltElements = document.querySelectorAll('.bento-item, .skill-badge, .btn-glow');

  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      gsap.to(el, {
        rotationX: rotateX,
        rotationY: rotateY,
        transformPerspective: 1000,
        ease: "power1.out",
        duration: 0.4
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        ease: "elastic.out(1, 0.5)",
        duration: 0.8
      });
    });
  });

  // 9. Mobile Menu Logic
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mobileOverlay = document.querySelector('.mobile-nav-overlay');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileBtn && mobileOverlay) {
    mobileBtn.addEventListener('click', () => {
      mobileBtn.classList.toggle('active');
      mobileOverlay.classList.toggle('active');

      // Prevent scrolling when menu is open
      if (mobileOverlay.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Close menu when a link is clicked
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileBtn.classList.remove('active');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

});
