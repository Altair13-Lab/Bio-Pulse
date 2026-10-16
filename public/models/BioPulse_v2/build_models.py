from pathlib import Path
import json, csv, hashlib, zipfile
import numpy as np
import manifold3d as md
import trimesh
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
ROOT=Path(__file__).resolve().parent; (ROOT/'STL').mkdir(parents=True,exist_ok=True)
M=md.Manifold
N=64
def box(s,p=(0,0,0)): return M.cube(s).translate(p)
def cyl(r,h,p=(0,0,0),axis='z',n=N):
    a=M.cylinder(h,r,circular_segments=n)
    if axis=='y': a=a.rotate((-90,0,0))
    if axis=='x': a=a.rotate((0,90,0))
    return a.translate(p)
def union(xs):
    a=xs[0]
    for b in xs[1:]: a=a+b
    return a
def cut(a,xs):
    for b in xs: a=a-b
    return a
def tm(s):
    q=s.to_mesh(); return trimesh.Trimesh(vertices=np.array(q.vert_properties)[:,:3],faces=np.array(q.tri_verts),process=True)
parts={}; assembly={}; rows=[]
def save(name,s,pos=(0,0,0),rot=(0,0,0),qty=1,flip=False):
    assert s.status()==md.Error.NoError,(name,s.status())
    a=tm(s); assembly[name]=a.copy(); assembly[name].apply_transform(trimesh.transformations.euler_matrix(*np.radians(rot))); assembly[name].apply_translation(pos)
    if flip: a.apply_transform(trimesh.transformations.rotation_matrix(np.pi,[1,0,0]))
    a.apply_translation(-a.bounds[0]); path=ROOT/'STL'/f'{name}.stl'; a.export(path)
    b=trimesh.load_mesh(path,process=True)
    assert b.is_watertight and b.is_winding_consistent and b.volume>0 and len(b.split())==1,name
    assert np.isfinite(b.vertices).all()
    parts[name]=b
    rows.append(dict(file=path.name,quantity=qty,size_mm=np.round(b.extents,3).tolist(),triangles=len(b.faces),watertight=bool(b.is_watertight),consistent_winding=bool(b.is_winding_consistent),connected_solids=len(b.split()),volume_mm3=round(float(b.volume),2),bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))

def rounded(w,h,r,t,z=0,offset=(0,0)):
    x,y=offset
    return union([box((w-2*r,h,t),(x+r,y,z)),box((w,h-2*r,t),(x,y+r,z))]+[cyl(r,t,(x+a,y+b,z)) for a in [r,w-r] for b in [r,h-r]])
# Assembly axes X=width120, Y=height180, Z=depth80, front Z0
corners=[(10,10),(110,10),(10,170),(110,170)]
trayfix=[(18,30),(102,30),(18,148),(102,148)]
camfix=[(37,102),(83,102),(37,148),(83,148)]
micfix=[(72,8),(98,8),(72,34),(98,34)] # Y,Z
lightfix=[(88,24),(112,24),(88,56),(112,56)] # X,Z
rod=[(26,0),(-13,22.5166604984),(-13,-22.5166604984)]
shieldxy=[(45+x,40-y) for x,y in rod]
shell=rounded(120,180,10,77)-rounded(114,174,7,76,3,(3,3))
shell=union([shell]+[cyl(7.5,14 if y==170 else 74,(x,y,63 if y==170 else 3)) for x,y in corners]+[cyl(5,31,(x,y,3)) for x,y in trayfix]+[cyl(4,4,(x,y,3)) for x,y in camfix]+[cyl(4,4,(3,y,z),axis='x') for y,z in micfix]+[cyl(4,4,(x,173,z),axis='y') for x,z in lightfix])
holes=[cyl(8,5,(60,125,-1))]+[cyl(2.6,5,(x,50,-1)) for x in [46,60,74]]
for x,y in corners:holes +=[cyl(1.7,15,(x,y,64)),cyl(3.35,3,(x,y,74.2),n=6)]
for x,y in trayfix:holes +=[cyl(1.35,13,(x,y,22))]
for x,y in camfix:holes +=[cyl(1.35,4.2,(x,y,3))]
for y,z in micfix:holes +=[cyl(1.35,4.2,(3,y,z),axis='x')]
for x,z in lightfix:holes +=[cyl(1.35,4.2,(x,172.9,z),axis='y')]
# acoustic perforations on left side; top light aperture and bottom ports
holes +=[cyl(1.25,5,(-1,y,z),axis='x') for y in [82,85,88] for z in [18,21,24]]
holes +=[cyl(6,5,(100,176,40),axis='y'),box((16,5,10),(27,-1,43)),cyl(6.2,5,(85,-1,48),axis='y')]
holes +=[cyl(1.7,5,(x,176,z),axis='y') for x,z in shieldxy]+[cyl(3,5,(45,176,40),axis='y')]
for y in [65,71,77,83,89,95,101,107]:
    holes +=[box((5,2,18),(-1,y,48)),box((5,2,18),(116,y,48))]
