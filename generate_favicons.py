from PIL import Image

logo_path = 'apps/web/public/logo.png'
im = Image.open(logo_path)

# Generate favicon.ico (multi-resolution 16, 32, 48, 64, 128, 256)
im.save('apps/web/public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("Generated apps/web/public/favicon.ico")

# Generate 32x32 and 16x16 pngs
im_32 = im.resize((32, 32), Image.Resampling.LANCZOS)
im_32.save('apps/web/public/favicon-32x32.png', 'PNG')

im_16 = im.resize((16, 16), Image.Resampling.LANCZOS)
im_16.save('apps/web/public/favicon-16x16.png', 'PNG')

im_180 = im.resize((180, 180), Image.Resampling.LANCZOS)
im_180.save('apps/web/public/apple-touch-icon.png', 'PNG')

print("All favicon assets generated!")
