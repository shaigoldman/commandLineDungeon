import random
import numpy as np
import math
import sys
import os
import Instance
import Classes
from Mob import Mob
from Misc_funcs import *

class Monster(Mob):

    fight = None #method do be defined for certain monsters

    def initialize(self, dungeon, stats, EXPmult=1, 
        level=1, disp='M', putInDungeon=True):

        if not putInDungeon and dungeon:
            dungeon = None

        self.init(dungeon)

        self.stats=stats
        self.item = None

        self.stats['Effects'] = {}
        self.health = self.stats['Health']

        self.disp = hilite(disp, '31')
        self.ID = 4
        self.uniqueID = int(random.random()*100000000)

        self.stats['Level'] = level
        if self.stats['Level'] <= 0:
            self.stats['Level'] = 1

        self.stats['EXP Reward'] = EXPmult * 10
        self.mysteryrange = int(random.random()*3)

        self.weapon = None

        self.shownstats = {}
        for i in self.getActualStatKeys():
            rand = random.random() * self.mysteryrange
            if random.random()<.5:
                rand *= -1
            self.shownstats[i] = int(rand)
        self.shownstats['Attack'] = self.shownstats['Power']

        self.canmove = True


    def die(self, player, dungeon, source='Normal'):
        self.alive = False
        text = ''
        if not ',' in self.name:
            text += 'The'
        if source == 'Deal':
            dungeon.statusbar.addText('%s left the dungeon.' % (self.name), dungeon)
        else:
            dungeon.statusbar.addText('%s %s died!' % (text, self.name), dungeon)

        if source == 'Normal':
            reward = self.get_EXP_Reward(player)
            dungeon.statusbar.addText('%s got %d EXP!' % (player.name, reward), dungeon)
            dungeon.statusbar.endSegment(dungeon, False)
            player.stats['EXP'] += reward
            player.score += reward

            if player.stats['EXP'] >= 100:
                player.levelUp(dungeon) 
        try:
            dungeon.Ms.remove(self)
            #print dungeon.Ms
            #print 'removed'
        except ValueError:
            print 'ahh'
            uniqueIDs = [m.uniqueID for m in dungeon.Ms]
            print self.uniqueID
            for m in dungeon.Ms:
                print m.name, m.uniqueID
            try:
                dungeon.Ms.remove(dungeon.Ms[uniqueIDs.index(self.uniqueID)])
            except Exception:
                pass

        if not source == 'Deal':
            from Item import *
            if self.item:
                item = self.item
                if item.itemtype == 'Key':
                    player.score += 100
                player.pickUpItem(item, dungeon, 
                    source='monster', monname=self.name)
            else:
                item = randItem(dungeon.zlevel+player.stats['Luck']*.01)
                if item:
                    dungeon.statusbar.addBreak(dungeon)
                    player.pickUpItem(item(), dungeon, 
                        source='monster', monname=self.name)

        dungeon.setInst(self.x, self.y, self.standingon)
        dungeon.statusbar.addBreak(dungeon)

    def get_EXP_Reward(self, player):
        if self.stats['Level'] >= player.stats['Level']:
            reward = 2 * (self.stats['EXP Reward'] * (self.stats['Level']-player.stats['Level']+1))
        else:
            reward = math.ceil(self.stats['EXP Reward'] * (1./(player.stats['Level']-self.stats['Level'])))
        return reward

    def statsRandomizer(self):
        multiplier = 2
        if random.random()<.5:
            multiplier *= -1
        rand = random.random()
        if  rand > .8:
            multiplier += ((rand * 10) - 8) * 2
        for i in self.stats:
            if type(self.stats[i]) == int and i != 'Level' and i != 'EXP Reward' and self.stats[i] != 0:
                self.stats[i] += int(random.random() * multiplier)

    def adjustStatsToDifficulty(self, difficulty):
        for d in range(difficulty):
            list = ['Health', 'Power', 'Accuracy', 'Speed']
            for stat in list:
                self.stats[stat] = int(self.stats[stat]*1.3)
            if 'Poison' in self.stats:
                self.stats['Poison'][1] += self.stats['Poison'][1]/2 + 1

    def initiateAttack(self, player, dungeon):

        if self.pacible:
            return

        if self.stats['Level'] > player.stats['Level'] and random.random() > (dungeon.monAttkRate * (1.1*dungeon.zlevel)):
            return

        if random.random() > .6:
            return

        dungeon.disp()

        dungeon.statusbar.addText('Level %d %s attacked you!' 
            %(self.stats['Level'], self.name), dungeon)
        player.fighting = self
        dungeon.disp()
        
        fleed = player.flee(self, dungeon)
        if fleed:
            return
        monsterFirst = self.willAttackFirst(player, dungeon)
        #fight
        if monsterFirst:
            self.fight(player, dungeon)
        if not player.alive:
            return
        else:
            player.attack(self, dungeon)
            if not self.alive:
                player.fighting = None
                return
            if not monsterFirst:
                self.fight(player, dungeon)
            if not player.alive:
                return
        dungeon.statusbar.addBreak(dungeon)
        player.fight(self, dungeon.statusbar, dungeon)

    def action(self, dungeon):

        if self.health <= 0:
            try:
                self.die(dungeon)
            except TypeError:
                self.die(dungeon.P, dungeon)

        direction = random.choice(['left', 'right', 'up', 'down', 'none'])
        moved = False
        if self.canmove:
            moved = self.move(direction, dungeon)
        if moved:
            return
        if self.checkDirection(direction, 3, dungeon) == 'up':
            self.initiateAttack(dungeon.dung[self.y-1, self.x], dungeon)
        elif self.checkDirection(direction, 3, dungeon) == 'down':
            self.initiateAttack(dungeon.dung[self.y+1, self.x], dungeon)
        elif self.checkDirection(direction, 3, dungeon) == 'right':
            self.initiateAttack(dungeon.dung[self.y, self.x+1], dungeon)
        elif self.checkDirection(direction, 3, dungeon) == 'left':
            self.initiateAttack(dungeon.dung[self.y, self.x-1], dungeon) 
             


