from Item import Item
from Misc_funcs import *
from Misc_funcs import hilite
from Disps import IDisp
import numpy as np, random


class Tome(Item):

    def initialize(self, attack, affn,
                   luck=0, dungeon=None):

        self.init(dungeon)

        self.itemtype = 'Tome'
        self.when_use = ['Anytime']
        self.reuseable = True
        self.used = False
        self.disp = hilite(IDisp(), '32')

        self.stats = {}

        self.stats['Attack'] = attack
        self.stats['Luck'] = luck
        self.affn = affn

        self.spells = []

        self.stats['Weight'] = 0

        self.name = self.affn + ' ' + 'Staff'

    def usefunc(self, player, dungeon):

        if self in player.weapons:
            dungeon.statusbar.addText('%s unequipped the %s!' %
                                      (player.name, self.name), dungeon)
            player.weapons.remove(self)
            player.items.append(self)

        else:
            dungeon.statusbar.addText('%s equipped the %s!' %
                                      (player.name, self.name), dungeon)
            if not 'Mana' in player.stats:
                player.stats['Mana'] = player.getMana()
            player.weapons.append(self)
            player.items.remove(self)

    def getDisc(self):
        strng = 'This is a Magic Staff. \nEquip it to cast spells for special effects, or to attack the enemy. \nPress \'m\' any time to use spells.\n'
        strng += 'Affinity: %s\n' % self.affn
        for i in self.stats:
            if i != 'Weight':
                strng += '%s: %d; ' % (i, self.stats[i])
        return strng

    def printSpells(self, dungeon, statusbar=None, P=None):
        for i in self.spells:
            if statusbar:
                statusbar.addBreak(dungeon)
                statusbar.addText('\n' + i.getDisc(P))
                statusbar.endSegment(dungeon, False)

            else:
                dungeon.statusbar.addBreak(dungeon)
                dungeon.statusbar.addText('\n' + i.getDisc(dungeon.P), dungeon)
                dungeon.statusbar.endSegment(dungeon, False)

    def printDisc(self, dungeon, statusbar=None):
        if statusbar:
            statusbar.addText('%s:\n%s' %
                              (self.name, self.getDisc()), dungeon)
            return
        dungeon.statusbar.addText('%s:\n%s' %
                                  (self.name, self.getDisc()), dungeon)

    def getAvailableSpells(self, player, when=None):
        available_spells = []
        for spell in self.spells:
            if (
                    (spell.when_use == when or spell.when_use == 'Anytime' or when == None or when == 'Anytime')
                    and spell.magicReq <= player.getCombStat('Magic')
                    and spell.getCost(player) <= player.stats['Mana']):
                available_spells.append(spell)
        return available_spells

    def viewSpells(self, player, when, dungeon):
        available_spells = self.getAvailableSpells(player, when)
        if not available_spells:
            dungeon.statusbar.addText('%s doesn\'t have enough mana to cast a spell!' % player.name, dungeon)
            return None
        letters = 'abcdef'
        while 1:
            i = 0
            for i in range(len(available_spells)):
                dungeon.statusbar.addText('%s] %s (Cost=%d Mana)' % (
                letters[i], available_spells[i].name, available_spells[i].getCost(player))
                                          , dungeon)
            dungeon.statusbar.addText(letters[i + 1] + '] None'
                                      , dungeon)

            inpt = dungeon.statusbar.addQuery('Choose a spell.')
            if inpt not in letters[:len(available_spells)]:
                return None
            else:
                break
        dungeon.statusbar.addBreak(dungeon)
        return available_spells[letters.index(inpt)]

    def getSpeedDetr(self):
        return 0

    def getAccrDetr(self):
        return 0

    def getCost(self, caster):
        return 3


class Spell(object):
    def __init__(self, name=None, when_use=None, cost=None,
                 magicReq=None, usefunc=None, disc='???'):
        self.name = name
        self.when_use = when_use
        self.magicReq = magicReq
        self.cost = cost
        self.usefunc = usefunc
        self.disc = disc

    def getCost(self, caster):
        return self.cost

    def cast(self, dungeon, caster=None, enemy=None):
        dungeon.statusbar.addText('%s cast %s!' % (caster.name, self.name), dungeon)
        if self.when_use == 'During Combat':
            self.usefunc(caster, dungeon, enemy)
        else:
            self.usefunc(caster, dungeon)
        dungeon.disp()
        caster.stats['Mana'] -= self.cost

        dungeon.statusbar.addText('%s\'s mana: %d/%d' %
                                  (caster.name, caster.stats['Mana'], caster.getMana()), dungeon)

    def getDisc(self, caster=None, includeName=True):
        strng = ''
        if includeName:
            strng += color.BOLD + self.name + ':\n' + color.END
        strng += self.disc
        strng += '\nMana Cost: %d' % self.getCost(caster)
        strng += '\nMagic Level Required: %d' % self.magicReq
        return strng


