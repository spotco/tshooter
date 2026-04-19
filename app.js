var Random = (function () {
    function Random() { }
    Random.rand = function rand(min, max) {
        return Math.random() * (max - min) + min;
    }
    return Random;
})();
var Util = (function () {
    function Util() { }
    Util.deg_to_rad = function deg_to_rad(degrees) {
        return degrees * Math.PI / 180;
    }
    Util.rad_to_deg = function rad_to_deg(rad) {
        return rad * 180 / Math.PI;
    }
    return Util;
})();
var Vector3d = (function () {
    function Vector3d(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Vector3d.prototype.normalize = function () {
        var l = this.length();
        this.x /= l;
        this.y /= l;
        this.z /= l;
    };
    Vector3d.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };
    Vector3d.prototype.scale = function (sf) {
        this.x *= sf;
        this.y *= sf;
        this.z *= sf;
    };
    Vector3d.prototype.cross_by = function (a) {
        var x1;
        var y1;
        var z1;

        x1 = (this.y * a.z) - (a.y * this.z);
        y1 = -((this.x * a.z) - (this.z * a.x));
        z1 = (this.x * a.y) - (a.x * this.y);
        return new Vector3d(x1, y1, z1);
    };
    Vector3d.prototype.get_angle = function () {
        return Math.atan2(this.y, this.x);
    };
    return Vector3d;
})();
var HitRect = (function () {
    function HitRect(x, y, wid, hei) {
        this.x = x;
        this.y = y;
        this.wid = wid;
        this.hei = hei;
    }
    HitRect.prototype.draw = function (c) {
        c.draw_rect(this.x, this.y, this.wid, this.hei, Canvas.WHITE, 0.5);
    };
    HitRect.prototype.contains_point = function (x, y) {
        var rect = this;
        return (x > rect.x) && (x < rect.x + rect.wid) && (y > rect.y) && (y < rect.y + rect.hei);
    };
    HitRect.prototype.is_hit = function (tar) {
        if(this.wid == 0 || this.hei == 0 || tar.wid == 0 || tar.hei == 0) {
            return false;
        }
        var r1x1 = this.x;
        var r1x2 = this.x + this.wid;
        var r1y1 = this.y;
        var r1y2 = this.y + this.hei;
        var r2x1 = tar.x;
        var r2x2 = tar.x + tar.wid;
        var r2y1 = tar.y;
        var r2y2 = tar.y + tar.hei;
        return !(r1x1 > r2x2 || r2x1 > r1x2 || r1y1 > r2y2 || r2y1 > r1y2);
    };
    return HitRect;
})();
var Game = (function () {
    function Game(c) {
        this.status = {
            score: 0,
            lives: 3,
            wave_timer: 0
        };
        this.player_bullets = [];
        this.particles = [];
        this.enemy = [];
        this.keys_down = [];
        this.star_ctr = 0;
        c.width = Game.WIDTH;
        c.height = Game.HEIGHT;
        this.canvas = new Canvas(c);
        this.screen_rect = new HitRect(0, 0, Game.WIDTH, Game.HEIGHT);
        Game.player_start_x = Game.WIDTH / 2;
        Game.player_start_y = Game.HEIGHT * (3 / 4);
        this.player = new Player(Game.player_start_x, Game.player_start_y);
        WaveDefinitions.random_wave(this);
        var me = this;
        this.timer_token = setInterval(function () {
            me.update();
            me.draw();
        }, 20);
        window.addEventListener('keydown', function (e) {
            if(e.keyCode != undefined && me.keys_down.indexOf(e.keyCode) == -1) {
                if(e.keyCode == Game.KEYBOARD.SPACE) {
                    me.player.shot_recharge = 0;
                }
                me.keys_down.push(e.keyCode);
            }
        }, true);
        window.addEventListener('keyup', function (e) {
            while(me.keys_down.indexOf(e.keyCode) != -1) {
                me.keys_down.splice(me.keys_down.indexOf(e.keyCode), 1);
            }
        }, true);
    }
    Game.WIDTH = 800;
    Game.HEIGHT = 600;
    Game.DRAW_HITRECT = false;
    Game.player_start_x = 0;
    Game.player_start_y = 0;
    Game.KEYBOARD = {
        UP: 38,
        LEFT: 37,
        RIGHT: 39,
        DOWN: 40,
        SPACE: 32,
        SHIFT: 16
    };
    Game.prototype.draw = function () {
        var c = this.canvas;
        c.clear();
        c.draw_rect(0, 0, Game.WIDTH, Game.HEIGHT, "#111111");
        var drawAll = function (i) {
            i.draw(c);
        };
        this.player.draw(c);
        this.particles.forEach(drawAll);
        this.enemy.forEach(drawAll);
        this.player_bullets.forEach(drawAll);
        this.draw_ui();
    };
    Game.prototype.draw_ui = function () {
        this.canvas.draw_text(0, 15, "SCORE: " + this.status.score);
        this.canvas.draw_text(0, 35, "LIVES: " + this.status.lives);
        this.canvas.draw_text(0, 55, "NEXT WAVE: " + this.status.wave_timer);
    };
    Game.prototype.update = function () {
        this.player_control();
        this.update_starfield();
        this.obj_update(this.particles);
        this.obj_update(this.player_bullets);
        this.obj_update(this.enemy);
        if(this.status.wave_timer == 0) {
            WaveDefinitions.random_wave(this);
        } else {
            this.status.wave_timer--;
        }
    };
    Game.prototype.update_starfield = function () {
        this.star_ctr--;
        if(this.star_ctr < 0) {
            this.star_ctr = 5;
            this.particles.push(new Particle(Random.rand(0, Game.WIDTH), 0, 0, 10, Random.rand(0.5, 1.5), Canvas.WHITE));
        }
    };
    Game.prototype.obj_update = function (a) {
        for(var i = 0; i < a.length; i++) {
            a[i].update(this);
        }
        this.remove_finished(a);
    };
    Game.prototype.remove_finished = function (a) {
        for(var i = a.length - 1; i >= 0; i--) {
            if(a[i].should_remove()) {
                a.splice(i, 1);
            }
        }
    };
    Game.prototype.player_control = function () {
        var p = this.player;
        var spd = this.is_key_down(Game.KEYBOARD.SHIFT) ? 2 : 5;
        if(this.is_key_down(Game.KEYBOARD.LEFT)) {
            p.vx = -1 * spd;
        } else {
            if(this.is_key_down(Game.KEYBOARD.RIGHT)) {
                p.vx = spd;
            } else {
                p.vx = 0;
            }
        }
        if(this.is_key_down(Game.KEYBOARD.UP)) {
            p.vy = -1 * spd;
        } else {
            if(this.is_key_down(Game.KEYBOARD.DOWN)) {
                p.vy = spd;
            } else {
                p.vy = 0;
            }
        }
        if(this.is_key_down(Game.KEYBOARD.SPACE)) {
            if(this.player.shot_recharge <= 0) {
                this.player_bullets.push(new ParticleBullet(this.player.x + this.player.width / 2 - 10 / 2, this.player.y, 0, -10, 10, 10, Canvas.GREEN, 1));
                this.player.shot_recharge = 10;
            } else {
                this.player.shot_recharge--;
            }
        }
        p.update(this);
    };
    Game.prototype.player_hit = function () {
        this.status.lives--;
        if(this.status.lives >= 0) {
            this.player.invulnerable_timer = 70;
            this.player.x = Game.player_start_x;
            this.player.y = Game.player_start_y;
        } else {
            clearInterval(this.timer_token);
            this.canvas.draw_text(Game.WIDTH / 2, Game.HEIGHT / 2, "GAME OVER", 30);
            throw "end";
        }
    };
    Game.prototype.is_key_down = function (k) {
        return this.keys_down.indexOf(k) != -1;
    };
    return Game;
})();
var GameObject = (function () {
    function GameObject() { }
    GameObject.prototype.draw = function (c) {
    };
    GameObject.prototype.update = function (g) {
    };
    GameObject.prototype.should_remove = function () {
        return false;
    };
    return GameObject;
})();
var Canvas = (function () {
    function Canvas(c) {
        this._g = c.getContext("2d");
    }
    Canvas.RED = "rgb(255,0,0)";
    Canvas.BLUE = "rgb(0,0,255)";
    Canvas.GREEN = "rgb(0,255,0)";
    Canvas.WHITE = "rgb(255,255,255)";
    Canvas.BLACK = "rgb(0,0,0)";
    Canvas.YELLOW = "rgb(255,255,0)";
    Canvas.prototype.clear = function () {
        this._g.clearRect(0, 0, Game.WIDTH, Game.HEIGHT);
    };
    Canvas.prototype.draw_rect = function (x, y, width, height, color, alpha) {
        if (typeof color === "undefined") { color = Canvas.BLUE; }
        if (typeof alpha === "undefined") { alpha = 1; }
        this._g.save();
        this._g.globalAlpha = alpha;
        this._g.fillStyle = color;
        this._g.translate(x, y);
        this._g.fillRect(0, 0, width, height);
        this._g.restore();
    };
    Canvas.prototype.draw_centered_rect = function (x, y, width, height, color, alpha, rotation) {
        if (typeof color === "undefined") { color = Canvas.BLUE; }
        if (typeof alpha === "undefined") { alpha = 1; }
        if (typeof rotation === "undefined") { rotation = 0; }
        this._g.save();
        this._g.globalAlpha = alpha;
        this._g.fillStyle = color;
        this._g.translate(x, y);
        this._g.rotate(rotation);
        this._g.fillRect(-width / 2, -height / 2, width, height);
        this._g.restore();
    };
    Canvas.prototype.draw_circ = function (x, y, rad, color, alpha) {
        if (typeof color === "undefined") { color = Canvas.BLUE; }
        if (typeof alpha === "undefined") { alpha = 1; }
        this._g.save();
        this._g.globalAlpha = alpha;
        this._g.fillStyle = color;
        this._g.beginPath();
        this._g.arc(x, y, rad, 0, Math.PI * 2);
        this._g.closePath();
        this._g.fill();
        this._g.restore();
    };
    Canvas.prototype.draw_text = function (x, y, text, font_size, font_color) {
        if (typeof font_size === "undefined") { font_size = 15; }
        if (typeof font_color === "undefined") { font_color = "#FFFFFF"; }
        this._g.font = "normal " + font_size + "px game";
        this._g.fillStyle = font_color;
        this._g.fillText(text, x, y);
    };
    return Canvas;
})();
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
var Player = (function (_super) {
    __extends(Player, _super);
    function Player(x, y) {
        _super.call(this);
        this.shot_recharge = 0;
        this.invulnerable_timer = 0;
        this.particle_ctr = 0;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 25;
        this.height = 25;
    }
    Player.prototype.draw = function (c) {
        if(this.invulnerable_timer > 0) {
            c.draw_rect(this.x, this.y, this.width, this.height, Canvas.BLUE, this.invulnerable_timer % 10 > 5 ? 1 : 0.3);
        } else {
            c.draw_rect(this.x, this.y, this.width, this.height);
        }
        if(Game.DRAW_HITRECT) {
            this.get_hitrect().draw(c);
        }
    };
    Player.prototype.update = function (g) {
        if(this.invulnerable_timer > 0) {
            this.invulnerable_timer--;
        }
        this.x += this.vx;
        this.y += this.vy;
        if(this.x < 0) {
            this.x = 0;
        } else {
            if(this.x + this.width > Game.WIDTH) {
                this.x = Game.WIDTH - this.width;
            }
        }
        if(this.y < 0) {
            this.y = 0;
        } else {
            if(this.y + this.height > Game.HEIGHT) {
                this.y = Game.HEIGHT - this.height;
            }
        }
        if(this.particle_ctr++ > 5 && this.invulnerable_timer <= 0) {
            this.particle_ctr = 0;
            g.particles.push(new FadingParticle(this.x + this.width / 2 + Random.rand(-this.width / 2, this.width / 2), this.y + this.height / 2, 0, Random.rand(7, 10), Random.rand(1, 5), Canvas.BLUE, 30));
        }
    };
    Player.prototype.get_hitrect = function () {
        if(this.invulnerable_timer > 0) {
            return new HitRect(0, 0, 0, 0);
        } else {
            return new HitRect(this.x, this.y, this.width, this.height);
        }
    };
    return Player;
})(GameObject);
var Bullet = (function (_super) {
    __extends(Bullet, _super);
    function Bullet(x, y, vx, vy, damage) {
        _super.call(this);
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.to_remove = false;
    }
    Bullet.prototype.get_hitrect = function () {
        return new HitRect(this.x, this.y, 1, 1);
    };
    Bullet.prototype.update = function (g) {
        this.to_remove = this.to_remove || !g.screen_rect.contains_point(this.x, this.y);
    };
    Bullet.prototype.force_remove = function () {
        this.to_remove = true;
    };
    Bullet.prototype.should_remove = function () {
        return this.to_remove;
    };
    return Bullet;
})(GameObject);
var ParticleBullet = (function (_super) {
    __extends(ParticleBullet, _super);
    function ParticleBullet(x, y, vx, vy, wid, hei, color, damage) {
        _super.call(this, x, y, vx, vy, damage);
        this.wid = wid;
        this.hei = hei;
        this.color = color;
    }
    ParticleBullet.prototype.update = function (g) {
        _super.prototype.update.call(this, g);
        this.x += this.vx;
        this.y += this.vy;
    };
    ParticleBullet.prototype.draw = function (c) {
        c.draw_rect(this.x, this.y, this.wid, this.hei, this.color);
        if(Game.DRAW_HITRECT) {
            this.get_hitrect().draw(c);
        }
    };
    return ParticleBullet;
})(Bullet);
var Particle = (function (_super) {
    __extends(Particle, _super);
    function Particle(x, y, vx, vy, rad, color) {
        _super.call(this);
        this.is_offscreen = false;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = rad;
        this.color = color;
        this.alpha = 1;
    }
    Particle.prototype.draw = function (c) {
        c.draw_circ(this.x, this.y, this.radius, this.color, this.alpha);
    };
    Particle.prototype.update = function (g) {
        this.x += this.vx;
        this.y += this.vy;
        this.is_offscreen = !g.screen_rect.contains_point(this.x, this.y);
    };
    Particle.prototype.should_remove = function () {
        return this.is_offscreen;
    };
    return Particle;
})(GameObject);
var FadingParticle = (function (_super) {
    __extends(FadingParticle, _super);
    function FadingParticle(x, y, vx, vy, rad, color, time) {
        _super.call(this, x, y, vx, vy, rad, color);
        this.time = time;
        this.max_time = time;
    }
    FadingParticle.prototype.update = function (g) {
        _super.prototype.update.call(this, g);
        this.time = this.time > 0 ? this.time - 1 : 0;
        this.alpha = this.time / this.max_time;
    };
    FadingParticle.prototype.should_remove = function () {
        return _super.prototype.should_remove.call(this) || this.alpha == 0;
    };
    return FadingParticle;
})(Particle);
var Enemy = (function (_super) {
    __extends(Enemy, _super);
    function Enemy() {
        _super.call(this);
        this.hp = 1;
    }
    Enemy.prototype.get_hitrect = function () {
        return new HitRect(this.x, this.y, 1, 1);
    };
    Enemy.prototype.draw = function (c) {
        if(Game.DRAW_HITRECT) {
            this.get_hitrect().draw(c);
        }
    };
    Enemy.prototype.update = function (g) {
        var me = this;
        var hitrect = me.get_hitrect();
        g.player_bullets.forEach(function (i) {
            if(hitrect.is_hit(i.get_hitrect())) {
                me.hp -= i.damage;
                i.force_remove();
            }
        });
        if(this.should_remove()) {
            this.death_anim(g);
        }
        if(hitrect.is_hit(g.player.get_hitrect())) {
            g.player_hit();
        }
    };
    Enemy.prototype.death_anim = function (g) {
        for(var i = 0; i < Math.PI * 2; i += Math.PI / 8) {
            var spd = Random.rand(5, 10);
            g.particles.push(new FadingParticle(this.x, this.y, Math.cos(i) * spd, Math.sin(i) * spd, 3, Canvas.RED, 20));
        }
    };
    Enemy.prototype.should_remove = function () {
        return this.hp <= 0;
    };
    return Enemy;
})(GameObject);
var FormationEnemy = (function (_super) {
    __extends(FormationEnemy, _super);
    function FormationEnemy(x, y, formation_x, formation_y) {
        _super.call(this);
        this.formation_position = {
            x: 0,
            y: 0
        };
        this.rot = 0;
        this.moving_to_formation = true;
        this.force_remove = false;
        this.x = x;
        this.y = y;
        this.formation_position.x = formation_x;
        this.formation_position.y = formation_y;
    }
    FormationEnemy.speed = 7;
    FormationEnemy.prototype.update = function (g) {
        var dist = Math.sqrt(Math.pow(this.x - this.formation_position.x, 2) + Math.pow(this.y - this.formation_position.y, 2));
        if(this.moving_to_formation && dist > 1) {
            var tar_vec = new Vector3d(this.formation_position.x - this.x, this.formation_position.y - this.y, 0);
            tar_vec.normalize();
            var spd = dist < 10 ? Math.max(0.1, dist * 0.5) : FormationEnemy.speed;
            tar_vec.scale(spd);
            this.rot = Util.rad_to_deg(tar_vec.get_angle());
            this.x += tar_vec.x;
            this.y += tar_vec.y;
        } else {
            if(this.moving_to_formation) {
                this.rot = 0;
                this.moving_to_formation = false;
            }
        }
        if(!this.moving_to_formation) {
            this.post_formation_action(g);
        }
        _super.prototype.update.call(this, g);
    };
    FormationEnemy.prototype.death_anim = function (g) {
        if(!this.force_remove) {
            _super.prototype.death_anim.call(this, g);
        }
    };
    FormationEnemy.prototype.post_formation_action = function (g) {
        this.y += 5;
        this.force_remove = !g.screen_rect.contains_point(this.x, this.y);
    };
    FormationEnemy.prototype.should_remove = function () {
        return _super.prototype.should_remove.call(this) || (!this.moving_to_formation && this.force_remove);
    };
    FormationEnemy.prototype.get_hitrect = function () {
        return new HitRect(this.x - TrackingEnemy.size / 2, this.y - TrackingEnemy.size / 2, TrackingEnemy.size, TrackingEnemy.size);
    };
    FormationEnemy.prototype.draw = function (c) {
        c.draw_centered_rect(this.x, this.y, TrackingEnemy.size, TrackingEnemy.size, Canvas.RED, 1, this.rot);
        _super.prototype.draw.call(this, c);
    };
    return FormationEnemy;
})(Enemy);
var TrackingEnemy = (function (_super) {
    __extends(TrackingEnemy, _super);
    function TrackingEnemy(x, y) {
        _super.call(this);
        this.rot = 0;
        this.rand_tar = null;
        this.x = x;
        this.y = y;
    }
    TrackingEnemy.size = 35;
    TrackingEnemy.speed = 2.5;
    TrackingEnemy.prototype.get_hitrect = function () {
        return new HitRect(this.x - TrackingEnemy.size / 2, this.y - TrackingEnemy.size / 2, TrackingEnemy.size, TrackingEnemy.size);
    };
    TrackingEnemy.prototype.update = function (g) {
        var tar_x;
        var tar_y;
        if(g.player.invulnerable_timer > 0) {
            this.rot += 0.05;
            return;
        } else {
            this.rand_tar = null;
            tar_x = g.player.x;
            tar_y = g.player.y;
        }
        this.rot += 0.05;
        var tar_vec = new Vector3d(tar_x - this.x, tar_y - this.y, 0);
        tar_vec.normalize();
        tar_vec.scale(TrackingEnemy.speed);
        this.x += tar_vec.x;
        this.y += tar_vec.y;
        _super.prototype.update.call(this, g);
    };
    TrackingEnemy.prototype.draw = function (c) {
        c.draw_centered_rect(this.x, this.y, TrackingEnemy.size, TrackingEnemy.size, Canvas.RED, 1, this.rot);
        _super.prototype.draw.call(this, c);
    };
    return TrackingEnemy;
})(Enemy);
var WaveDefinitions = (function () {
    function WaveDefinitions() { }
    WaveDefinitions.wave1 = function (g) {
        var wid = Game.WIDTH;
        var enemies = 6;
        var offset = 100;
        for(var i = -offset; i < wid + offset; i += (wid + offset * 2) * (1 / enemies)) {
            g.enemy.push(new TrackingEnemy(i, -100));
        }
        g.status.wave_timer = 250;
    };
    WaveDefinitions.wave2 = function (g) {
        for(var x = 75; x < Game.WIDTH; x += 75) {
            for(var y = 75; y < 250; y += 75) {
                g.enemy.push(new FormationEnemy(-40, -40, x, y));
            }
        }
        for(var x = 50; x < Game.WIDTH; x += 75) {
            for(var y = 75; y < 250; y += 75) {
                g.enemy.push(new FormationEnemy(Game.WIDTH + 400, -400, x, y));
            }
        }
        g.status.wave_timer = 260;
    };
    WaveDefinitions.random_wave = function (g) {
        var rand = Math.floor(Math.random() * 1000) % 2;
        if(rand == 0) {
            WaveDefinitions.wave1(g);
        } else {
            if(rand == 1) {
                WaveDefinitions.wave2(g);
            }
        }
    };
    return WaveDefinitions;
})();
window.onload = function () {
    new Game(document.getElementById("game"));
};
