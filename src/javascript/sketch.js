window.onload = function () {
    let ctx = document.getElementById("C"),
      c = ctx.getContext("2d"),
      w,
      h;
    fitCanvas();
  
    class attractor {
      constructor(id) {
        this.ind = id;
        this.controlledByMouse = false;
        if (id == 0) {
          this.controlledByMouse = true;
        }
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vAng = Math.random() * 2 * Math.PI - Math.PI;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.polarity = 1;
        this.color = "216,100%,50%";
        if (id % 2 == 0) {
          this.polarity = -1;
          this.color = "0,100%,50%";
          let ang, x, y;
          for (let i = 0; i < LPAtt; i++) {
            ang = (i * 2 * Math.PI) / LPAtt;
            x = Math.cos(ang);
            y = Math.sin(ang);
            lines.push(new line(this, x, y));
          }
        }
      }
      calc_forces(other) {
        let d, inv_d, ang, mag, attract_force, force_color;
        for(let i = 0, len = other.length; i < len; i++){
          if(other[i] == this){
            continue;
          }
          d = Math.sqrt(Math.pow(other[i].x-this.x,2)+Math.pow(other[i].y-this.y,2));
          if((this.polarity > 0 && other[i].polarity > 0) || (this.polarity < 0 && other[i].polarity < 0)){
            attract_force = -1;
            
          }else{
            attract_force = 1;
          }
          if(d < max_d){
            inv_d = max_d-d;
            ang = Math.atan2(other[i].y-this.y,other[i].x-this.x);
            if(d > att_size*2){
              mag = attract_force*att_spd/((max_d*max_d)/(inv_d*inv_d));
            }else{
              mag = -1*att_spd/((max_d*max_d)/(inv_d*inv_d));
            }
            this.ax += mag*Math.cos(ang);
            this.ay += mag*Math.sin(ang);
          }
        }
      }
      update(m) {
        if (this.controlledByMouse) {
          this.x = m.x;
          this.y = m.y;
          if (mouseDown && mouseCounter == 0) {
            this.polarity *= -1;
            if (this.polarity > 0) {
              this.color = "216,100%,50%";
            } else {
              this.color = "0,100%,50%";
            }
            mouseCounter++;
          }
          if (!mouseDown && mouseCounter != 0) {
            mouseCounter = 0;
          }
        } else {
          //attractor movement
          this.vx += this.ax;
          this.vy += this.ay;
          this.vx *= 0.7;
          this.vy *= 0.7;
          this.x += this.vx;
          this.y += this.vy;
          this.ax = 0;
          this.ay = 0;
          //edges
          if (this.x < att_size) {
            this.x -= this.x - att_size;
            this.vx *= -1;
          }
          if (this.x > w - att_size) {
            this.x -= this.x - w + att_size;
            this.vx *= -1;
          }
          if (this.y < att_size) {
            this.y -= this.y - att_size;
            this.vy *= -1;
          }
          if (this.y > h - att_size) {
            this.y -= this.y - h + att_size;
            this.vy *= -1;
          }
        }
      }
      show() {
        
        for(let i = 0; i < 10; i++){
          c.beginPath();
          c.arc(this.x, this.y, att_size*(i/4)*(i/4), 0, 2 * Math.PI);
          c.fillStyle = "hsl("+this.color+","+(Math.pow(1-i/10,2))+")";
          c.lineWidth = 1;
          c.fill();
        }
        
        c.beginPath();
        c.arc(this.x, this.y, att_size, 0, 2 * Math.PI);
        c.fillStyle = "hsl("+this.color+")";
        c.lineWidth = 1;
        c.fill();
      }
    }
  
    class line {
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
          let earlyExit = false,
            dpos = 1e6,
            dneg = 1e6;
          let v2x,
            v2y,
            d,
            vx = 0,
            vy = 0;
          for (let t of att) {
            v2x = (t.x - this.x) * t.polarity;
            v2y = (t.y - this.y) * t.polarity;
            d = Math.sqrt(Math.pow(v2x, 2) + Math.pow(v2y, 2));
            if (d < dneg && t.polarity == -1) {
              dneg = d;
            }
            if (d < dpos && t.polarity == 1) {
              dpos = d;
            }
            if (d < segment_length * 1.2 && t.polarity == 1) {
              earlyExit = true;
            }
            vx += v2x / (d * d);
            vy += v2y / (d * d);
          }
          let vd = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
          vx /= vd;
          vy /= vd;
          this.x += vx * segment_length;
          this.y += vy * segment_length;
          if (earlyExit) {
            break;
          }
          this.tail.push({ x: this.x, y: this.y });
        }
      }
      show() {
        c.beginPath();
        for (let i = 0, len = this.tail.length; i < len; i++) {
          c.lineTo(this.tail[i].x, this.tail[i].y);
        }
        c.strokeStyle = "white";
        c.lineWidth = line_width;
        c.stroke();
      }
    }
  
    let LPAtt = 36,
      att_num = 40,
      att_spd = 0.1,
      segment_length = 6,
      segment_num = 120,
      att_max_d = 150,
      max_d = Math.sqrt(Math.pow(w,2)+Math.pow(h,2));
  
    let att_size = segment_length + 1,
      line_width = 0.5;
  
    let mouse = { x: false, y: false },
      last_mouse = {},
      mouseDown = false,
      mouseCounter = 0;
  
    let att = [],
      lines = [];
  
    for (let i = 0; i < att_num; i++) {
      att.push(new attractor(i));
    }
  
    function draw() {
      for (let i = 0, len = att.length; i < len; i++) {
        att[i].calc_forces(att);
        att[i].update(mouse);
      }
      for (let i = 0, len = lines.length; i < len; i++) {
        lines[i].reset();
        lines[i].update();
        lines[i].show();
      }
      for (let i = 0, len = att.length; i < len; i++) {
        att[i].show();
      }
    }
  
    ctx.addEventListener(
      "mousemove",
      function (e) {
        last_mouse.x = mouse.x;
        last_mouse.y = mouse.y;
  
        mouse.x = e.pageX - this.offsetLeft;
        mouse.y = e.pageY - this.offsetTop;
      },
      false
    );
  
    //mouse pressed
    ctx.addEventListener(
      "mousedown",
      function (e) {
        mouseDown = true;
      },
      false
    );
  
    //mouse not pressed
    ctx.addEventListener(
      "mouseup",
      function (e) {
        mouseDown = false;
      },
      false
    );
  
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
  