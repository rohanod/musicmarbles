class Plank {
    constructor(a, b, clef) {
        this.a = a;
        this.b = b;
        this.clef = clef; // 'treble' or 'bass'
        this.active = 0;

        let delta_x = a[0] - b[0];
        let delta_y = a[1] - b[1];
        this.center_x = (a[0] + b[0]) * 0.5;
        this.center_y = (a[1] + b[1]) * 0.5;
        this.angle = Math.atan2(delta_y, delta_x) + Math.PI;
    }

    update() {
        this.active -= MS_PER_TICK;
    }

    draw() {
        ctx.translate(this.center_x + offset[0], this.center_y + offset[1]);
        ctx.rotate(this.angle);
        ctx.drawImage(this.active > 0 ? PLANK_IMAGES[1] : PLANK_IMAGES[0], -30, -10, 60, 20);
        ctx.rotate(-this.angle);
        ctx.translate(-this.center_x - offset[0], -this.center_y - offset[1]);
    }
}

function generatePlanksFromNotes(notes) {
    planks = [];
    notes.forEach(note => {
        let clef = note.clef; // 'treble' or 'bass'
        let yOffset = clef === 'treble' ? 100 : 300; // Adjust these values as needed
        let a = [note.x1, note.y1 + yOffset];
        let b = [note.x2, note.y2 + yOffset];
        planks.push(new Plank(a, b, clef));
    });
}

class Marble {
    constructor(position, clef) {
        this.position = position;
        this.clef = clef; // 'treble' or 'bass'
        this.trace = [];
        this.collision = -1;
    }

    synchronize(position, collision) {
        this.trace.push(position);
        if (this.trace.length > TRACE_SIZE) {
            this.trace.shift();
        }
        this.position = position;
        this.collision = collision;
    }

    draw() {
        ctx.globalAlpha = 0.05;
        ctx.shadowColor = '#fff7c8';
        ctx.shadowBlur = 15;
        let trace_len = this.trace.length;
        for (let j = 0; j < trace_len; j++) {
            G.drawCircleFilled(
                this.trace[trace_len - j - 1],
                MARBLE_RADIUS - j * RADIUS_DECAY - 1,
                '#fff7c8'
            );
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        ctx.drawImage(
            MARBLE_IMAGE,
            this.position[0] - MARBLE_IMAGE_SIZE / 2 + offset[0],
            this.position[1] - MARBLE_IMAGE_SIZE / 2 + offset[1],
            MARBLE_IMAGE_SIZE,
            MARBLE_IMAGE_SIZE
        );
    }
}

function play_sounds() {
    for (let i = 0; i < marbles.length; i++) {
        let marble = marbles[i];
        let plank_index = marble.collision;
        if (plank_index === -1)
            continue;
        let plank = planks[plank_index];
        if (plank.clef !== marble.clef)
            continue; // Skip if clefs do not match

        let particle_position = [plank.center_x, plank.center_y];
        plank.active = track[plank_index].duration * 1200;
        PIANO.triggerAttackRelease(track[plank_index].note_names, track[plank_index].duration);
        for (let j = 0; j < track[plank_index].note_names.length * 3 + 4; j++) {
            generate_particle(particle_position, plank_index, j > 1);
        }
    }
}

window.addEventListener('load', () => {
    let list = document.getElementById('music-list');
    music.forEach((m, i) => {
        let element = document.createElement('div');
        element.classList.add('music');
        element.innerText = m['header']['name'];
        element.onclick = () => {
            let ch = list.children;
            for(let j = 0; j < ch.length; j++) {
                ch[j].classList.remove('active')
            }
            element.classList.add('active');
            load_track(music[i]);
            generatePlanksFromNotes(music[i].notes); // Assuming notes are part of the music data
            run_all();
        };
        list.append(element);
    })
});