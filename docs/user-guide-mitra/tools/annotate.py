"""Regenerate numbered boxes from original screenshots and the recorded DOM bounds."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
mapping = json.loads((root / 'screenshot-map.json').read_text())
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
for entry in mapping:
    image = Image.open(root / 'assets/screenshots' / entry['screenshot']).convert('RGB')
    draw = ImageDraw.Draw(image)
    for annotation in entry['annotations']:
        b = annotation['bounds']
        x, y, w, h = (b[k] for k in ['x', 'y', 'width', 'height'])
        box = (max(2, (x-3)*2), max(2, (y-3)*2), min(2878, (x+w+3)*2), min(1798, (y+h+3)*2))
        draw.rounded_rectangle(box, radius=12, outline='#ffffff', width=8)
        draw.rounded_rectangle(box, radius=12, outline='#008dcc', width=4)
        candidates = [(x-34, y), (x, y-34), (x+w+6, y), (x, y+h+6)]
        candidates = [(a, c) for a, c in candidates if a >= 3 and c >= 3 and a+28 < 1440 and c+28 < 900]
        def collision(position):
            a, c = position
            score = 0
            for other in entry['annotations']:
                r = other['bounds']
                # Parent group boxes do not represent text to avoid inside the group.
                if r['width'] > w and r['height'] > h and r['x'] <= x and r['y'] <= y:
                    continue
                score += max(0, min(a+28, r['x']+r['width'])-max(a, r['x'])) * max(0, min(c+28, r['y']+r['height'])-max(c, r['y']))
            return score
        bx, by = min(candidates, key=collision) if candidates else (3, 3)
        bx, by = max(3, bx)*2, max(3, by)*2
        draw.ellipse((bx, by, bx+56, by+56), fill='#008dcc', outline='white', width=4)
        draw.text((bx+28, by+28), str(annotation['number']), font=font, fill='white', anchor='mm')
    image.save(root / 'assets/annotated' / entry['annotated'], compress_level=3)
print(f'Annotated {len(mapping)} originals; originals unchanged.')
