"""
generate_icons.py
สร้าง PWA icons ทุกขนาดโดยไม่ต้องติดตั้งอะไรเพิ่ม
(ใช้ Pillow ซึ่งมักติดมากับ Python หรือ pip install Pillow)

Run: python generate_icons.py
"""
import os
import math

SIZES = [72, 96, 128, 144, 152, 180, 192, 512]
OUT_DIR = os.path.join(os.path.dirname(__file__), 'public', 'icons')

def generate_icons_pillow():
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("กรุณาติดตั้ง Pillow: pip install Pillow")
        return False

    os.makedirs(OUT_DIR, exist_ok=True)

    for size in SIZES:
        img  = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Background gradient simulation (2 colors)
        for y in range(size):
            t   = y / size
            r   = int(124 + (168 - 124) * t)
            g   = int(99  + (85  - 99 ) * t)
            b   = int(255)
            for x in range(size):
                # Rounded rect mask
                pad = size * 0.18
                rx  = size * 0.22
                if (x < pad or x > size - pad or y < pad or y > size - pad):
                    dist_x = max(pad - x, x - (size - pad), 0)
                    dist_y = max(pad - y, y - (size - pad), 0)
                    if math.sqrt(dist_x**2 + dist_y**2) > rx:
                        continue
                img.putpixel((x, y), (r, g, b, 255))

        # Draw simple "L" hub logo
        lw = max(2, size // 24)
        cx = size // 2
        cy = size // 2
        w  = int(size * 0.45)
        h  = int(size * 0.45)
        x0 = cx - w // 2
        y0 = cy - h // 2

        # Vertical stroke
        draw.rectangle([x0, y0, x0 + lw*2, y0 + h], fill=(255, 255, 255, 230))
        # Horizontal stroke
        draw.rectangle([x0, y0 + h - lw*2, x0 + w, y0 + h], fill=(255, 255, 255, 230))

        out_path = os.path.join(OUT_DIR, f'icon-{size}.png')
        img.save(out_path, 'PNG')
        print(f'✓ {out_path}')

    print('\nสร้าง icons สำเร็จทั้งหมด!')
    return True

if __name__ == '__main__':
    success = generate_icons_pillow()
    if not success:
        # Fallback: create minimal placeholder PNG
        import struct, zlib

        def minimal_png(size):
            def chunk(t, d):
                c = struct.pack('>I', len(d)) + t + d
                return c + struct.pack('>I', zlib.crc32(c[4:]) & 0xffffffff)

            w = h = size
            header = b'\x89PNG\r\n\x1a\n'
            ihdr   = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            raw    = b''
            for y in range(h):
                raw += b'\x00'
                for x in range(w):
                    r = 124; g = 99; b_val = 255
                    raw += bytes([r, g, b_val])
            idat = chunk(b'IDAT', zlib.compress(raw))
            iend = chunk(b'IEND', b'')
            return header + ihdr + idat + iend

        os.makedirs(OUT_DIR, exist_ok=True)
        for size in SIZES:
            with open(os.path.join(OUT_DIR, f'icon-{size}.png'), 'wb') as f:
                f.write(minimal_png(size))
            print(f'✓ placeholder icon-{size}.png')
        print('\nสร้าง placeholder icons สำเร็จ (สีม่วงล้วน)')
        print('แนะนำ: ติดตั้ง Pillow แล้วรันใหม่เพื่อ icon ที่สวยกว่า')
