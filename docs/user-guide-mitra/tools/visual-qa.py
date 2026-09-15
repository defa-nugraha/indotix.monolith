"""Create temporary contact sheets for manual documentation QA; never modify evidence."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw

source = Path(sys.argv[1])
target = Path(sys.argv[2])
target.mkdir(parents=True, exist_ok=True)
files = sorted(source.glob(sys.argv[3] if len(sys.argv) > 3 else '*.png'))
for start in range(0, len(files), 8):
    sheet = Image.new('RGB', (1600, 4 * 532), '#e7edf2')
    draw = ImageDraw.Draw(sheet)
    for index, file in enumerate(files[start:start + 8]):
        image = Image.open(file).convert('RGB')
        image.thumbnail((784, 496))
        x, y = (index % 2) * 800 + 8, (index // 2) * 532 + 28
        sheet.paste(image, (x, y))
        draw.text((x, y - 20), file.name, fill='#132334')
    destination = target / f'contact-{start // 8 + 1:02}.jpg'
    sheet.save(destination, quality=92)
    print(destination)
