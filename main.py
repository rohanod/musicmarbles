import mido
import numpy as np
import pygame
from pygame.locals import *
import matplotlib.pyplot as plt
from matplotlib.animation import FFMpegWriter
import moviepy.editor as mpy

# Constants for simulation
SCREEN_WIDTH, SCREEN_HEIGHT = 640, 480
MARBLE_RADIUS = 10
GRAVITY = 0.5
FRICTION = 0.99
FRAME_RATE = 30

class Marble:
    def __init__(self, x, y, velocity):
        self.x = x
        self.y = y
        self.velocity = velocity

    def update(self):
        # Apply gravity and friction
        self.velocity[1] += GRAVITY
        self.velocity *= FRICTION
        self.x += self.velocity[0]
        self.y += self.velocity[1]

        # Collision with the floor
        if self.y > SCREEN_HEIGHT - MARBLE_RADIUS:
            self.y = SCREEN_HEIGHT - MARBLE_RADIUS
            self.velocity[1] *= -0.8  # Bounce

class Track:
    def __init__(self):
        self.planks = []

    def generate(self):
        # Generate random planks for the track
        for i in range(5):
            x_start, x_end = np.random.randint(50, 600), np.random.randint(50, 600)
            y_pos = np.random.randint(100, 400)
            self.planks.append(((x_start, y_pos), (x_end, y_pos)))

    def render(self, screen):
        for plank in self.planks:
            pygame.draw.line(screen, (255, 0, 0), plank[0], plank[1], 5)

def parse_midi(midi_file):
    # Load and parse the MIDI file
    mid = mido.MidiFile(midi_file)
    notes = []
    for track in mid.tracks:
        for msg in track:
            if msg.type == 'note_on':
                notes.append((msg.note, msg.time))
    return notes

def play_midi(midi_file):
    pygame.midi.init()
    player = pygame.midi.Output(0)
    player.set_instrument(0)  # Default instrument
    mid = mido.MidiFile(midi_file)
    for msg in mid.play():
        if msg.type == 'note_on':
            player.note_on(msg.note, msg.velocity)
        elif msg.type == 'note_off':
            player.note_off(msg.note, msg.velocity)

def simulate_marble_run(midi_notes):
    marbles = [Marble(np.random.randint(0, SCREEN_WIDTH), 0, np.array([0, 0])) for _ in range(len(midi_notes))]
    return marbles

def render_video(marbles, track, filename='marble_run.mp4'):
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    clock = pygame.time.Clock()

    # Generate the video output
    fig, ax = plt.subplots()
    ax.set_xlim(0, SCREEN_WIDTH)
    ax.set_ylim(0, SCREEN_HEIGHT)
    marble_patches = [plt.Circle((m.x, m.y), MARBLE_RADIUS) for m in marbles]

    for patch in marble_patches:
        ax.add_patch(patch)

    # Update marbles and render the simulation
    def update(frame):
        screen.fill((0, 0, 0))
        track.render(screen)

        for i, marble in enumerate(marbles):
            marble.update()
            marble_patches[i].center = (marble.x, marble.y)
            pygame.draw.circle(screen, (0, 255, 0), (int(marble.x), int(marble.y)), MARBLE_RADIUS)
        return marble_patches

    ani = plt.animation.FuncAnimation(fig, update, frames=500, blit=True)
    writer = FFMpegWriter(fps=FRAME_RATE)
    ani.save(filename, writer=writer)

def create_marble_run_from_midi(midi_file, output_video='marble_run.mp4'):
    # Parse the MIDI file
    midi_notes = parse_midi(midi_file)

    # Simulate marble run
    marbles = simulate_marble_run(midi_notes)
    
    # Generate track
    track = Track()
    track.generate()

    # Render and save video
    render_video(marbles, track, output_video)

    # Play the MIDI file during the marble run
    play_midi(midi_file)

# Usage example:
create_marble_run_from_midi('NDP_2021_Theme_Song_-_The_Road_Ahead__Linying (2).mid')