"""Execute original source methods with a silent terminal adapter; never edit Python."""
import sys, pathlib, unittest, json
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[2]))
import Classes
from Mob import Mob
from Monster import Monster
class OriginalTests(unittest.TestCase):
 def actor(self, cls):
  a=Mob(None,None); a.stats=cls(); a.stats['Effects']={}; a.weapons=[]; return a
 def test_classes(self):
  self.assertEqual(Classes.Warrior()['Power'],12)
  self.assertEqual(Classes.Knight()['Armor'],1)
  self.assertEqual(Classes.Scout()['Speed'],12)
  self.assertEqual(Classes.Mage()['Magic'],10)
 def test_hit_formula(self):
  a=self.actor(Classes.Warrior); b=self.actor(Classes.Scout)
  self.assertAlmostEqual(a.determineHitRate(b),73.6)
  a.stats['Accuracy']=1
  self.assertEqual(a.determineHitRate(b),40)
 def test_mana_and_magic(self):
  a=self.actor(Classes.Mage)
  self.assertEqual(a.getMana(),10)
  self.assertEqual(a.getMagicAttk(),10)
 def test_experience(self):
  a=Monster(None,None); a.stats={'Level':4,'EXP Reward':10}; b=self.actor(Classes.Mage); b.stats['Level']=1
  self.assertEqual(a.get_EXP_Reward(b),80)
  b.stats['Level']=7
  self.assertEqual(a.get_EXP_Reward(b),4)
 def test_booster_consumption(self):
  a=self.actor(Classes.Warrior); a.stats['Effects']['Attack Booster']=[1,25]
  self.assertEqual(a.getAttackStats()['Attack'],15)
  self.assertNotIn('Attack Booster',a.stats['Effects'])
 def test_weight_formula(self):
  from types import SimpleNamespace
  a=self.actor(Classes.Warrior); a.weapons=[SimpleNamespace(stats={'Attack':3,'Luck':3,'Weight':3})]
  s=a.getAttackStats(usingWeapons=True)
  self.assertEqual(s['Attack'],15); self.assertEqual(s['Accuracy'],79)
  self.assertEqual(s['Speed'],1.5)
if __name__=='__main__':unittest.main()
