dat = """7	7	8	070708
51	34	34	332222
119	68	51	774433
204	136	85	cc8855
153	51	17	993311
221	119	17	dd7711
255	221	85	ffdd55
255	255	51	ffff33
85	170	68	55aa44
17	85	34	115522
68	238	187	44eebb
51	136	221	3388dd
85	68	170	5544aa
85	85	119	555577
170	187	187	aabbbb
255	255	255	ffffff
"""

spl = dat.split('\n')
spl = [x.split('\t') for x in spl]
spl = [x for x in spl if len(x) >= 3]
spl = [(int(x[0])/255, int(x[1])/255, int(x[2])/255) for x in spl]
# round to 3 decimal places
spl = [(round(x[0], 3), round(x[1], 3), round(x[2], 3)) for x in spl]
for x in spl:
    print(f'vec3({x[0]}, {x[1]}, {x[2]}),')
