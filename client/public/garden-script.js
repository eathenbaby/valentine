/**
 * STCP BLOOMS - COMPREHENSIVE JAVASCRIPT
 * Digital Flower Garden Website
 * Version: 1.0.0
 */

'use strict';

// Configuration
const CONFIG = {
  animation: {
    scrollParallaxSpeed: 0.05,
    flowerHoverScale: 1.08,
    flowerHoverRotation: 2,
    individualFlowerHoverScale: 1.15,
    individualFlowerHoverRotation: 3,
    transitionDuration: 600,
    staggerDelay: 100
  },
  performance: {
    scrollThrottle: 16,
    resizeDebounce: 250,
    intersectionThreshold: 0.1,
    lazyLoadMargin: '50px'
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    focusVisible: true
  },
  features: {
    parallaxScroll: true,
    flowerAnimations: true,
    swayAnimation: true,
    interactionEffects: true,
    keyboardNavigation: true
  }
};

// Utility Functions
const Utils = {
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },
  
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  getViewportWidth() {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  },
  
  clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }
};

// DOM Manager
const DOMManager = {
  cache: {},
  
  init() {
    this.cache = {
      body: document.body,
      mainContainer: document.querySelector('.main-container'),
      header: document.querySelector('.site-header'),
      brand: document.querySelector('.brand'),
      gardenGrid: document.querySelector('.garden-grid'),
      bouquetCards: document.querySelectorAll('.bouquet-card'),
      flowers: document.querySelectorAll('.flower'),
      leaves: document.querySelectorAll('.sway-leaf'),
      dates: document.querySelectorAll('.date'),
      footer: document.querySelector('.site-footer')
    };
    console.log('DOM cache initialized:', Object.keys(this.cache).length, 'elements');
  }
};

// Animation Controller
const AnimationController = {
  animateFlowerHover(flower, isHovering) {
    if (CONFIG.accessibility.reducedMotion) return;
    
    const flowerType = flower.dataset.type;
    const scale = isHovering ? CONFIG.animation.individualFlowerHoverScale : 1;
    const rotation = isHovering ? CONFIG.animation.individualFlowerHoverRotation : 0;
    const rotationDirection = ['rose', 'carnation', 'poppy'].includes(flowerType) ? -1 : 1;
    const finalRotation = rotation * rotationDirection;
    
    flower.style.transform = `scale(${scale}) rotate(${finalRotation}deg)`;
    flower.style.zIndex = isHovering ? '10' : '1';
  },
  
  animateCardHover(card, isHovering) {
    if (CONFIG.accessibility.reducedMotion) return;
    
    const flowers = card.querySelectorAll('.flower:not(.leaf)');
    flowers.forEach((flower, index) => {
      setTimeout(() => {
        const scale = isHovering ? CONFIG.animation.flowerHoverScale : 1;
        const rotation = isHovering ? CONFIG.animation.flowerHoverRotation : 0;
        if (!flower.matches(':hover')) {
          flower.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
        }
      }, index * 30);
    });
  },
  
  pulse(element, duration = 1000) {
    element.style.animation = `pulse ${duration}ms ease-in-out`;
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  }
};

