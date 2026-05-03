#!/usr/bin/env python3
"""Generate additional AI illustrations for game-genesis using Pollinations.ai"""

import os
import ssl
import time
import urllib.request
import urllib.parse

# Fix macOS SSL certificate issue
ctx = ssl.create_default_context()
ctx.load_verify_locations('/etc/ssl/cert.pem')
os.environ['SSL_CERT_FILE'] = '/etc/ssl/cert.pem'

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'illustrations')

EXTRA_ILLUSTRATIONS = {
    "medical-bay": "Dark sci-fi concept art: abandoned medical bay on an ice planet station, broken medical equipment, scattered medicine vials, flickering fluorescent lights, blood stains on floor, cold blue and red tones, cinematic, no text no watermark",
    "command-center": "Dark sci-fi concept art: command center of an ice planet research station, holographic displays flickering, captain chair empty, snow visible through reinforced windows, red alert lights, cinematic, no text no watermark",
    "trap-phoenixoid": "Dark sci-fi concept art: a trap set for an alien creature in an ice station, bait in a flooded basin area, heavy metal doors ready to close, tension and danger, cold blue and red emergency lights, cinematic, no text no watermark",
    "characters-group": "Dark sci-fi character lineup concept art: six people in cold weather gear at an ice planet station, diverse ages and builds, tense expressions, dim emergency lighting, cold blue tones, cinematic, no text no watermark",
    "glider-vehicle": "Dark sci-fi concept art: a hover glider vehicle parked on an ice planet surface, sleek design with ice crystals forming on hull, blizzard in background, cold blue and white tones, cinematic, no text no watermark",
    "ice-crevasse": "Dark sci-fi concept art: a deep ice crevasse on an alien frozen planet, dangerous narrow bridge of ice, blue crystalline walls descending into darkness, a figure carefully crossing, cinematic, no text no watermark",
    "t-field-barrier": "Dark sci-fi concept art: an invisible force field barrier shimmering with faint blue light on a frozen ice planet, energy distortion in the air, snow particles being deflected, mysterious and alien technology, cinematic, no text no watermark",
    "fight-corridor": "Dark sci-fi concept art: a fierce battle in a narrow ice station corridor, person with glowing sword fighting a terrifying alien creature, sparks and ice fragments flying, emergency red lights, cinematic, no text no watermark",
    "frozen-ruins": "Dark sci-fi concept art: ruins of an ancient alien civilization buried in ice on a frozen planet, mysterious crystalline structures partially uncovered, eerie blue glow from within, archaeologist examining, cinematic, no text no watermark",
    "spaceport-ship": "Dark sci-fi concept art: a small spacecraft inside a frozen hangar on an ice planet, ice crystals on the hull, dim emergency lighting, frost on cockpit windows, the only way off the planet, cinematic, no text no watermark",
}

def generate_illustrations():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for name, prompt in EXTRA_ILLUSTRATIONS.items():
        output_path = os.path.join(OUTPUT_DIR, f"{name}.jpg")
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            if size > 10000:  # > 10KB = likely valid image
                print(f"✓ {name} already exists ({size/1024:.1f} KB), skipping")
                continue
            else:
                print(f"⚠ {name} exists but too small ({size} B), regenerating")
                os.remove(output_path)

        print(f"Generating {name}...")

        encoded_prompt = urllib.parse.quote(prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=576&nologo=true&seed=42"

        retries = 3
        for attempt in range(retries):
            try:
                req = urllib.request.Request(url)
                resp = urllib.request.urlopen(req, context=ctx)
                with open(output_path, 'wb') as f:
                    f.write(resp.read())
                size = os.path.getsize(output_path)
                if size > 10000:
                    print(f"  ✓ Saved ({size/1024:.1f} KB)")
                    break
                else:
                    print(f"  ⚠ File too small ({size} B), retrying...")
                    os.remove(output_path)
                    if attempt < retries - 1:
                        time.sleep(5)
            except Exception as e:
                print(f"  ✗ Error (attempt {attempt+1}/{retries}): {e}")
                if os.path.exists(output_path):
                    os.remove(output_path)
                if attempt < retries - 1:
                    time.sleep(5)

        # Rate limit between different images
        time.sleep(3)

    print("\n=== Results ===")
    for f in sorted(os.listdir(OUTPUT_DIR)):
        if f.endswith(('.jpg', '.png', '.webp')):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            status = "✓" if size > 10000 else "✗ TOO SMALL"
            print(f"  {status} {f}: {size/1024:.1f} KB")

if __name__ == "__main__":
    generate_illustrations()