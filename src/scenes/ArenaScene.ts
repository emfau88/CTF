import Phaser from "phaser";
import { T, TEAM } from "../config";
import { LEVEL } from "../level";
import type { InputVector, Rect } from "../math";
import { Player } from "../player";
import { AutoAttack, Bot, CollisionSystem, FlagSystem, Projectile } from "../systems";

type Trail = { x: number; y: number; life: number; max: number; air: boolean; speed: number };

export class ArenaScene extends Phaser.Scene {
  player!: Player;
  bots: Bot[] = [];
  projectiles: Projectile[] = [];
  collision = new CollisionSystem();
  flags = new FlagSystem();
  auto!: AutoAttack;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  jumpKey!: Phaser.Input.Keyboard.Key;
  joy = { active: false, id: -1, ox: 110, oy: 500, x: 0, y: 0, len: 0 };
  jumpBtn = { id: -1, x: 0, y: 0, r: 52, held: false, pressed: false };
  gfx!: Phaser.GameObjects.Graphics;
  trailGfx!: Phaser.GameObjects.Graphics;
  uiGfx!: Phaser.GameObjects.Graphics;
  playerBody!: Phaser.GameObjects.Arc;
  playerRing!: Phaser.GameObjects.Arc;
  shadow!: Phaser.GameObjects.Ellipse;
  botViews = new Map<Bot, Phaser.GameObjects.Arc>();
  projectileViews = new Map<Projectile, Phaser.GameObjects.Arc>();
  trail: Trail[] = [];
  trailTimer = 0;
  lastState = "alive";

