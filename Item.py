import random
import numpy as np
from Instance import Instance, Empty
import Classes
from Misc_funcs import *

class Item(Instance):
    #'Never', 'Anytime', 'During Combat', 'Noncombat', 'When Fleeing', 'As Weapon'

    def __init__(self, dungeon=None):
        self.init()

    def init(self, dungeon=None):
        self.disp = hilite(IDisp(), '32')
        self.hide()
        self.opaque = False
        self.standingon = Empty()
        self.reuseable = False
        self.ID = 5
        self.used = False
        self.disc = '???'
        self.itemtype = 'Basic'
        self.pickupable = True
        self.isProperName = False
        
        if dungeon == None:
            return
            
        openspaces = np.asarray(np.where(dungeon.getIDs() == 0))
        index = np.random.randint(openspaces.shape[1])
        self.x = openspaces[1, index]
        self.y = openspaces[0, index]


    def use(self, mob, dungeon, when):
        if not (when in self.when_use) and not ('Anytime' in self.when_use):
            dungeon.statusbar.addText(('%s can\'t use that item now!') 
                % mob.name, dungeon)
            return
        if self.itemtype != 'Weapon' and self.itemtype != 'Tome':
            dungeon.statusbar.addText(('%s used the %s!')
                % (mob.name, self.name), dungeon)
        self.usefunc(mob, dungeon)
        if not self.pickupable:
            dungeon.statusbar.endSegment(dungeon, printCont=False, includeArrows=False, specificLetter='K')
        if not self.reuseable:
            self.used = True
        dungeon.disp()

    def usefunc(self, mob=None, dungeon=None):
        pass

    def setDisc(self, text):
        if not self.pickupable:
            self.disc = text + '\nUsable: Auto Use'
            return
        self.disc = text + '\nUsable: '
        for i in range(0, len(self.when_use)):
            self.disc += self.when_use[i]
            if i < len(self.when_use) - 1:
                self.disc += ' OR '

    def getDisc(self):
        return self.disc

    def printDisc(self, dungeon):
        dungeon.statusbar.addText('%s%s:%s\n%s' % (color.BOLD, self.name, color.END, self.getDisc()), dungeon)

    def drop(self, mob, dungeon, waitForResp=False):
        if self in mob.weapons:
            self.unequip(mob, dungeon, keep=False)
        elif 'items' in vars(mob):
            mob.items.remove(self)
        else:
            mob.item = None
            
        dungeon.statusbar.addText('%s dropped the %s!' % 
            (mob.name, self.name), dungeon, waitForResp=waitForResp)
        dungeon.statusbar.addBreak(dungeon)

