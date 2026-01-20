from PIL import Image, ImageDraw, ImageFilter
import random
import numpy as np

# Canvas dimensions (typical Flappy Bird ground size)
width = 336
height = 112

# Create base image
img = Image.new('RGB', (width, height), color='#f5f5dc')  # Beige background
draw = ImageDraw.Draw(img)

# Draw base ground pattern
# Dark purple stripe at top
draw.rectangle([0, 0, width, 4], fill='#4a2c4a')

# Orange stripe
draw.rectangle([0, 4, width, 6], fill='#ff8c42')

# Green stripe with diagonal pattern
draw.rectangle([0, 6, width, 26], fill='#7cb342')

# Create diagonal pattern
for y in range(6, 26):
    for x in range(width):
        if (x + y) % 4 < 2:
            draw.point((x, y), fill='#558b2f')

# Convert to numpy array for manipulation
pixels = np.array(img)

# Apply virus/glitch effects

# 1. Random color corruption
for y in range(height):
    for x in range(width):
        if random.random() < 0.15:  # 15% corruption chance
            r, g, b = pixels[y, x]
            pixels[y, x] = [
                min(255, max(0, int(r + (random.random() - 0.5) * 100))),
                min(255, max(0, int(g + (random.random() - 0.5) * 100))),
                min(255, max(0, int(b + (random.random() - 0.5) * 100)))
            ]

# 2. Horizontal scan line glitches
for y in range(height):
    if random.random() < 0.1:  # 10% chance per line
        offset = random.randint(-10, 10)
        glitch_width = random.randint(5, 35)
        start_x = random.randint(0, width - glitch_width)
        
        for x in range(start_x, min(start_x + glitch_width, width)):
            src_x = max(0, min(width - 1, x + offset))
            pixels[y, x] = pixels[y, src_x]

# 3. Random pixel corruption (virus-like artifacts)
virus_colors = [
    [0, 255, 0],      # Bright green
    [0, 255, 255],    # Cyan
    [255, 0, 255],    # Magenta
    [255, 255, 0],    # Yellow
    [255, 0, 0],      # Red
]

for _ in range(500):
    x = random.randint(0, width - 1)
    y = random.randint(0, height - 1)
    pixels[y, x] = random.choice(virus_colors)

# 4. Vertical glitch lines
for x in range(0, width, 5):
    if random.random() < 0.05:
        glitch_height = random.randint(2, 12)
        start_y = random.randint(0, height - glitch_height)
        
        for y in range(start_y, start_y + glitch_height):
            pixels[y, x] = [
                min(255, pixels[y, x][0] + 50),
                min(255, pixels[y, x][1] + 50),
                min(255, pixels[y, x][2] + 50)
            ]

# 5. Add some chromatic aberration effect (color channel shifts)
for y in range(height):
    if random.random() < 0.08:
        shift = random.randint(-3, 3)
        for x in range(width):
            src_x = max(0, min(width - 1, x + shift))
            # Shift red channel
            pixels[y, x][0] = pixels[y, src_x][0]

# Convert back to PIL Image
img = Image.fromarray(pixels.astype('uint8'))

# Save the glitched ground image
img.save('img/ground.png')
print("Glitched ground.png generated successfully!")