  create() {
    this.player = new Player(LEVEL.redSpawn.x, LEVEL.redSpawn.y, "red");
    this.bots = [new Bot(1270, 300, "blue"), new Bot(1270, 520, "blue")];
    this.auto = new AutoAttack(this.player, this.projectiles);

    this.drawArena();
    this.trailGfx = this.add.graphics().setDepth(15);
    this.gfx = this.add.graphics().setDepth(40);
    this.uiGfx = this.add.graphics().setScrollFactor(0).setDepth(1000);
    this.shadow = this.add.ellipse(this.player.x, this.player.y + 8, 34, 14, 0x000000, .2).setDepth(20);
    this.playerBody = this.add.circle(this.player.x, this.player.y, this.player.radius, TEAM.red.color).setDepth(35);
    this.playerRing = this.add.circle(this.player.x, this.player.y, this.player.radius + 4).setStrokeStyle(3, 0xffffff).setDepth(36);
    for (const b of this.bots) this.botViews.set(b, this.add.circle(b.x, b.y, b.radius, TEAM.blue.color).setStrokeStyle(3, 0xffffff).setDepth(32));

    if (!this.input.keyboard) throw new Error("keyboard unavailable");
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.addCapture(["SPACE", "UP", "DOWN", "LEFT", "RIGHT", "W", "A", "S", "D"]);
    this.input.addPointer(2);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.pointerDown(p));
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.pointerMove(p));
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => this.pointerUp(p));
    this.scale.on("resize", () => this.layoutTouch());
    this.layoutTouch();

    this.cameras.main.setBounds(0, 0, T.worldWidth, T.worldHeight);
    this.cameras.main.startFollow(this.playerBody, true, .12, .12);
  }

  update(_t: number, delta: number) {
    const ms = Math.min(delta, 34), dt = ms / 1000;
    const input = this.inputVector();
    if (input.length > .05) this.player.lastMoveDir = { x: input.x, y: input.y };
    if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || this.jumpBtn.pressed) this.player.jump.start();
    this.jumpBtn.pressed = false;
    if (!this.jumpKey.isDown && !this.jumpBtn.held) this.player.jump.release();

    this.player.prevX = this.player.x; this.player.prevY = this.player.y;
    if (this.player.state === "alive") {
      this.player.jump.update(ms);
      this.player.movement.update(dt, input);
      this.player.x += this.player.vx * dt * T.jumpDistanceInfluence;
      this.player.y += this.player.vy * dt * T.jumpDistanceInfluence;
      this.collision.update(this.player, ms);
    } else {
      this.player.stateTimer -= ms;
      if (this.player.stateTimer <= 0) this.player.respawn(this.player.state === "falling" ? this.player.lastSafe : LEVEL.redSpawn);
    }
    if (this.lastState === "alive" && this.player.state !== "alive") this.flags.failed(this.player);
    this.lastState = this.player.state;

    const blockers: Rect[] = [...LEVEL.walls, ...LEVEL.gaps];
    for (const b of this.bots) b.update(dt, ms, blockers);
    this.auto.update(ms, this.bots);
    for (const p of this.projectiles) p.update(dt, ms, [...this.bots, this.player]);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.flags.update(this.player);
    this.updateTrail(ms);
    this.render();
  }

  inputVector(): InputVector {
    let x = this.joy.x, y = this.joy.y, l = this.joy.len;
    if (this.cursors.left.isDown || this.wasd.left.isDown) x = -1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) x = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) y = -1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) y = 1;
    const d = Math.hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    if (d > 0 && l === 0) l = 1;
    return { x, y, length: Math.min(1, Math.max(l, d > 0 ? 1 : 0)) };
  }

  render() {
    this.renderTrail();
    this.gfx.clear();
    this.renderFlags();
    this.renderPlayer();
    for (const b of this.bots) this.botViews.get(b)?.setPosition(b.x, b.y).setVisible(b.alive);
    for (const p of this.projectiles) {
      if (!this.projectileViews.has(p)) this.projectileViews.set(p, this.add.circle(p.x, p.y, T.projectileRadius, 0x21302e).setDepth(50));
      this.projectileViews.get(p)?.setPosition(p.x, p.y);
    }
    for (const [p, v] of this.projectileViews) if (p.dead) { v.destroy(); this.projectileViews.delete(p); }
    this.drawTouch();
    this.updateHud();
  }

  renderPlayer() {
    const h = this.player.jump.height, s = Math.min(1, this.player.speed() / T.maxSpeed), scale = 1 + h / 210;
    this.shadow.setPosition(this.player.x, this.player.y + 8).setScale(1 + h / 160, Math.max(.35, 1 - h / 95)).setAlpha(this.player.state === "alive" ? Math.max(.1, .22 - h / 330) : 0);
    const color = this.player.carriedFlag ? TEAM.blue.color : Phaser.Display.Color.GetColor(Phaser.Math.Linear(228, 120, s), Phaser.Math.Linear(81, 38, s), Phaser.Math.Linear(81, 38, s));
    this.playerBody.setPosition(this.player.x, this.player.y - h).setRadius(this.player.radius * scale).setFillStyle(this.player.state === "falling" ? 0x333333 : color, this.player.state === "alive" ? 1 : .35).setVisible(this.player.state !== "dead");
    this.playerRing.setPosition(this.player.x, this.player.y - h).setRadius(this.player.radius * scale + 4).setStrokeStyle(3, this.player.jump.active ? 0xffd86b : 0xffffff, .95).setVisible(this.player.state !== "dead");
  }

  renderFlags() {
    for (const f of Object.values(this.flags.flags)) {
      const c = f.team === "red" ? TEAM.red.dark : TEAM.blue.dark;
      this.gfx.lineStyle(4, 0x243633, .9).beginPath().moveTo(f.x, f.y + 16).lineTo(f.x, f.y - 28).strokePath();
      this.gfx.fillStyle(c, .95).fillTriangle(f.x + 2, f.y - 28, f.x + 34, f.y - 18, f.x + 2, f.y - 8);
      this.gfx.fillStyle(0xffffff, .9).fillCircle(f.x, f.y + 17, 6);
    }
  }

  updateTrail(ms: number) {
    this.trailTimer -= ms;
    const s = Math.min(1, this.player.speed() / T.maxSpeed);
    if (this.player.state === "alive" && this.trailTimer <= 0 && this.player.speed() > 48) {
      this.trailTimer = Math.max(7, T.trailIntervalMs - s * 8);
      this.trail.push({ x: this.player.x, y: this.player.y, life: T.trailLifeMs, max: T.trailLifeMs, air: this.player.jump.active, speed: s });
      if (this.trail.length > T.trailMax) this.trail.shift();
    }
    this.trail.forEach(t => t.life -= ms);
    this.trail = this.trail.filter(t => t.life > 0);
  }

  renderTrail() {
    this.trailGfx.clear();
    for (const t of this.trail) {
      const a = t.life / t.max;
      this.trailGfx.fillStyle(t.air ? 0x5eb5dc : 0x234f49, a * (t.air ? .34 : .22)).fillCircle(t.x, t.y, (5 + t.speed * 9) * a);
    }
  }

  drawArena() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0xedf5ee).fillRect(0, 0, T.worldWidth, T.worldHeight);
    g.lineStyle(1, 0xcadbd4, .38);
    for (let x = 0; x <= T.worldWidth; x += 50) g.beginPath().moveTo(x, 0).lineTo(x, T.worldHeight).strokePath();
    for (let y = 0; y <= T.worldHeight; y += 50) g.beginPath().moveTo(0, y).lineTo(T.worldWidth, y).strokePath();
    this.zone(g, LEVEL.redBase, TEAM.red.base, TEAM.red.dark); this.zone(g, LEVEL.blueBase, TEAM.blue.base, TEAM.blue.dark);
    g.lineStyle(3, 0x9dafaa, .45).beginPath().moveTo(T.worldWidth / 2, 40).lineTo(T.worldWidth / 2, T.worldHeight - 40).strokePath();
    for (const gap of LEVEL.gaps) this.gap(g, gap);
    for (const wall of LEVEL.walls) this.wall(g, wall);
  }
  zone(g: Phaser.GameObjects.Graphics, r: Rect, fill: number, stroke: number) { g.fillStyle(fill, .9).fillRoundedRect(r.x, r.y, r.w, r.h, 8).lineStyle(3, stroke, .45).strokeRoundedRect(r.x, r.y, r.w, r.h, 8); }
  gap(g: Phaser.GameObjects.Graphics, r: Rect) { g.fillStyle(0x263534, .94).fillRoundedRect(r.x, r.y, r.w, r.h, 8).lineStyle(3, 0x5eb5dc, .45).strokeRoundedRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6, 7); }
  wall(g: Phaser.GameObjects.Graphics, r: Rect) { g.fillStyle(0xb9c8be).fillRoundedRect(r.x, r.y, r.w, r.h, 6).lineStyle(2, 0x7f9189, .9).strokeRoundedRect(r.x, r.y, r.w, r.h, 6); }

  layoutTouch() { this.joy.ox = Math.max(96, this.scale.width * .12); this.joy.oy = this.scale.height - 96; this.jumpBtn.x = this.scale.width - Math.max(84, this.scale.width * .09); this.jumpBtn.y = this.scale.height - 94; }
  pointerDown(p: Phaser.Input.Pointer) {
    if (Phaser.Math.Distance.Between(p.x, p.y, this.jumpBtn.x, this.jumpBtn.y) <= this.jumpBtn.r + 24 && this.jumpBtn.id < 0) { this.jumpBtn.id = p.id; this.jumpBtn.held = true; this.jumpBtn.pressed = true; return; }
    if (p.x < this.scale.width * .58 && this.joy.id < 0) { this.joy.id = p.id; this.joy.active = true; this.joy.ox = p.x; this.joy.oy = p.y; this.pointerMove(p); }
  }
  pointerMove(p: Phaser.Input.Pointer) {
    if (p.id !== this.joy.id) return;
    const dx = p.x - this.joy.ox, dy = p.y - this.joy.oy, d = Math.hypot(dx, dy), r = 62;
    this.joy.x = d ? dx / d : 0; this.joy.y = d ? dy / d : 0; this.joy.len = Math.min(1, d / r);
  }
  pointerUp(p: Phaser.Input.Pointer) {
    if (p.id === this.joy.id) { this.joy.id = -1; this.joy.x = 0; this.joy.y = 0; this.joy.len = 0; this.layoutTouch(); }
    if (p.id === this.jumpBtn.id) { this.jumpBtn.id = -1; this.jumpBtn.held = false; }
  }
  drawTouch() {
    this.uiGfx.clear().fillStyle(0xffffff, .38).lineStyle(2, 0x17302d, .18).fillCircle(this.joy.ox, this.joy.oy, 62).strokeCircle(this.joy.ox, this.joy.oy, 62);
    this.uiGfx.fillStyle(0x17302d, .42).fillCircle(this.joy.ox + this.joy.x * this.joy.len * 48, this.joy.oy + this.joy.y * this.joy.len * 48, 22);
    this.uiGfx.fillStyle(this.jumpBtn.held ? 0xffd86b : 0xffffff, this.jumpBtn.held ? .84 : .52).lineStyle(3, this.jumpBtn.held ? 0xb77516 : 0x17302d, .28).fillCircle(this.jumpBtn.x, this.jumpBtn.y, this.jumpBtn.r).strokeCircle(this.jumpBtn.x, this.jumpBtn.y, this.jumpBtn.r);
  }
  updateHud() {
    document.querySelector("#red-score")!.textContent = String(this.flags.redScore);
    document.querySelector("#blue-score")!.textContent = String(this.flags.blueScore);
    document.querySelector("#flag-state")!.textContent = this.flags.text(this.player);
    document.querySelector("#speed")!.textContent = this.player.speed().toFixed(0);
    document.querySelector("#jump")!.textContent = this.player.jump.state();
    document.querySelector("#capture")!.textContent = this.flags.capture(this.player);
    document.querySelector("#debug")!.textContent = `speed: ${this.player.speed().toFixed(1)}
velocity: ${this.player.vx.toFixed(1)}, ${this.player.vy.toFixed(1)}
state: ${this.player.state}
jump height: ${this.player.jump.height.toFixed(1)}
jump charge: ${Math.round(this.player.jump.charge() * 100)}%
friction: ${this.player.movement.currentFriction.toFixed(2)}
carried flag: ${this.player.carriedFlag ?? "none"}
over gap: ${this.player.overGap ? "yes" : "no"}
last safe: ${this.player.lastSafe.x.toFixed(0)}, ${this.player.lastSafe.y.toFixed(0)}`;
  }
}
