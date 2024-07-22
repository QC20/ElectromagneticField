window.onload = function () {
    // Get canvas and context
    let ctx = document.getElementById("C"),
        c = ctx.getContext("2d"),
        w,
        h;
    
    fitCanvas();

    // Attractor class
    class Attractor {
        constructor(id) {
            this.ind = id;
            this.controlledByMouse = id === 0;
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = 0;
            this.vy = 0;
            this.ax = 0;
            this.ay = 0;
            this.polarity = id % 2 === 0 ? -1 : 1;
            this.color = this.polarity === 1 ? "216,100%,50%" : "0,100%,50%";

            // Create lines for negative polarity attractors
            if (this.polarity === -1) {
                for (let i = 0; i < LPAtt; i++) {
                    let ang = (i * 2 * Math.PI) / LPAtt;
                    let x = Math.cos(ang);
                    let y = Math.sin(ang);
                    lines.push(new Line(this, x, y));
                }
            }
        }

        calcForces(others) {
            for (let other of others) {
                if (other === this) continue;

                let dx = other.x - this.x;
                let dy = other.y - this.y;
                let d = Math.sqrt(dx * dx + dy * dy);

                if (d < max_d) {
                    let attractForce = this.polarity * other.polarity > 0 ? -1 : 1;
                    let inv_d = max_d - d;
                    let ang = Math.atan2(dy, dx);
                    let mag = d > att_size * 2 ? 
                        attractForce * att_spd / ((max_d * max_d) / (inv_d * inv_d)) :
                        -1 * att_spd / ((max_d * max_d) / (inv_d * inv_d));

                    this.ax += mag * Math.cos(ang);
                    this.ay += mag * Math.sin(ang);
                }
            }
        }

        update(mouse) {
            if (this.controlledByMouse) {
                this.x = mouse.x;
                this.y = mouse.y;
                if (mouseDown && mouseCounter === 0) {
                    this.polarity *= -1;
                    this.color = this.polarity > 0 ? "216,100%,50%" : "0,100%,50%";
                    mouseCounter++;
                }
                if (!mouseDown && mouseCounter !== 0) {
                    mouseCounter = 0;
                }
            } else {
                // Update position based on velocity and acceleration
                this.vx += this.ax;
                this.vy += this.ay;
                this.vx *= 0.7; // Damping factor
                this.vy *= 0.7;
                this.x += this.vx;
                this.y += this.vy;
                this.ax = 0;
                this.ay = 0;

                // Bounce off edges
                if (this.x < att_size || this.x > w - att_size) {
                    this.x = Math.max(att_size, Math.min(w - att_size, this.x));
                    this.vx *= -1;
                }
                if (this.y < att_size || this.y > h - att_size) {
                    this.y = Math.max(att_size, Math.min(h - att_size, this.y));
                    this.vy *= -1;
                }
            }
        }

        show() {
            // Draw glow effect
            for (let i = 0; i < 10; i++) {
                c.beginPath();
                c.arc(this.x, this.y, att_size * (i / 4) * (i / 4), 0, 2 * Math.PI);
                c.fillStyle = `hsla(${this.color},${Math.pow(1 - i / 10, 2)})`;
                c.fill();
            }

            // Draw core
            c.beginPath();
            c.arc(this.x, this.y, att_size, 0, 2 * Math.PI);
            c.fillStyle = `hsl(${this.color})`;
            c.fill();
        }
    }

    // Line class
    class Line {
        constructor(parent, x, y) {
            this.p = parent;
            this.ox = x;
            this.oy = y;
            this.tail = [];
            this.reset();
            this.tail.push({ x: this.p.x, y: this.p.y });
            this.tail.push({ x: this.x, y: this.y });
        }

        reset() {
            this.x = this.p.x + this.ox;
            this.y = this.p.y + this.oy;
        }

        update() {
            this.tail = [];
            for (let i = 0; i < segment_num; i++) {
                let earlyExit = false;
                let dpos = 1e6, dneg = 1e6;
                let vx = 0, vy = 0;

                for (let t of att) {
                    let v2x = (t.x - this.x) * t.polarity;
                    let v2y = (t.y - this.y) * t.polarity;
                    let d = Math.sqrt(v2x * v2x + v2y * v2y);

                    if (d < dneg && t.polarity === -1) dneg = d;
                    if (d < dpos && t.polarity === 1) dpos = d;
                    if (d < segment_length * 1.2 && t.polarity === 1) {
                        earlyExit = true;
                    }

                    vx += v2x / (d * d);
                    vy += v2y / (d * d);
                }

                let vd = Math.sqrt(vx * vx + vy * vy);
                vx /= vd;
                vy /= vd;
                this.x += vx * segment_length;
                this.y += vy * segment_length;

                if (earlyExit) break;
                this.tail.push({ x: this.x, y: this.y });
            }
        }

        show() {
            c.beginPath();
            for (let point of this.tail) {
                c.lineTo(point.x, point.y);
            }
            c.strokeStyle = "white";
            c.lineWidth = line_width;
            c.stroke();
        }
    }

    // Configuration
    let LPAtt = 36,
        att_num = 40,
        att_spd = 0.1,
        segment_length = 6,
        segment_num = 120,
        att_max_d = 150,
        max_d = Math.sqrt(w * w + h * h);

    let att_size = segment_length + 1,
        line_width = 0.5;

    let mouse = { x: false, y: false },
        mouseDown = false,
        mouseCounter = 0;

    let att = [],
        lines = [];

    // Create attractors
    for (let i = 0; i < att_num; i++) {
        att.push(new Attractor(i));
    }

    function draw() {
        // Clear canvas
        c.clearRect(0, 0, w, h);

        // Update and draw attractors
        for (let a of att) {
            a.calcForces(att);
            a.update(mouse);
        }

        // Update and draw lines
        for (let l of lines) {
            l.reset();
            l.update();
            l.show();
        }

        // Draw attractors on top
        for (let a of att) {
            a.show();
        }
    }

    // Event listeners
    ctx.addEventListener("mousemove", function (e) {
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
    }, false);

    ctx.addEventListener("mousedown", function (e) {
        mouseDown = true;
    }, false);

    ctx.addEventListener("mouseup", function (e) {
        mouseDown = false;
    }, false);

    function fitCanvas() {
        w = ctx.width = window.innerWidth;
        h = ctx.height = window.innerHeight;
    }

    function loop() {
        fitCanvas();
        draw();
        window.requestAnimationFrame(loop);
    }

    window.requestAnimationFrame(loop);
};