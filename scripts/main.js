
class Plank {
    constructor(a, b, note, clef) {
        this.a = a;
        this.b = b;
        this.note = note; // New property to store the note
        this.clef = clef; // 'treble' or 'bass' to distinguish planks by clef
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

    playNote() {
        // Play the note using Tone.js
        let synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease(this.note, "8n");
    }
}

class Marble {
    constructor(position, clef) {
        this.position = position;
        this.clef = clef; // 'treble' or 'bass' to distinguish marbles by clef
        this.trace = [];
        this.collision = -1;
    }

    update(planks) {
        // Update the marble's position and check for collision with planks
        for (let i = 0; i < planks.length; i++) {
            let plank = planks[i];

            if (this.clef === plank.clef && this.detectCollision(plank)) {
                plank.active = 500; // Set active status
                plank.playNote();   // Play note if there's a collision
                this.collision = i;
            }
        }
    }

    detectCollision(plank) {
        // Simple collision detection logic between marble and plank
        let dx = this.position[0] - plank.center_x;
        let dy = this.position[1] - plank.center_y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        return distance < 30; // Adjust the collision radius as needed
    }

    draw() {
        // Marble drawing logic
        ctx.beginPath();
        ctx.arc(this.position[0] + offset[0], this.position[1] + offset[1], 10, 0, 2 * Math.PI);
        ctx.fillStyle = this.clef === 'treble' ? 'blue' : 'red'; // Different color for treble and bass marbles
        ctx.fill();
        ctx.stroke();
    }
}

function generatePlanksFromNotes(notes, clef) {
    let planks = [];
    for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        let yPos = clef === 'treble' ? 100 + i * 30 : 400 + i * 30; // Higher for treble, lower for bass
        let plank = new Plank([50, yPos], [150, yPos], note, clef);
        planks.push(plank);
    }
    return planks;
}

function main() {
    let trebleNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
    let bassNotes = ["C3", "D3", "E3", "F3", "G3", "A3", "B3"];

    let treblePlanks = generatePlanksFromNotes(trebleNotes, 'treble');
    let bassPlanks = generatePlanksFromNotes(bassNotes, 'bass');

    let trebleMarble = new Marble([60, 80], 'treble');
    let bassMarble = new Marble([60, 380], 'bass');

    // Combine all planks for easy update
    let planks = treblePlanks.concat(bassPlanks);

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw planks
        planks.forEach(plank => {
            plank.update();
            plank.draw();
        });

        // Update and draw marbles
        trebleMarble.update(planks);
        trebleMarble.draw();

        bassMarble.update(planks);
        bassMarble.draw();

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

window.onload = main;
