#!/usr/bin/env python3

from PIL import Image
import sys

outname = sys.argv[1]
inputs = sys.argv[2:]
output = Image.new("RGBA", (256, 256))
x = 0
y = 0

for filename in sorted(inputs):
	print("merging", filename, "at", x, y)
	im = Image.open(filename)
	output.paste(im, (x, y))
	x += 64
	
	if x == 256:
		x = 0
		y += 64

output.save(outname, "PNG")