shell=cut(shell,holes);save('01_main_body_rounded',shell)
cover=rounded(120,180,10,3)
lip=rounded(113.4,173.4,6.7,2,-2,(3.3,3.3))-rounded(109.4,169.4,4.7,4,-3,(5.3,5.3))
lip=cut(lip,[cyl(7.85,4,(x,y,-3)) for x,y in corners]);cover=cover+lip
polefix=[(40,68),(80,68),(40,112),(80,112)]
cover=cut(cover,[cyl(1.7,7,(x,y,-3)) for x,y in corners]+[cyl(2.2,7,(x,y,-3)) for x,y in polefix]);save('02_rear_cover_rounded',cover,(0,0,77),flip=True)
cam=box((54,54,3))-box((42,28,5),(6,13,-1))
cam=union([cam,box((3,28,6),(3,13,2)),box((3,28,6),(48,13,2)),box((42,3,6),(6,10,2)),box((42,3,6),(6,41,2))])
cam=cut(cam,[cyl(1.7,12,(x,y,-1)) for x in [4,50] for y in [4,50]]+[box((5,3,12),(x,y,-1)) for x in [7,42] for y in [5,46]])
save('04_esp32cam_cradle',cam,(33,98,7))
tray=box((96,130,3));tray=union([tray,box((96,2,5),(0,0,2)),box((96,2,5),(0,128,2)),box((2,130,5),(0,0,2)),box((2,130,5),(94,0,2))])
trayholes=[cyl(1.7,10,(x,y,-1)) for x in [6,90] for y in [6,124]]
for x in [12,34,56,78]:
    for y in [20,42,64,86,108]:trayholes +=[box((8,3.2,5),(x,y,-1))]
tray=cut(tray,trayholes);save('05_internal_tray',tray,(12,24,34))
# top holder: X32, localY40 => assembled depth40. Lens faces upwards.
light=box((32,40,3))-box((22,24,5),(5,8,-1))
light=cut(light,[cyl(1.7,5,(x,y,-1)) for x in [4,28] for y in [4,36]]+[box((3,5,5),(x,y,-1)) for x in [3,26] for y in [12,23]])
save('06_bh1750_top_holder',light,(84,173,20),(90,0,0))
mic=box((34,34,3))-cyl(6,5,(17,17,-1))
mic=cut(mic,[cyl(1.7,5,(x,y,-1)) for x in [4,30] for y in [4,30]]+[box((3,8,5),(x,13,-1)) for x in [4,27]])
save('07_microphone_side_holder',mic,(7,68,38),(0,90,0))
# circular screen centered at X45 Z40, three tie rods at R26
base=cyl(36,3)
base=cut(base,[cyl(1.7,5,(x,y,-1)) for x,y in rod]+[cyl(3,5,(0,0,-1))]+[box((3,16,5),(x,-8,-1)) for x in [-20,17,-10,7]])
save('03a_round_shield_base',base,(45,190,40),(-90,0,0))
ring=cyl(40,2)-cyl(17,5,(0,0,-1))
ring=union([ring]+[cyl(4,12,(x,y,1)) for x,y in rod]);ring=cut(ring,[cyl(1.7,16,(x,y,-1)) for x,y in rod])
save('03b_round_shield_louver',ring,(45,193,40),(-90,0,0),qty=4)
cap=cyl(43,3)+cyl(41,3,(0,0,2));cap=cut(cap,[cyl(1.7,8,(x,y,-1)) for x,y in rod]);save('03c_round_shield_cap',cap,(45,245,40),(-90,0,0),flip=True)
spacer=cyl(4,10)-cyl(1.7,12,(0,0,-1));save('03d_shield_spacer_10mm',spacer,qty=3)
# standard 32mm saddle, strap return channels keep both straps accessible
bracket=box((64,72,24))-cyl(16,76,(32,-2,34),axis='y')
bracket=cut(bracket,[box((66,10,2.5),(-1,y,0)) for y in [3,59]]+[cyl(2.2,28,(x,y,-1)) for x in [12,52] for y in [14,58]]+[box((4,12,28),(x,y,-1)) for x in [3,57] for y in [5,55]])
save('08_pole_saddle_32mm',bracket,(28,54,80))
coupon=box((62,32,3));coupon=cut(coupon,[cyl(r,5,(x,10,-1)) for x,r in [(8,1.35),(19,1.6),(30,1.7),(42,2.6),(54,3.35)]]+[cyl(3.35,5,(10,23,-1),n=6)]+[box((16,10,5),(23,19,-1))]);save('09_fit_test_coupon',coupon)
expected={'01_main_body_rounded':[120,180,77],'02_rear_cover_rounded':[120,180,5],'04_esp32cam_cradle':[54,54,8],'05_internal_tray':[96,130,7],'06_bh1750_top_holder':[32,40,3],'07_microphone_side_holder':[34,34,3],'03a_round_shield_base':[72,72,3],'03b_round_shield_louver':[80,80,13],'03c_round_shield_cap':[86,86,5],'03d_shield_spacer_10mm':[8,8,10],'08_pole_saddle_32mm':[64,72,24],'09_fit_test_coupon':[62,32,3]}
for name,p in parts.items():assert np.allclose(p.extents,expected[name],atol=.001),(name,p.extents)
def placed(s,pos,rot=(0,0,0)):
    a=tm(s);a.apply_transform(trimesh.transformations.euler_matrix(*np.radians(rot)));a.apply_translation(pos);return a
