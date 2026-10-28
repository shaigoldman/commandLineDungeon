import pathlib,sys,json
from types import SimpleNamespace
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[2]))
import Classes
from Mob import Mob
result=[]
for c in ['Warrior','Knight','Scout','Mage']:
 for enemy in ['Warrior','Knight','Scout','Mage']:
  for weight in [0,1,2,3,6]:
   a=Mob(None,None);b=Mob(None,None)
   a.stats=getattr(Classes,c)();b.stats=getattr(Classes,enemy)()
   for actor in [a,b]:actor.stats['Effects']={};actor.weapons=[]
   if weight:a.weapons=[SimpleNamespace(stats={'Attack':3,'Luck':3,'Weight':weight})]
   result.append({'className':c,'enemy':enemy,'weight':weight,'stats':dict(a.getAttackStats(usingWeapons=bool(weight))),'hit':a.determineHitRate(b,usingWeapons=bool(weight))})
print(json.dumps(result))
