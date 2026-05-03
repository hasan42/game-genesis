#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/illustrations"
mkdir -p "$DIR"

encode() {
    python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$1"
}

download() {
    local name="$1"
    local prompt="$2"
    local outfile="$DIR/$name.jpg"
    
    # Skip if already exists and > 10KB
    if [ -f "$outfile" ]; then
        size=$(stat -f%z "$outfile" 2>/dev/null || stat -c%s "$outfile" 2>/dev/null || echo 0)
        if [ "$size" -gt 10000 ] 2>/dev/null; then
            echo "✓ $name already exists ($(( size / 1024 )) KB), skipping"
            return
        fi
        rm "$outfile"
    fi
    
    local encoded=$(encode "$prompt")
    local url="https://image.pollinations.ai/prompt/${encoded}?width=1024&height=576&nologo=true&seed=42"
    
    echo "Generating $name..."
    
    local success=false
    for attempt in 1 2 3; do
        if curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" --max-time 120 -o "$outfile" "$url"; then
            size=$(stat -f%z "$outfile" 2>/dev/null || stat -c%s "$outfile" 2>/dev/null || echo 0)
            if [ "$size" -gt 10000 ] 2>/dev/null; then
                echo "  ✓ Saved ($(( size / 1024 )) KB)"
                success=true
                break
            else
                echo "  ⚠ File too small ($size B), attempt $attempt/3"
                rm -f "$outfile"
            fi
        else
            echo "  ✗ curl failed, attempt $attempt/3"
            rm -f "$outfile"
        fi
        sleep 5
    done
    
    if [ "$success" = false ]; then
        echo "  ✗ FAILED after 3 attempts: $name"
    fi
    
    sleep 4
}

download "medical-bay" "Dark sci-fi concept art: abandoned medical bay on an ice planet station, broken medical equipment, scattered medicine vials, flickering fluorescent lights, blood stains on floor, cold blue and red tones, cinematic, no text no watermark"
download "command-center" "Dark sci-fi concept art: command center of an ice planet research station, holographic displays flickering, captain chair empty, snow visible through reinforced windows, red alert lights, cinematic, no text no watermark"
download "trap-phoenixoid" "Dark sci-fi concept art: a trap set for an alien creature in an ice station, bait in a flooded basin area, heavy metal doors ready to close, tension and danger, cold blue and red emergency lights, cinematic, no text no watermark"
download "characters-group" "Dark sci-fi character lineup concept art: six people in cold weather gear at an ice planet station, diverse ages and builds, tense expressions, dim emergency lighting, cold blue tones, cinematic, no text no watermark"
download "glider-vehicle" "Dark sci-fi concept art: a hover glider vehicle parked on an ice planet surface, sleek design with ice crystals forming on hull, blizzard in background, cold blue and white tones, cinematic, no text no watermark"
download "ice-crevasse" "Dark sci-fi concept art: a deep ice crevasse on an alien frozen planet, dangerous narrow bridge of ice, blue crystalline walls descending into darkness, a figure carefully crossing, cinematic, no text no watermark"
download "t-field-barrier" "Dark sci-fi concept art: an invisible force field barrier shimmering with faint blue light on a frozen ice planet, energy distortion in the air, snow particles being deflected, mysterious and alien technology, cinematic, no text no watermark"
download "fight-corridor" "Dark sci-fi concept art: a fierce battle in a narrow ice station corridor, person with glowing sword fighting a terrifying alien creature, sparks and ice fragments flying, emergency red lights, cinematic, no text no watermark"
download "frozen-ruins" "Dark sci-fi concept art: ruins of an ancient alien civilization buried in ice on a frozen planet, mysterious crystalline structures partially uncovered, eerie blue glow from within, archaeologist examining, cinematic, no text no watermark"
download "spaceport-ship" "Dark sci-fi concept art: a small spacecraft inside a frozen hangar on an ice planet, ice crystals on the hull, dim emergency lighting, frost on cockpit windows, the only way off the planet, cinematic, no text no watermark"

# Clean up test file
rm -f "$DIR/test-medical-bay.jpg"

echo ""
echo "=== Results ==="
for f in "$DIR"/*.jpg; do
    [ -f "$f" ] || continue
    name=$(basename "$f")
    size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0)
    if [ "$size" -gt 10000 ] 2>/dev/null; then
        echo "  ✓ $name ($(( size / 1024 )) KB)"
    else
        echo "  ✗ $name ($size B — TOO SMALL)"
    fi
done