#!/usr/bin/env python3
"""Recreates the test photographs in tests/e2e/images (the 26 MB noise file is not shipped)."""
from PIL import Image, ImageDraw
import os,random
d=os.path.join(os.path.dirname(os.path.abspath(__file__)),'images'); os.makedirs(d,exist_ok=True)
def band(w,h,cols,name,fmt='JPEG'):
    im=Image.new('RGB',(w,h)); dr=ImageDraw.Draw(im); n=len(cols)
    for i,c in enumerate(cols): dr.rectangle([i*w//n,0,(i+1)*w//n,h],fill=c)
    dr.ellipse([w*0.08,h*0.1,w*0.18,h*0.1+w*0.1],fill=(255,255,0)); dr.rectangle([w*.45,h*.4,w*.55,h*.6],fill=(255,255,255))
    im.save(f'{d}/{name}',fmt,quality=92)
band(3000,1600,[(200,30,30),(30,30,200)],'hero-red-blue.jpg'); band(900,1200,[(20,160,60)],'mobile-green.jpg')
band(2400,1350,[(240,160,20),(20,160,160),(160,20,160)],'second-hero.jpg'); band(1800,1200,[(90,90,90),(200,200,200)],'third.jpg')
band(6000,4000,[(10,60,120),(120,60,10)],'big-6000.jpg'); band(120,60,[(0,0,0)],'tiny.png','PNG')
open(f'{d}/not-an-image.txt','w').write('hello'); open(f'{d}/fake.jpg','wb').write(b'not really a jpeg at all'*50)
random.seed(1); Image.frombytes('RGB',(3000,3000),random.randbytes(3000*3000*3)).save(f'{d}/huge-noise.png','PNG',compress_level=0)
