from Item import Item
import random

class Temp_Booster(Item):
    def initialize(self, stat, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.rarity = 2
        self.when_use = ['Anytime']
        self.boost = 10 + int(random.random()*50)
        self.duration = (int((random.random()**2)*10))+1
        self.name = '%d turn %dpcnt %s Boost' % (self.duration, self.boost, stat)
        self.setDisc('Adds %d percent to user\'s %s for the next %d hit(s).' 
            % (self.boost, stat, self.duration))
        self.itemtype = 'Temp_Booster'
        def func(mob, dungeon):
            try:
                mob.stats['Effects']['%s Booster' % stat][1] += self.boost
                mob.stats['Effects']['%s Booster' % stat][0] = self.duration
            except KeyError:
                mob.stats['Effects']['%s Booster' % stat] = [1, self.boost]
        self.used = False
        self.usefunc = func

class Attack_Booster(Temp_Booster):
    def __init__(self, dungeon=None):
        self.initialize('Attack', dungeon)

class Luck_Booster(Temp_Booster):
    def __init__(self, dungeon=None):
        self.initialize('Luck', dungeon)

class Accuracy_Booster(Temp_Booster):
    def __init__(self, dungeon=None):
        self.initialize('Accuracy', dungeon)

class Speed_Booster(Temp_Booster):
    def __init__(self, dungeon=None):
        self.initialize('Speed', dungeon)

class Magic_Booster(Temp_Booster):
    def __init__(self, dungeon=None):
        self.initialize('Magic', dungeon)

class Stat_Boost(Item):
    def initialize(self, stat, maxB, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.stat = stat
        self.rarity = 4
        self.when_use = ['Noncombat']
        import random
        self.boost = int(random.random()*maxB)+1
        self.name = '%s Boost %s' % (self.stat, self.boost)
        self.pickupable = False
        self.setDisc('Adds %d to user\'s %s permanently.' % (self.boost, stat))
        self.itemtype = 'Stat_Boost'
        def func(mob, dungeon):
            mob.stats[self.stat] += self.boost
            dungeon.statusbar.addText('%s\'s %s: %s + %s = %s' % (
                mob.name, self.stat, mob.stats[self.stat]-self.boost, self.boost, mob.stats[self.stat]), dungeon)
        self.usefunc = func


class Speed_Boost(Stat_Boost):
    def __init__(self, dungeon=None):
        self.initialize('Speed', 2, dungeon)

class Max_Health_Boost(Stat_Boost):
    def __init__(self, dungeon=None):
        self.initialize('Health', 4, dungeon)

class Power_Boost(Stat_Boost):
    def __init__(self, dungeon=None):
        self.initialize('Power', 2, dungeon)

class Luck_Boost(Stat_Boost):
    def __init__(self, dungeon=None):
        self.initialize('Luck', 5, dungeon)

class Accuracy_Boost(Stat_Boost):
    def __init__(self, dungeon=None):
        self.initialize('Accuracy', 5, dungeon)

class Magic_Boost(Stat_Boost):
    def __init__(self, dungeon=None):
        self.initialize('Magic', 5, dungeon)