class Zombie(Monster):
    
    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.name = 'Zombie'

        disp = ZDisp(level)

        self.initialize(dungeon, Classes.Zombie(), 
            EXPmult=1, level=level, disp = disp)

        self.stats['Health'] += 4.5 * self.stats['Level']
        self.stats['Power'] += 6 * (self.stats['Level']*.7)
        self.stats['Accuracy'] += (5 * self.stats['Level'])
        self.stats['Speed'] += self.stats['Level']/3

        self.statsRandomizer()
        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)
            self.health = self.stats['Health']

    def fight(self, enemy, dungeon):
        self.attack(enemy, dungeon)


class Spider(Monster):

    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.name = 'Spider'

        disp = SDisp(level)

        self.initialize(dungeon, Classes.Spider(),
            EXPmult=1 , level=level, disp = disp)

        self.stats['Health'] += 5.3 * self.stats['Level']
        self.stats['Power'] += 2.2 * self.stats['Level']
        self.stats['Accuracy'] += (5 * self.stats['Level'] ** .7)
        self.stats['Speed'] += 4 * self.stats['Level']

        self.statsRandomizer()
        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)
            self.health = self.stats['Health']


    def fight(self, enemy, dungeon):
        self.attack(enemy, dungeon)


class Snake(Monster):

    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.name = 'Snake'

        disp = NDisp(level)

        self.initialize(dungeon, Classes.Snake(), 
            EXPmult=1, level=level, disp = disp)

        self.stats['Health'] += 6 * self.stats['Level']
        self.stats['Power'] += 4 * self.stats['Level']
        self.stats['Accuracy'] += (5 * self.stats['Level'] ** .7)
        self.stats['Speed'] += 2 * self.stats['Level']
        #first is how long, second is amount of damge
        rand = int(random.random()*3)-1
        self.stats['Poison'] = [int(self.stats['Level']),
            int(self.stats['Level']**.5) + rand]
        if self.stats['Poison'][1] <= 0:
            self.stats['Poison'][1] = 1


        self.statsRandomizer()
        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)
            self.health = self.stats['Health']


    def fight(self, enemy, dungeon):
        hit = self.attack(enemy, dungeon)
        if hit:
            enemy.getPoison(self.stats['Poison'], dungeon)

class Parasite(Monster):

    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.name = 'Parasite'

        disp = ParDisp(level)

        self.initialize(dungeon, Classes.Parasite(), 
            EXPmult=1, level=level, disp = disp)

        self.stats['Health'] += 7 * self.stats['Level']
        self.stats['Power'] += 3 * self.stats['Level']
        self.stats['Accuracy'] += (2 * self.stats['Level'] ** .7)
        self.stats['Speed'] += 1.5 * self.stats['Level']
        #first is how long, second is amount of damge
        rand = int(random.random()*3)-1
        self.stats['Poison'] = [self.stats['Level'], (self.stats['Level']/2)+1]

        self.blood_drain = True

        self.statsRandomizer()
        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)
            self.health = self.stats['Health']


    def fight(self, enemy, dungeon):
        hit = self.attack(enemy, dungeon)
        if hit:
            enemy.getPoison(self.stats['Poison'], dungeon)

class Golem(Monster):

    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.name = 'Golem'

        disp = GolDisp(level)

        self.initialize(dungeon, Classes.Golem(), 
            EXPmult=1, level=level, disp=disp)

        self.stats['Health'] += 7 * self.stats['Level']
        self.stats['Power'] += 4 * self.stats['Level']
        self.stats['Accuracy'] += (4 * self.stats['Level'] ** .8)
        self.stats['Speed'] += 1.8 * self.stats['Level']
        self.stats['Armor'] += 2 * self.stats['Level']
        #first is how long, second is amount of damge
        rand = int(random.random()*3)-1

        self.statsRandomizer()
        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)
            self.health = self.stats['Health']


    def fight(self, enemy, dungeon):
        hit = self.attack(enemy, dungeon)

class Dragon(Monster):

    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.name = 'Snake'

        disp = DDisp()

        self.initialize(dungeon, Classes.Dragon(), 
            EXPmult=1, level=level, disp=disp)

        for stat in ['Health', 'Power', 'Accuracy', 'Speed']:
            self.stats[stat] *= (self.stats['Level']/10) - 1

        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)

        self.health = self.stats['Health']
        self.mysteryrange = 0




    def fight(self, enemy, dungeon):
        self.attack(enemy, dungeon)

