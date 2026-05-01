#!/usr/bin/env python3
"""Generate AI illustrations for game-genesis using Pollinations.ai (free, no API key)"""

import os
import time
import urllib.request
import urllib.parse
import json

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'illustrations')

ILLUSTRATIONS = {
    "station-exterior": "Dark sci-fi concept art: a massive research station on a frozen ice planet, brutalist architecture covered in ice and snow, blizzard raging, cold blue tones, dramatic lighting from within, cinematic, no text no watermark",
    "phoenixoid": "Dark sci-fi creature concept art: a terrifying phoenixoid alien monster, chitinous armor plates, multiple limbs with sharp claws, glowing red eyes, biomechanical horror, dark background, cinematic, no text no watermark",
    "spaceport": "Dark sci-fi concept art: an abandoned spaceport on a frozen planet, crashed spacecraft in snow, ruined launch pad, ice-covered structures, eerie red emergency lights, cold atmosphere, cinematic, no text no watermark",
    "mine-tunnel": "Dark sci-fi concept art: underground mine tunnels on an ice planet, narrow passages carved through blue crystalline rock, dim emergency lighting, ice crystals on walls, claustrophobic atmosphere, cinematic, no text no watermark",
    "station-interior": "Dark sci-fi concept art: interior of a research station on an ice planet, metal corridors with flickering lights, emergency red alarms, frost on walls, abandoned medical bay, cinematic, no text no watermark",
    "blizzard-surface": "Dark sci-fi concept art: a person walking through a violent blizzard on an ice planet, barely visible figure in heavy winter gear, snow and ice particles flying, zero visibility, dramatic cold blue tones, cinematic, no text no watermark",
}

def generate_illustrations():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for name, prompt in ILLUSTRATIONS.items():
        output_path = os.path.join(OUTPUT_DIR, f"{name}.png")
        if os.path.exists(output_path):
            print(f"✓ {name} already exists, skipping")
            continue
        
        print(f"Generating {name}...")
        
        # Pollinations.ai free API
        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=576&nologo=true&seed=42"
        
        try:
            urllib.request.urlretrieve(url, output_path)
            size = os.path.getsize(output_path)
            print(f"  ✓ Saved ({size/1024:.1f} KB)")
        except Exception as e:
            print(f"  ✗ Error: {e}")
        
        # Rate limit
        time.sleep(3)
    
    print("\nDone! Generated illustrations:")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith('.png'):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            print(f"  {f}: {size/1024:.1f} KB")

if __name__ == "__main__":
    generate_illustrations()