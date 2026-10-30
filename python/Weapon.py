from Item import Item
from Misc_funcs import hilite
from Disps import IDisp
import random
class Weapon(Item):
    
    def equip(self, player, dungeon):
        dungeon.statusbar.addText('%s equipped the %s!' % 
                (player.name, self.name), dungeon)
        player.weapons.append(self)
        player.items.remove(self)
    
    def unequip(self, player, dungeon, keep=True):
        dungeon.statusbar.addText('%s unequipped the %s!' % 
                (player.name, self.name), dungeon)
        player.weapons.remove(self)
        if keep:
            player.items.append(self) 

    def usefunc(self, player, dungeon, when='Noncombat'):

        if self.itemtype == 'Weapon' and player.getMagicAttk() > player.stats['Power']:
            dungeon.statusbar.addText(
                'When attacking with a physical weapon, your attack damage will be based on\nyour ' +
                'physical Attack power, not your Magic Power.', dungeon, waitForResp=True)
            dungeon.statusbar.addText('Your physical attack power would therefor be ' + 
                '%d (+ %d for this weapon\'s bonus).' % (player.stats['Power'], self.stats['Attack']), dungeon, waitForResp=True)
            if player.magicReducer() > 0:
                s = " minus %d" % player.magicReducer()
            else:
                s = ""
            dungeon.statusbar.addText('However, your Magic Attack Power based on your Magic stat(%d)%s.' %
                (player.stats['Magic'], s), dungeon, waitForResp=True)
            inpt = dungeon.statusbar.addYN(dungeon, 'Are you sure you want to equip this?')
            if inpt == 'n':
                return

        if self.stats['Weight']*2 > player.stats['Power']:
            dungeon.statusbar.addText('The %s is too heavy to equip!' % self.name, dungeon)
            dungeon.statusbar.addText('%s\'s weight: %d. Power required to weild: %d x 2 = %d.' % (
                    self.name, self.stats['Weight'], self.stats['Weight'], self.stats['Weight']*2),
                    dungeon)
            dungeon.statusbar.addText('Try again when you have %d power.' % (self.stats['Weight']*2), 
                                      dungeon, waitForResp=True)
            return

        if self in player.weapons:
            self.unequip
        
        elif len(player.weapons)>=player.hands:
            if player.hands == 1:
                player.weapons[0].unequip(player, dungeon)
                self.equip(player, dungeon)
            else:
                if player.unequip(dungeon):
                    self.equip(player, dungeon)
        
        else:
            self.equip(player, dungeon)


    def random_material(self, raritylev):
        chance = (.5-raritylev/10.)
        if random.random() > chance:
            if random.random() > chance:
                if random.random() > chance:
                    if random.random() > chance:
                        if random.random() > chance:
                            return 'Obsidian'
                        else: return 'Magic'
                    else: return 'Lucky'
                else: return 'Steel'
            else: return 'Iron'
        else: return 'Fragile'

    def set_to_material(self, material):

        def addPerc(integer, percent):
            return int(integer + integer*(percent/100))

        if material == 'Fragile':
            self.stats['Attack'] -= 1
            self.stats['Weight'] -= 2
            if self.stats['Weight'] <= 0:
                self.stats['Weight'] = 1
            self.stats['Luck'] += 4
            self.uses = 3

        if material == 'Iron':
            self.uses = 10

        if material == 'Steel':
            self.stats['Attack'] = addPerc(
                self.stats['Attack'], 50)
            self.stats['Weight'] = addPerc(
                self.stats['Weight'], 40)
            self.uses = 20

        if material == 'Lucky':
            self.stats['Attack'] = addPerc(
                self.stats['Attack'], 50)
            self.stats['Luck'] += 30
            self.uses = 8

        if material == 'Magic':
            self.stats['Attack'] = addPerc(
                self.stats['Attack'], 200)
            self.stats['Luck'] += 50
            self.uses = 1

        if material == 'Obsidian':
            self.stats['Attack'] = addPerc(
                self.stats['Attack'], 200)
            self.stats['Weight'] = addPerc(
                self.stats['Weight'], 100)
            self.uses = 35

    def initialize(self, attack, weight, typ, 
        luck=0, material='Random', raritylev=0, dungeon=None):

        self.disp = hilite(IDisp(), '32')

        self.itemtype = 'Weapon'
        self.when_use = ['Anytime']
        self.reuseable = True
        self.used = False

        if material == 'Random':
            material = self.random_material(raritylev)

        self.stats = {}

        self.stats['Weight'] = weight
        self.stats['Attack'] = attack 
        self.stats['Luck'] = luck
        self.typ = typ

        self.set_to_material(material)
        self.name = material + ' ' + self.typ

        self.usesLeft = self.uses
        if random.random() < .3:
            self.usesLeft = int(self.uses*random.random())+1

    def getDisc(self):
        strng = 'Weapon Type: %s\n' % self.typ
        for i in self.stats:
            strng += '%s: %d; ' % (i, self.stats[i])
        strng += '\n-%d Speed and -%d Accuracy when equipped due to weight.' % (self.getSpeedDetr(), self.getAccrDetr())
        strng += '\nPower required to weild: %d x 2 = %d' % (self.stats['Weight'], self.stats['Weight']*2)
        strng += '\nUses: %d/%d' % (self.usesLeft, self.uses)
        return strng

    def brek(self, player, dungeon):
        dungeon.statusbar.addText('The %s broke!' % self.name, dungeon)
        player.weapons.remove(self)

    def getSpeedDetr(self):
        return self.stats['Weight']/2

    def getAccrDetr(self):
        return self.stats['Weight']/2


class Sword(Weapon):
    def __init__(self, dungeon=None):
        
        self.init(dungeon)
        self.itemtype = 'Weapon'
        self.rarity = 3
        zlevel = 0
        if dungeon: 
            zlevel = dungeon.zlevel
        self.initialize(3, 2, 'Sword', 
            luck=3, raritylev=zlevel, dungeon=dungeon)

class Spear(Weapon):
    def __init__(self, dungeon=None):

        self.init(dungeon)
        self.itemtype = 'Weapon'
        self.rarity = 3
        zlevel = 0
        if dungeon: 
            zlevel = dungeon.zlevel
        self.initialize(4, 4, 'Spear',
            luck=1, raritylev=zlevel, dungeon=dungeon)

class Axe(Weapon):
    def __init__(self, dungeon=None):

        self.init(dungeon)
        self.itemtype = 'Weapon'
        self.rarity = 5
        zlevel = 0
        if dungeon: 
            zlevel = dungeon.zlevel
        self.initialize(6, 6, 'Axe', luck=6, 
            raritylev=zlevel, dungeon=dungeon)

