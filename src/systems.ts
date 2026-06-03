import Phaser from "phaser";
import { T, type TeamId } from "./config";
import { LEVEL } from "./level";
import { circleRect, len, pointInRect, resolveCircleRect, type Rect, type Vec2 } from "./math";
import { Player } from "./player";

export class CollisionSystem {
  update(p: Player, ms: number) {
    if (p.state !== "alive") return;
    p.x = Math.max(p.radius, Math.min(p.x, T.worldWidth - p.radius));
    p.y = Math.max(p.radius, Math.min(p.y, T.worldHeight - p.radius));
    if (!(p.jump.active && p.jump.height > T.jumpHeight * .5)) {
      const pos = { x: p.x, y: p.y };
      for (let pass = 0; pass < 3; pass++) {
        let hit = false;
        for (const w of LEVEL.walls) {
          const h = resolveCircleRect(pos, p.radius, w);
          if (!h) continue;
          pos.x += h.x * (h.depth + .1); pos.y += h.y * (h.depth + .1);
          const into = p.vx * h.x + p.vy * h.y;
          if (into < 0) { p.vx -= into * h.x; p.vy -= into * h.y; }
          hit = true;
        }
        if (!hit) break;
      }
      p.x = pos.x; p.y = pos.y;
    }
    p.overGap = LEVEL.gaps.some(g => circleRect(p.x, p.y, p.radius * .68, g));
    if (LEVEL.gaps.some(g => pointInRect(p.x, p.y, g)) && !p.jump.clearsGap()) p.fall();
    p.safeTimer += ms;
    if (p.safeTimer >= T.safePointInterval && p.jump.grounded() && !p.overGap) { p.safeTimer = 0; p.lastSafe = { x: p.x, y: p.y }; }
  }
}

export class FlagSystem {
  redScore = 0; blueScore = 0;
  flags: Record<TeamId, { team: TeamId; home: Vec2; x: number; y: number; carrier: Player | null }> = {
    red: { team: "red", home: LEVEL.redFlag, x: LEVEL.redFlag.x, y: LEVEL.redFlag.y, carrier: null },
    blue: { team: "blue", home: LEVEL.blueFlag, x: LEVEL.blueFlag.x, y: LEVEL.blueFlag.y, carrier: null },
  };
  update(p: Player) {
    for (const f of Object.values(this.flags)) if (f.carrier) { f.x = f.carrier.x; f.y = f.carrier.y - 24 - f.carrier.jump.height; }
    if (p.state !== "alive") return;
    const enemy: TeamId = p.team === "red" ? "blue" : "red";
    const f = this.flags[enemy];
    if (!p.carriedFlag && !f.carrier && len(p.x - f.x, p.y - f.y) < 36) { f.carrier = p; p.carriedFlag = enemy; }
    if (p.carriedFlag && pointInRect(p.x, p.y, LEVEL.redBase)) { this.redScore++; this.reset(p.carriedFlag); p.carriedFlag = null; }
  }
  failed(p: Player) { if (p.carriedFlag) { this.reset(p.carriedFlag); p.carriedFlag = null; } }
  reset(team: TeamId) { const f = this.flags[team]; f.x = f.home.x; f.y = f.home.y; f.carrier = null; }
  text(p: Player) { return p.carriedFlag ? "Enemy flag carried - return to red base" : "Enemy flag available"; }
  capture(p: Player) { return p.carriedFlag ? "Bring it home" : "Find blue flag"; }
}

export class Bot {
  radius = 15; vx = 0; vy = 0; hp = T.botMaxHp; alive = true; respawnTimer = 0; private timer = 0; private dir = { x: -1, y: 0 };
  constructor(public x: number, public y: number, public team: TeamId, private spawn = { x, y }) { this.turn(); }
  update(dt: number, ms: number, blockers: Rect[]) {
    if (!this.alive) { this.respawnTimer -= ms; if (this.respawnTimer <= 0) { this.x = this.spawn.x; this.y = this.spawn.y; this.hp = T.botMaxHp; this.alive = true; } return; }
    this.timer -= ms; if (this.timer <= 0) this.turn();
    const nx = this.x + this.dir.x * T.botSpeed * dt, ny = this.y + this.dir.y * T.botSpeed * dt;
    if (blockers.some(r => circleRect(nx, ny, this.radius, r))) { this.turn(true); return; }
    this.x = nx; this.y = ny;
  }
  damage(v: number) { if (!this.alive) return; this.hp -= v; if (this.hp <= 0) { this.alive = false; this.respawnTimer = T.respawnDelay; } }
  private turn(reverse = false) { const a = (reverse ? Math.atan2(-this.dir.y, -this.dir.x) : Math.PI) + Phaser.Math.FloatBetween(-.9, .9); this.dir = { x: Math.cos(a), y: Math.sin(a) }; this.timer = Phaser.Math.Between(850, 1700); }
}

export class Projectile {
  ttl = 1100; dead = false;
  constructor(public x: number, public y: number, public vx: number, public vy: number, public owner: Player | Bot) {}
  update(dt: number, ms: number, targets: Array<Player | Bot>) {
    this.ttl -= ms; if (this.ttl <= 0) { this.dead = true; return; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    for (const t of targets) {
      if (t === this.owner) continue;
      if (t instanceof Bot && !t.alive) continue;
      if (t instanceof Player && t.state !== "alive") continue;
      if (len(this.x - t.x, this.y - t.y) <= t.radius + T.projectileRadius) { t.damage(T.projectileDamage); this.dead = true; return; }
    }
  }
}

export class AutoAttack {
  cooldown = 0;
  constructor(private owner: Player, private projectiles: Projectile[]) {}
  update(ms: number, bots: Bot[]) {
    this.cooldown -= ms; if (this.cooldown > 0 || this.owner.state !== "alive") return;
    let best: Bot | null = null, bd = Infinity;
    for (const b of bots) { if (!b.alive) continue; const d = len(b.x - this.owner.x, b.y - this.owner.y); if (d < bd && d <= T.attackRange) { best = b; bd = d; } }
    if (!best) return;
    const dx = best.x - this.owner.x, dy = best.y - this.owner.y, d = len(dx, dy) || 1;
    this.projectiles.push(new Projectile(this.owner.x, this.owner.y - this.owner.jump.height, dx / d * T.projectileSpeed, dy / d * T.projectileSpeed, this.owner));
    this.cooldown = T.fireRate;
  }
}