class Wind_Tome(Tome):
    def __init__(self, dungeon=None):
        self.initialize(attack=5, affn='Wind', luck=3, dungeon=dungeon)
        self.rarity = 4
        self.inity()

    def inity(self):
        def Teleport(player, dungeon):
            player.assignRandomXY(dungeon)
            dungeon.revMatrix = dungeon.getRevMatrix()
            dungeon.statusbar.addText(('%s teleported!' %
                                       player.name), dungeon)

        Teleport = Spell(name='Teleport', when_use='Noncombat', cost=1, magicReq=1,
                         usefunc=Teleport, disc='Teleports the caster to a random position in the Dungeon.')

        def Gust(player, dungeon, enemy):
            enemy.takeDamage(10, dungeon)

        Gust = Spell(name='Gust', when_use='During Combat', cost=5, magicReq=8,
                     usefunc=Gust, disc='Deals 10 direct damage to enemy.')

        def Healing_Winds(player, dungeon=None, enemy=None):
            player.gainHealth(player.stats['Health']/2, dungeon)
            player.stats['Effects'] = {}
            dungeon.statusbar.addText('Status effects healed!', dungeon)

        Healing_Winds = Spell(name='Healing Winds', when_use='Anytime', cost=8, magicReq=15,
                              usefunc=Healing_Winds, disc='Heals for half your hp and clears status effects.')

        self.spells = [Teleport, Gust, Healing_Winds]


class Fire_Tome(Tome):
    def __init__(self, dungeon=None):
        self.initialize(attack=6, affn='Fire', luck=10, dungeon=dungeon)
        self.rarity = 5

        self.inity()

    def inity(self):

        def Light(player, dungeon):
            x = int(random.random() * dungeon.legnth)
            y = int(random.random() * dungeon.height)
            for i in range(dungeon.revMask.shape[0]):
                for j in range(dungeon.revMask.shape[1]):
                    xdif = abs(j - x)
                    ydif = abs(i - y)
                    if ((xdif / 2) + ydif < player.sightrange):
                        dungeon.revMask[i, j] = 1
            dungeon.statusbar.addText('A permanent light was brought onto the room!')

        Light = Spell(name='Light', when_use='Noncombat', cost=1, magicReq=1,
                      usefunc=Light, disc='Lights up a portion of the room.')

        def Burn(player, dungeon, enemy):
            maxi = 40
            dmg = player.stats['Magic']
            if dmg > maxi:
                dmg = maxi
            enemy.takeDamage(dmg, dungeon)

        Burn = Spell(name='Burn', when_use='During Combat', cost=7, magicReq=10,
                     usefunc=Burn, disc='Deals direct damage equal to your Magic power (up to %d max damage).' % 40)

        def Annihilate(player, dungeon, enemy):
            if enemy.stats['Class'] == 'Dragon':
                dungeon.statusbar.addText("The spell was countered!")
                enemy.takeDamage(0)
            dmg = enemy.health
            enemy.takeDamage(dmg, dungeon)

        Annihilate = Spell(name='Annihilate', when_use='During Combat', cost=10, magicReq=80,
                     usefunc=Annihilate, disc='Kills enemy.')


        self.spells = [Light, Burn, Annihilate]


class Water_Tome(Tome):
    def __init__(self, dungeon=None):
        self.initialize(attack=4, affn='Water', luck=5, dungeon=dungeon)
        self.rarity = 4

        self.inity()

    def inity(self):
        def Cleanse(player, dungeon):
            player.stats['Effects'] = {}

        Cleanse = Spell(name='Cleanse', when_use='Noncombat', cost=4, magicReq=5,
                        usefunc=Cleanse, disc='Removes all status effects.')

        def Heal(player, dungeon):
            player.gainHealth(player.stats['Magic'], dungeon)

        Heal = Spell(name='Heal', when_use='Noncombat', cost=7, magicReq=15,
                     usefunc=Heal, disc='Heals hp equal to your magic power.')

        def Grow(player, dungeon):
            player.stats['Health'] += 10

        Grow = Spell(name='Grow', when_use='Noncombat', cost=10, magicReq=60,
                     usefunc=Grow, disc='+10 max HP.')

        # def Summon(player, dungeon=None, enemy=None):
        #     player.gainHealth(player.stats['Magic'], dungeon)
        # Healing_Winds = Spell('Healing Winds', 'Anytime', 3, 15, Healing_Winds,
        #     disc='Heals health equal to your magic power.')

        self.spells = [Cleanse, Heal, Grow]