class Key(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.when_use = ['Unlocking']
        self.itemtype = 'Key'
        self.rarity = 100
        self.reuseable = False
        self.setDisc('Unlocks locked pathways.')
        self.name = 'Key'


class Health_Potion(Item):
    HPboost = 0

    def initialize(self, dungeon, HPboost):
        self.init(dungeon)
        self.HPboost = HPboost
        self.when_use = ['Anytime']
        self.setDisc('Heals %d health upon usage.' % HPboost)
        self.reuseable = False
        def func(mob, dungeon):
            mob.gainHealth(self.HPboost, dungeon)
        self.usefunc = func
        self.itemtype = 'Health_Potion'

class Tiny_Health_Potion(Health_Potion):
    def __init__(self, dungeon=None):
        self.initialize(dungeon, 5)
        self.name = 'Tiny Health Potion'
        self.rarity = 1

class Small_Health_Potion(Health_Potion):
    def __init__(self, dungeon=None):
        self.initialize(dungeon, 10)
        self.name = 'Small Health Potion'
        self.rarity = 1

class Medium_Health_Potion(Health_Potion):
    def __init__(self, dungeon=None):
        self.initialize(dungeon, 15)
        self.name = 'Medium Health Potion'
        self.rarity = 3

class Large_Health_Potion(Health_Potion):
    def __init__(self, dungeon=None):
        self.initialize(dungeon, 30)
        self.name = 'Large Health Potion'
        self.rarity = 7

class Huge_Health_Potion(Health_Potion):
    def __init__(self, dungeon=None):
        self.initialize(dungeon, 50)
        self.name = 'Huge Health Potion'
        self.rarity = 8

class Giant_Health_Potion(Health_Potion):
    def __init__(self, dungeon=None):
        self.initialize(dungeon, 100)
        self.name = 'Giant Health Potion'
        self.rarity = 9

class Poison_Antidote(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'Poison Antidote'
        self.rarity = 3
        self.when_use = ['Anytime']
        self.setDisc('Heals the user from poison effects.')
        self.itemtype = 'Basic'
        def func(mob, dungeon):
            if 'Poison' in mob.stats['Effects']:
                del mob.stats['Effects']['Poison']
                dungeon.statusbar.addText(('%s was cured of poison!' % 
                    mob.name), dungeon)
            else:
                dungeon.statusbar.addText(('%s was not poisoned!' %
                    mob.name), dungeon)
        self.usefunc = func

class Escape_Rope(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'Escape Rope'
        self.rarity = 3
        self.when_use = ['When Fleeing']
        self.setDisc('Ensures escape when fleeing from a monster.')
        self.itemtype = 'Escape Rope'
        def func(mob, dungeon):
            dungeon.statusbar.addText(('%s escaped!' % 
                mob.name), dungeon)
        self.usefunc = func


class Projectile(Item):
    def initialize(self, dmg, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.when_use = ['During Combat', 'When Fleeing']
        self.dmg = dmg
        self.setDisc('Deals %d direct damage to an enemy.' % self.dmg)
        self.itemtype = 'Projectile'
        def func(mob, dungeon):
            dungeon.statusbar.addText(
                '%s threw the %s!' % (mob.name, self.name), dungeon)
            if (mob.fighting.stats['Class'] != 'Dragon' or random.random() < .5) or (self.dmg <= 10 and random.random() > .33):
                mob.fighting.takeDamage(dmg, dungeon)
            else:
                dungeon.statusbar.addText(
                    '%s dodged the %s!' % (mob.fighting.name, self.name), waitForResp=True)
        self.usefunc = func

class Throwing_Knife(Projectile):
    def __init__(self, dungeon=None):
        self.name = 'Throwing Knife'
        self.rarity = 2
        self.initialize(5, dungeon=dungeon)

class Javelin(Projectile):
    def __init__(self, dungeon=None):
        self.name = 'Javelin'
        self.rarity = 4
        self.initialize(10, dungeon=dungeon)

class Bomb(Projectile):
    def __init__(self, dungeon=None):
        self.name = 'Bomb'
        self.rarity = 9
        self.initialize(20, dungeon=dungeon)

class Ballistic_Missile(Projectile):
    def __init__(self, dungeon=None):
        self.name = 'Ballistic Missile'
        self.rarity = 10
        self.initialize(100, dungeon=dungeon)


class Armor(Item):
    def initialize(self, armr, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.when_use = ['Anytime']
        self.armr = armr
        if not '???' in self.name:
            self.pickupable = False
        self.setDisc('Adds %d to your armor protection.' % self.armr)
        if '???' in self.name:
            self.setDisc('Adds ??? to your armor protection.')
            self.itemtype = 'Basic'

        def func(mob, dungeon):
            dungeon.statusbar.addText(
                '%s put on some %s!' % (mob.name, self.name), dungeon)
            if 'Armor' in mob.stats:
                mob.stats['Armor'] += armr
            else:
                mob.stats['Armor'] = armr
            dungeon.statusbar.addText(
                    '%s\'s armor: %d + %d = %d.' % (mob.name, mob.stats['Armor']-armr,
                    armr, mob.stats['Armor']), dungeon, waitForResp=True)
        self.usefunc = func
            

    def init_rusty(self, dungeon=None):
        self.name = 'Rusty Armor'
        self.initialize(1, dungeon=dungeon)

    def init_iron(self, dungeon=None):
        self.name = 'Iron Armor'
        self.initialize(3, dungeon=dungeon)

    def init_diamond(self, dungeon=None):
        self.name = 'Diamond Armor'
        self.initialize(15, dungeon=dungeon)

    def init_terrible(self, dungeon=None):
        self.name = '??? Armor'
        self.initialize(-1, dungeon=dungeon)

    def __init__(self, dungeon=None):
    	self.rarity=4
        if random.random() > .7:
            if random.random() > .9:
                if random.random() > .5:
                    self.init_diamond(dungeon)
                else:
                    self.init_terrible(dungeon)
            else:
                self.init_iron(dungeon)
        else:
            self.init_rusty(dungeon)

class Golem_Armor(Armor):
    def __init__(self, dungeon=None):
        self.name = 'Iron Armor'
        self.rarity = 10
        self.initialize(10, dungeon=dungeon)

class Nuke(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.when_use = ['Noncombat']
        self.setDisc('Use it and see.')
        self.rarity = 11
        self.name = 'Nuke'
        self.itemtype = 'Nuke'
        def func(player, dungeon):
            dungeon.statusbar.addText(
                'Nuked the world!', dungeon)
            while len(dungeon.Ms)>0:
                for i in dungeon.Ms:
                    i.die(player, dungeon, source='Nuke')
            if 'Nuke Shield' in player.stats['Effects'] and player.stats['Effects']['Nuke Shield']:
                dungeon.statusbar.addText('Your nuke shield saved you from the blast!', dungeon)
                dungeon.statusbar.addText('Your nuke shield was destroyed.', dungeon)
                del player.stats['Effects']['Nuke Shield']
                return
            player.die(dungeon)

        self.usefunc = func

class Nuke_Shield(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.when_use = ['Noncombat']
        self.setDisc('???')
        self.rarity = 9
        self.name = 'Nuke Shield'
        self.itemtype = 'Shield'
        def func(player, dungeon):
            player.stats['Effects']['Nuke Shield'] = True

        self.usefunc = func


from Boosters import *


class Teleporter(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = True
        self.name = 'Teleporter'
        self.rarity = 5
        self.when_use = ['Noncombat']
        self.boost = 20
        self.setDisc('Teleports you to a random open spot in the dungeon.')
        self.itemtype = 'Basic'
        self.used = False

        def func(mob, dungeon):
            mob.assignRandomXY(dungeon)
            dungeon.statusbar.addText(('%s teleported!' %
                mob.name), dungeon)
            dungeon.revMatrix = dungeon.getRevMatrix()
        self.usefunc = func


class Night_Vision_Goggles(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'Night Vision Goggles'
        self.rarity = 8
        self.when_use = ['Noncombat']
        self.setDisc('Gives you the power to see in the darkness.')
        self.itemtype = 'Basic'

        def func(player, dungeon):
            dungeon.revMask[:] = 1
    
        self.usefunc = func


class Binoculars(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'Binoculars'
        self.rarity = 6
        self.when_use = ['Noncombat']
        self.pickupable = False
        self.setDisc('Increases sight range.')
        self.itemtype = 'Basic'

        def func(player, dungeon):
            player.sightrange += 1
            dungeon.revMatrix = dungeon.getRevMatrix()

        self.usefunc = func
        


class Mana_Potion(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'Mana Potion'
        self.rarity = 2
        self.when_use = ['Anytime']
        self.setDisc('Restores player\'s mana fully.')
        self.itemtype = 'Basic'

        def func(player, dungeon):
            if 'Mana' in player.stats:
                player.stats['Mana'] = player.getMana()
                dungeon.statusbar.addText('Mana restored!', dungeon)
            else:
                dungeon.statusbar.addText(('%s has no magic tomes!' %
                player.name), dungeon)
        self.usefunc = func

class Hand(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'Extra Hand'
        self.when_use = ['Noncombat']
        self.rarity = 4
        self.pickupable = False
        self.setDisc('Gives you +1 hands.')
        self.itemtype = 'Basic'

        def func(player, dungeon):
            player.hands += 1
            dungeon.statusbar.addText('%s grew another hand!' % (player.name), dungeon)

        self.usefunc = func

class Bag(Item):
    def initialize(self, size, name, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = '%s Bag' % name
        self.when_use = ['Noncombat']
        self.size = size
        self.pickupable = False
        self.setDisc('Can hold %d inventory items.' % self.size)
        self.itemtype = 'Basic'

        def func(player, dungeon):
            if player.inventorysize <= self.size:
                player.inventorysize = self.size
                dungeon.statusbar.addText('%s can now hold up to %d items!' % (player.name, self.size), dungeon)
            else:
                dungeon.statusbar.addText('%s already had a larger inventory size!' % player.name, dungeon)

        self.usefunc = func
        


class Bigger_Bag(Bag):
    def __init__(self, dungeon=None):
        self.initialize(8, 'Bigger', dungeon)
        self.rarity = 4


class Huge_Bag(Bag):
    def __init__(self, dungeon=None):
        self.initialize(10, 'Huge', dungeon)
        self.rarity = 8


from Weapon import *
from Tome import *


def itemList():
    items = [Max_Health_Boost, Speed_Boost, Power_Boost, Luck_Boost, Accuracy_Boost, Magic_Boost,
        Luck_Booster, Accuracy_Booster, Attack_Booster, Speed_Booster, 
        Poison_Antidote, Teleporter, Night_Vision_Goggles, Binoculars, Escape_Rope,
        Bigger_Bag, Huge_Bag,
        Tiny_Health_Potion, Medium_Health_Potion, Large_Health_Potion, 
        Huge_Health_Potion, Giant_Health_Potion,
        Mana_Potion,
        Throwing_Knife, Javelin, Bomb, Ballistic_Missile, 
        Nuke, Nuke_Shield,
        Sword, Spear, Axe, 
        Magic_Staff,
        Armor,
        Hand]
    return items


def rarityItems():
    maximum = max([i().rarity for i in itemList()])
    raritieditems = [[] for i in range(maximum)]
    for i in itemList():
        for j in range(maximum-i().rarity+1):
            raritieditems[maximum-j-1].append(i)
    return raritieditems


def randItem(zlevel=0):
    #return Nuke
    if zlevel == 50:
        return random.choice([Water_Tome, Fire_Tome])

    maxrar = max([i().rarity for i in itemList()])
    rars = []
    for i in range(maxrar):
        maxer = int(abs((zlevel*2)-i) ** 2)
        if maxer > 100:
            maxer = 99
        for j in range(0, 100 - maxer):
            rars.append(i)

    #return random.choice([Mystery_Tome, Mana_Potion])

    return random.choice(rarityItems()[random.choice(rars)])


# def randItem(zlevel=0):
#     return Throwing_Knife
#     raritieditems = []
#     for i in itemList():

#         for j in range(0, 100 - (abs(zlevel-i().rarity) ** 2)):
#             raritieditems.append(i)

#     if random.random() > .20:
#         return random.choice(raritieditems)
#     return None
