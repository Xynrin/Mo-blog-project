/**
 * particles.js - 轻量级粒子连线背景动画
 * 使用原生 Canvas API，无第三方依赖
 */

(function () {
  'use strict';

  // 主题色池
  var COLORS = ['#e8614d', '#d4a853', '#4ecdc4'];

  // 配置参数
  var CONFIG = {
    particleCount: 70,        // 粒子数量 60-80
    minRadius: 1.5,           // 最小半径
    maxRadius: 2.5,           // 最大半径
    minAlpha: 0.3,            // 最小透明度
    maxAlpha: 0.6,            // 最大透明度
    linkDistance: 120,         // 连线最大距离
    mouseRadius: 150,         // 鼠标影响半径
    mouseAttraction: 0.02,    // 鼠标吸引力系数
    maxSpeed: 0.4,            // 粒子最大速度
    minSpeed: 0.1             // 粒子最小速度
  };

  /**
   * Particle - 单个粒子
   * @param {HTMLCanvasElement} canvas
   */
  function Particle(canvas) {
    this.canvas = canvas;
    this.init();
  }

  Particle.prototype.init = function () {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.radius = CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
    this.alpha = CONFIG.minAlpha + Math.random() * (CONFIG.maxAlpha - CONFIG.minAlpha);
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];

    var angle = Math.random() * Math.PI * 2;
    var speed = CONFIG.minSpeed + Math.random() * (CONFIG.maxSpeed - CONFIG.minSpeed);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  };

  /**
   * 更新粒子位置，处理边界反弹
   */
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;

    // 边界反弹
    if (this.x < 0 || this.x > this.canvas.width) {
      this.vx *= -1;
      this.x = Math.max(0, Math.min(this.canvas.width, this.x));
    }
    if (this.y < 0 || this.y > this.canvas.height) {
      this.vy *= -1;
      this.y = Math.max(0, Math.min(this.canvas.height, this.y));
    }
  };

  /**
   * 绘制粒子
   * @param {CanvasRenderingContext2D} ctx
   */
  Particle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  /**
   * ParticleNetwork - 粒子网络管理器
   * @param {string} canvasId
   */
  function ParticleNetwork(canvasId) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animationId = null;
    this.init();
  }

  /**
   * 初始化画布和粒子
   */
  ParticleNetwork.prototype.init = function () {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) {
      console.warn('[particles] Canvas element #' + this.canvasId + ' not found.');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    // 创建粒子
    for (var i = 0; i < CONFIG.particleCount; i++) {
      this.particles.push(new Particle(this.canvas));
    }

    // 绑定事件
    this._onMouseMove = this.handleMouse.bind(this);
    this._onMouseLeave = this.handleMouseLeave.bind(this);
    this._onResize = this.resize.bind(this);

    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('mouseleave', this._onMouseLeave);
    window.addEventListener('resize', this._onResize);

    // 启动动画
    this.animate();
  };

  /**
   * 主动画循环
   */
  ParticleNetwork.prototype.animate = function () {
    var self = this;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    var particles = this.particles;
    var len = particles.length;

    // 更新与绘制粒子
    for (var i = 0; i < len; i++) {
      var p = particles[i];

      // 鼠标吸引力
      if (this.mouse.x !== null && this.mouse.y !== null) {
        var dx = this.mouse.x - p.x;
        var dy = this.mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius && dist > 0) {
          p.vx += (dx / dist) * CONFIG.mouseAttraction;
          p.vy += (dy / dist) * CONFIG.mouseAttraction;
        }
      }

      // 限制速度
      var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > CONFIG.maxSpeed) {
        p.vx = (p.vx / speed) * CONFIG.maxSpeed;
        p.vy = (p.vy / speed) * CONFIG.maxSpeed;
      }

      p.update();
      p.draw(this.ctx);
    }

    // 绘制连线
    this.drawLinks();

    this.animationId = requestAnimationFrame(function () {
      self.animate();
    });
  };

  /**
   * 绘制粒子间连线，透明度随距离衰减
   */
  ParticleNetwork.prototype.drawLinks = function () {
    var particles = this.particles;
    var len = particles.length;
    var linkDist = CONFIG.linkDistance;
    var ctx = this.ctx;

    for (var i = 0; i < len; i++) {
      for (var j = i + 1; j < len; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < linkDist) {
          // 透明度随距离衰减：距离越近越清晰
          var alpha = 1 - dist / linkDist;

          // 鼠标附近的连线更密集（提升透明度）
          if (this.mouse.x !== null && this.mouse.y !== null) {
            var mx = (particles[i].x + particles[j].x) / 2;
            var my = (particles[i].y + particles[j].y) / 2;
            var mouseDist = Math.sqrt(
              (mx - this.mouse.x) * (mx - this.mouse.x) +
              (my - this.mouse.y) * (my - this.mouse.y)
            );
            if (mouseDist < CONFIG.mouseRadius) {
              alpha += (1 - mouseDist / CONFIG.mouseRadius) * 0.3;
            }
          }

          alpha = Math.min(alpha, 0.8);

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  };

  /**
   * 处理鼠标移动
   * @param {MouseEvent} e
   */
  ParticleNetwork.prototype.handleMouse = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
  };

  /**
   * 鼠标离开画布
   */
  ParticleNetwork.prototype.handleMouseLeave = function () {
    this.mouse.x = null;
    this.mouse.y = null;
  };

  /**
   * 窗口 resize 自适应
   */
  ParticleNetwork.prototype.resize = function () {
    this.canvas.width = this.canvas.parentElement
      ? this.canvas.parentElement.clientWidth
      : window.innerWidth;
    this.canvas.height = this.canvas.parentElement
      ? this.canvas.parentElement.clientHeight
      : window.innerHeight;
  };

  /**
   * 初始化粒子动画
   * @param {string} [canvasId] - 画布元素 ID，默认 'particles-canvas'
   */
  function initParticles(canvasId) {
    new ParticleNetwork(canvasId || 'particles-canvas');
  }

  // 导出到 window
  window.initParticles = initParticles;

  // DOMContentLoaded 时自动初始化
  document.addEventListener('DOMContentLoaded', initParticles);
})();