for i in range(1,4):assembly[f'louver_{i+1}']=placed(ring,(45,193+13*i,40),(-90,0,0))
for i,(x,z) in enumerate(shieldxy):assembly[f'spacer_{i+1}']=placed(spacer,(x,180,z),(-90,0,0))
assembly.pop('03d_shield_spacer_10mm');assembly.pop('09_fit_test_coupon')
# exact solid intersection of all installed printable components (surface contact is allowed)
collisions=[]
names=list(assembly)
for i,n in enumerate(names):
    for q in names[i+1:]:
        a,b=assembly[n],assembly[q]
        if np.any(a.bounds[1]<b.bounds[0]) or np.any(b.bounds[1]<a.bounds[0]):continue
        ma=M(md.Mesh(np.array(a.vertices,dtype=np.float32),np.array(a.faces,dtype=np.uint32)))
        mb=M(md.Mesh(np.array(b.vertices,dtype=np.float32),np.array(b.faces,dtype=np.uint32)))
        vol=(ma^mb).volume()
        if vol>.02: collisions.append([n,q,round(vol,4)])
assert not collisions,collisions
report={'units':'mm','body_with_closed_cover_mm':[120,180,80], 'axis_order':'width,height,depth', 'design_version':'v2 rounded tall original-description layout','checks':'STL reloaded: closed mesh, coherent winding, positive volume, one connected solid, finite coordinates, nominal bounding box. Boolean solid intersections checked in assembled positions.','physical_test_print_performed':False,'assembly_intersections_mm3':collisions,'parts':rows}
(ROOT/'geometry_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
with (ROOT/'parts.csv').open('w') as f:
    w=csv.writer(f);w.writerow(['STL','Print quantity','X mm','Y mm','Z mm','Triangles','Volume cm3']);
    for r in rows:w.writerow([r['file'],r['quantity'],*r['size_mm'],r['triangles'],round(r['volume_mm3']/1000,2)])
# assembly reference OBJ not for printing
scene=trimesh.Scene(assembly);scene.export(ROOT/'assembly_reference.obj')
(ROOT/'assembly_positions.json').write_text(json.dumps({k:{'bounds_mm':np.round(v.bounds,3).tolist()} for k,v in assembly.items()},indent=2))
from PIL import Image,ImageDraw,ImageFont
from matplotlib import font_manager
font=ImageFont.truetype(font_manager.findfont('DejaVu Sans'),26)
small=ImageFont.truetype(font_manager.findfont('DejaVu Sans'),20)
def raster(meshes,size=(900,900),direction=(.9,.6,-1.5)):
    w,h=size;v=np.array(direction);v=v/np.linalg.norm(v);right=np.cross(v,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,v)
    allverts=np.concatenate([m.vertices for m,c in meshes]);proj=np.column_stack([allverts@right,allverts@up]);lo=proj.min(axis=0);hi=proj.max(axis=0);scale=min((w-80)/(hi[0]-lo[0]),(h-80)/(hi[1]-lo[1]));mid=(hi+lo)/2
    rgb=np.full((h,w,3),248,dtype=np.uint8);depth=np.full((h,w),-np.inf)
    light=np.array([-.4,.9,-1.2]);light/=np.linalg.norm(light)
    for m,col in meshes:
        vs=m.vertices;sx=(vs@right-mid[0])*scale+w/2;sy=-(vs@up-mid[1])*scale+h/2;dz=vs@v
        normals=m.face_normals
        for f,n in zip(m.faces,normals):
            if np.dot(n,v)<-1e-6:continue
            x=sx[f];y=sy[f];z=dz[f];xmin=max(0,int(np.floor(x.min())));xmax=min(w-1,int(np.ceil(x.max())));ymin=max(0,int(np.floor(y.min())));ymax=min(h-1,int(np.ceil(y.max())))
            if xmax<xmin or ymax<ymin:continue
            den=(y[1]-y[2])*(x[0]-x[2])+(x[2]-x[1])*(y[0]-y[2])
            if abs(den)<1e-9:continue
            yy,xx=np.mgrid[ymin:ymax+1,xmin:xmax+1];xx=xx+.5;yy=yy+.5
            a=((y[1]-y[2])*(xx-x[2])+(x[2]-x[1])*(yy-y[2]))/den;b=((y[2]-y[0])*(xx-x[2])+(x[0]-x[2])*(yy-y[2]))/den;c=1-a-b
            d=a*z[0]+b*z[1]+c*z[2];tile=depth[ymin:ymax+1,xmin:xmax+1];mask=(a>=-1e-7)&(b>=-1e-7)&(c>=-1e-7)&(d>tile-1e-7)
            tile[mask]=d[mask];shade=.55+.45*max(0,float(n@light));rgb[ymin:ymax+1,xmin:xmax+1][mask]=(np.array(col)*shade).astype(np.uint8)
    return Image.fromarray(rgb)
colors=[(195,218,232),(182,196,211),(124,175,160),(222,183,121)]
# gray body, blue lid, green shield, tan mounts
items=[]
for k,m in assembly.items():
    color=(238,241,244) if '03' in k or 'louver' in k or 'spacer' in k else (220,230,236) if k.startswith('01') else colors[3] if k.startswith(('04','06','07','08')) else (205,218,227)
    items.append((m,color))
canvas=Image.new('RGB',(1800,1080),'white');canvas.paste(raster(items,(900,940)),(0,100));d=ImageDraw.Draw(canvas);d.text((30,25),'BioPulse — assembled STL geometry',font=font,fill='#263743');d.text((30,64),'Body + cover: 120 × 180 × 80 mm',font=small,fill='#53636f');d.text((940,25),'12 separate STL files',font=font,fill='#263743')
for i,(k,m) in enumerate(parts.items()):
    x=920+(i%3)*290;y=100+(i//3)*235
    # for individual part local Z is print vertical; map to assembly upright Y
    a=m.copy();a.vertices=np.column_stack([m.vertices[:,0],m.vertices[:,2],-m.vertices[:,1]])
    canvas.paste(raster([(a,colors[i%4])],(280,200),(.8,1,-1.1)),(x,y));d.text((x+8,y+199),k.split('_',1)[0],font=small,fill='#263743')
canvas.save(ROOT/'preview.png')
canvas=Image.new('RGB',(1560,1840),'white');d=ImageDraw.Draw(canvas)
for i,(k,m) in enumerate(parts.items()):
    x=(i%3)*520;y=(i//3)*460;a=m.copy();a.vertices=np.column_stack([m.vertices[:,0],m.vertices[:,2],-m.vertices[:,1]])
    canvas.paste(raster([(a,colors[i%4])],(500,365),(.8,1,-1.1)),(x+10,y+75));d.text((x+18,y+10),k,font=small,fill='#263743');d.text((x+18,y+39),' × '.join(f'{v:g}' for v in m.extents)+' mm',font=small,fill='#53636f')
canvas.save(ROOT/'parts_views.png')