// Scroll Effects
const ScrollEffects = {
  scrollY: 0,
  ticking: false,
  
  init() {
    if (!CONFIG.features.parallaxScroll) return;
    
    window.addEventListener('scroll', () => {
      this.scrollY = window.pageYOffset || document.documentElement.scrollTop;
      this.requestTick();
    }, { passive: true });
    
    console.log('Scroll effects initialized');
  },
  
  requestTick() {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
      this.ticking = true;
    }
  },
  
  update() {
    if (CONFIG.accessibility.reducedMotion) return;
    this.applyParallax();
    this.updateHeader();
  },
  
  applyParallax() {
    const cards = DOMManager.cache.bouquetCards;
    cards.forEach((card, index) => {
      const speed = CONFIG.animation.scrollParallaxSpeed + (index % 3) * CONFIG.animation.scrollParallaxSpeed;
      const yPos = this.scrollY * speed;
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
        card.style.transform = `translateY(${yPos}px)`;
      }
    });
  },
  
  updateHeader() {
    const header = DOMManager.cache.header;
    if (!header) return;
    
    if (this.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
};

// Flower Interactions
const FlowerInteractions = {
  init() {
    this.setupFlowerHovers();
    this.setupCardHovers();
    this.setupFlowerClicks();
    this.setupKeyboardNavigation();
    console.log('Flower interactions initialized');
  },
  
  setupFlowerHovers() {
    const flowers = DOMManager.cache.flowers;
    flowers.forEach(flower => {
      flower.addEventListener('mouseenter', () => {
        AnimationController.animateFlowerHover(flower, true);
      });
      flower.addEventListener('mouseleave', () => {
        AnimationController.animateFlowerHover(flower, false);
      });
    });
  },
  
  setupCardHovers() {
    const cards = DOMManager.cache.bouquetCards;
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        AnimationController.animateCardHover(card, true);
      });
      card.addEventListener('mouseleave', () => {
        AnimationController.animateCardHover(card, false);
      });
    });
  },
  
  setupFlowerClicks() {
    const flowers = DOMManager.cache.flowers;
    flowers.forEach(flower => {
      flower.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onFlowerClick(flower);
      });
    });
  },
  
  onFlowerClick(flower) {
    const flowerType = flower.dataset.type;
    console.log(`Flower clicked: ${flowerType}`);
    AnimationController.pulse(flower);
  },
  
  setupKeyboardNavigation() {
    if (!CONFIG.features.keyboardNavigation) return;
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
};

// Performance Optimizer
const PerformanceOptimizer = {
  init() {
    this.setupIntersectionObserver();
    this.setupResizeHandler();
    console.log('Performance optimizations initialized');
  },
  
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported');
      return;
    }
    
    const options = {
      root: null,
      rootMargin: CONFIG.performance.lazyLoadMargin,
      threshold: CONFIG.performance.intersectionThreshold
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          entry.target.classList.add('loaded');
        }
      });
    }, options);
    
    const cards = DOMManager.cache.bouquetCards;
    cards.forEach(card => observer.observe(card));
  },
  
  setupResizeHandler() {
    const handleResize = Utils.debounce(() => {
      console.log('Viewport resized');
    }, CONFIG.performance.resizeDebounce);
    
    window.addEventListener('resize', handleResize, { passive: true });
  }
};

// Accessibility Manager
const AccessibilityManager = {
  init() {
    this.checkUserPreferences();
    this.setupARIA();
    console.log('Accessibility features initialized');
  },
  
  checkUserPreferences() {
    CONFIG.accessibility.reducedMotion = Utils.prefersReducedMotion();
    if (CONFIG.accessibility.reducedMotion) {
      document.body.classList.add('reduced-motion');
      console.log('Reduced motion enabled');
    }
    
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      CONFIG.accessibility.reducedMotion = e.matches;
      document.body.classList.toggle('reduced-motion', e.matches);
    });
  },
  
  setupARIA() {
    const flowers = DOMManager.cache.flowers;
    flowers.forEach(flower => {
      const type = flower.dataset.type;
      if (!flower.getAttribute('aria-label')) {
        flower.setAttribute('aria-label', `${type} flower illustration`);
        flower.setAttribute('role', 'img');
      }
      if (!flower.getAttribute('tabindex')) {
        flower.setAttribute('tabindex', '0');
      }
    });
  }
};

// Main Application
const App = {
  init() {
    console.log('🌸 Initializing STCP Blooms...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  },
  
  start() {
    try {
      DOMManager.init();
      AccessibilityManager.init();
      PerformanceOptimizer.init();
      ScrollEffects.init();
      FlowerInteractions.init();
      
      this.setInitialState();
      
      console.log('✓ STCP Blooms initialized successfully');
    } catch (error) {
      console.error('Error initializing application:', error);
    }
  },
  
  setInitialState() {
    document.body.classList.add('loaded');
    console.log('Initial state set');
  }
};

// Initialize Application
App.init();
