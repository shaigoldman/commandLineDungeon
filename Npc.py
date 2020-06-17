import random
import numpy as np
import math
import sys
import os
import Instance
from Monster import Monster
from Misc_funcs import *


class Npc(Monster):

    def __init__(self, dungeon=None, level=None, putInDungeon=True):

        self.tribe = randInt(3)
        name = randomName(self.tribe * 2 + 1)
        name = name[0].upper() + name[1:]
        self.name = 'Chief ' + name

        disp = NPCDisp(self.tribe)

        import Classes
        self.initialize(dungeon, Classes.Chieftan(),
                        EXPmult=1, level=level, disp=disp)

        self.disp = hilite(disp, '38')
        self.pacible = True

        self.stats['Level'] = 20 * (random.random() > .5)
        if dungeon:
            for i in range((dungeon.zlevel / 3)):
                self.stats['Level'] += (20 * (random.random() > .5))
        self.stats['Level'] += 1 * (self.stats['Level'] < 1)

        self.stats['Health'] += 2 * self.stats['Level']
        self.stats['Power'] += 9 * (self.stats['Level'] * .7)
        self.stats['Magic'] += 9 * (self.stats['Level'] * .7)
        self.stats['Accuracy'] += (6 * self.stats['Level'] ** .5)
        self.stats['Speed'] += self.stats['Level']

        self.statsRandomizer()
        if dungeon:
            self.adjustStatsToDifficulty(dungeon.difficulty)

        self.health = self.stats['Health']

        opts = ['I am lost in this dungeon!', 'I live here.', 'I have no idea where I am.',
                'This is my in-laws apartment.',
                'I come from the land of %s.' % (self.getTribeName() + 'saka'), 'I live in a rock over there.',
                'I am an adventurer just like you.',
                'I have fled my family to live in the wild.', 'I am looking for meaning in life.',
                'I am trying to find a higher purpose?',
                'I like to visit caves.', 'I am trying to be bitten by a zombie for science.', 'You smell bad.',
                'I fell here by accident!',
                'My wife is mad at me so she banished me here.', 'My brother is here somewhere and I look for him.',
                'I dont speak english.',
                'I am from a land far far away.', 'I was tranported in time from another period of history.',
                'I think therefore I am.',
                'What are you doing here?']
        self.descript = randFromList(opts)

        opts = ['Have a nice day!', 'You stink.', 'I hate you.', 'Good for you.', 'Oh so you are a wise guy, eh?',
                'What? I wont cheat you!', 'Hehehe.', 'Smart move.', 'Bad move.', 'You are so so dumb.', 'Okay.',
                'Bye bye now.', 'I am tired of your stupid face anyway.', 'Go home then!']
        self.rejectLine = randFromList(opts)

        opts = ['Oh you are going to love this one.', 'What a wonderful idea.', 'Okay then!', 'Good for you.',
                'Oh so you are a wise guy, eh?', 'You are in for a big surprise!',
                'Hehehe.', 'Smart move.', 'Bad move.', 'Heehee, you are so so dumb.', 'Okay.',
                'Very well then.', 'Hmm... Are you trying to trick me?', 'Good luck.']
        self.acceptLine = randFromList(opts)

        opts = ['Goodbye.', 'See you later!', 'Enjoy!', 'I dont like you very much.',
                'Pleasure doing business with you!', 'You are in for a big surprise!',
                'Hehehe.', 'Have fun now.', 'Well then I\'ll be on my way.', 'Heehee, you are so so dumb.',
                'Very good.', 'Hmm... Are you trying to trick me?', 'Good luck.']
        self.endLine = randFromList(opts)

        deals = ['Life', 'All Items', 'Item of Choice', 'Random Item',
                 'Weapon', 'Death Wheel', 'Stat', 'Health Gain']
        self.deal = randFromList(deals)
        self.acceptsNoWeapon = (random.random() > .5)
        self.doneDeal = False

    def getTribeName(self):
        if self.tribe == 0:
            return 'Pallu'
        elif self.tribe == 1:
            return 'Awa'
        else:
            return 'Vraskii'

    def sayLine(self, lne, dungeon, typ='Norm'):
        if typ == 'Norm':
            dungeon.statusbar.addText(('%s: ' % self.name) + lne, dungeon, waitForResp=True)
        elif typ == 'Query':
            return dungeon.statusbar.addQuery(('%s: ' % self.name) + lne, dungeon)

    def talk(self, player, dungeon):
        dungeon.statusbar.clear()
        dungeon.statusbar.addPermText((self.boldName()))
        self.sayLine('Hello. I am %s from the %s tribe.' %
                     (self.name, self.getTribeName()), dungeon)

        self.sayLine(self.descript, dungeon)

        if not self.doneDeal:
            inpt = self.sayLine('Would you like to make a deal with me (y/n)?', dungeon, 'Query')
            if inpt == 'y':
                self.proposeDeal(player, dungeon)
            else:
                self.sayLine(self.rejectLine, dungeon)

        dungeon.statusbar.revertPermText()

    def proposeDeal(self, player, dungeon):
        self.sayLine('Heeheehee. Here is a great deal for you!', dungeon)

        proposal = 'All you have to do is give me '
        if self.deal == 'Life' or self.deal == 'Health Gain':
            proposal += 'your health.'
        elif self.deal == 'All Items':
            proposal += 'your items.'
        elif self.deal == 'Item of Choice' or self.deal == 'Random Item':
            proposal += 'an item.'
        elif self.deal == 'Weapon':
            proposal += 'your weapon.'
        elif self.deal == 'Death Wheel':
            proposal += 'your soul.'
        elif self.deal == 'Stat':
            proposal += 'your power.'

        self.sayLine(proposal, dungeon)
        inpt = self.sayLine('Do you accept (y/n)?', dungeon, 'Query')

        if inpt == 'y':
            self.sayLine(self.acceptLine, dungeon)
            self.doDeal(player, dungeon)
        else:
            self.sayLine(self.rejectLine, dungeon)

    def doDeal(self, player, dungeon):
        makedeal = True
        dungeon.statusbar.addBreak(dungeon)
        if self.deal == 'Life':
            self.gainHealth(player.health, dungeon)
            player.takeDamage(player.health - 1, dungeon, source='Deal')
        elif self.deal == 'Health Gain':
            player.gainHealth(self.health, dungeon)
            self.takeDamage(self.health, dungeon, source='Deal')
            makedeal = False
            dungeon.statusbar.revertPermText()
            return
        elif self.deal == 'All Items':
            items = player.items
            if not items and not player.weapons:
                self.sayLine('Hey! You have no items, you trickster!', dungeon)
            mx = len(items)
            for item in range(0, mx):
                item = player.items[0]
                item.drop(player, dungeon, waitForResp=True)
                self.sayLine('Thanks for the %s!' % item.name, dungeon)
            if player.weapons:
                w = player.weapons[0]
                self.weapons.append(w)
                w.drop(player, dungeon, waitForResp=True)
                self.sayLine('Thanks for the %s!' % w.name, dungeon)
        elif self.deal == 'Item of Choice' or self.deal == 'Random Item' or self.deal == 'Weapon':
            if self.deal == 'Item of Choice':
                item = player.dropItem(dungeon, source='Deal')
            elif self.deal == 'Random Item':
                if not player.items and not player.weapon:
                    self.sayLine('Hey! You have no items, you trickster!', dungeon)
                    item = None
                else:
                    if player.items or player.weapons:
                        items = []
                        items.extend(player.items)
                        items.extend(player.weapons)
                        item = randFromList(items)
                    item.drop(player, dungeon, waitForResp=True)
            elif self.deal == 'Weapon':
                if not bool(player.weapons):
                    if self.acceptsNoWeapon:
                        self.sayLine('Hmm. You have no Weapon. Oh well, I dont really care anyway.', dungeon)
                        item = None
                    else:
                        self.sayLine('Hey! You have no Weapon! Go away then!', dungeon)
                        makedeal = False
                else:
                    item = player.weapons[0]
                    dungeon.statusbar.addText('%s lost his %s!' % (player.name, player.weapons[0].name), dungeon)
                    player.weapons.remove(item)
            if makedeal and item:
                if item.itemtype == 'Weapon' or item.itemtype == 'Tome':
                    self.weapons.append(item)
                self.sayLine('Thanks for the %s!' % item.name, dungeon)
        elif self.deal == 'Death Wheel':
            import time
            bar = randInt(100)
            dialogue = ['HooHaHeeHee! You play the Risky Game!',
                        'Lets spin the wheel! If you get higher than a %s, you live!' % bar,
                        'Otherwise... well, you get the idea. Ready?',
                        '3...', '2...', '1...', '...']
            for dia in dialogue:
                self.sayLine(dia, dungeon)
            hit = randInt(100)
            self.sayLine('Go!\nYou got a %d!' % hit, dungeon)
            if hit >= bar:
                self.sayLine('You get to live! Lucky!', dungeon)
            else:
                self.sayLine('Well.. you know what that means!', dungeon)
                dungeon.statusbar.revertPermText()
                player.die(dungeon)
                return
        elif self.deal == 'Stat':
            stat = randFromList(['Power', 'Magic', 'Luck', 'Speed',
                                 'Accuracy', 'Health'])
            self.sayLine('I choose... your %s!' % stat, dungeon)
            loss = randInt(5 + (self.stats['Level'] / 10))
            player.stats[stat] -= loss
            dungeon.statusbar.addText('%s\'s %s: %d - %d = %d' % (
                player.name, stat, player.stats[stat] + loss, loss, player.stats[stat]), dungeon)
            self.stats[stat] += loss
            dungeon.statusbar.addText('%s\'s %s: %d + %d = %d' % (
                self.name, stat, self.stats[stat] - loss, loss, self.stats[stat]), dungeon)

        if makedeal:
            self.giveGift(player, dungeon)
            self.sayLine(self.endLine, dungeon)
            if random.random() > .2:
                self.die(player, dungeon, source='Deal')

    def giveGift(self, player, dungeon):
        prizePool = [LegendarySword(), EXP_Pill(), Piece_of_Trash(), Mystery_Tome()]
        prize = randFromList(prizePool)
        dungeon.statusbar.addBreak(dungeon)
        self.sayLine('Here, take this.', dungeon)
        player.pickUpItem(prize, dungeon, source='Deal')
        self.doneDeal = True

    def fight(self, enemy, dungeon):
        self.sayLine('It didn\'t have to end this way...', dungeon)
        self.attack(enemy, dungeon)


from Weapon import Weapon
from Item import Item
from Tome import Tome, Spell


class LegendarySword(Weapon):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.itemtype = 'Weapon'
        self.rarity = None
        self.uses = 50

        self.initialize(25, 10, 'Sword', material='???',
                        luck=11, dungeon=dungeon)
        self.name = 'Awathons Broadsword'
        self.isProperName = True


class EXP_Pill(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = False
        self.name = 'EXP Pill'
        self.rarity = None
        self.when_use = ['Anytime']
        self.setDisc('+100 EXP.')
        self.itemtype = 'Basic'

        def func(mob, dungeon):
            mob.stats['EXP'] += 100
            mob.levelUp(dungeon)

        self.usefunc = func


class Piece_of_Trash(Item):
    def __init__(self, dungeon=None):
        self.init(dungeon)
        self.reuseable = True
        self.name = 'Piece of Trash'
        self.rarity = None
        self.when_use = ['Anytime']
        self.setDisc('Its just trash dude.')
        self.itemtype = 'Basic'

        def func(mob, dungeon):
            dungeon.statusbar.addText(
                'You can\'t do so much with trash. Please don\'t litter.')

        self.usefunc = func


class Mystery_Tome(Tome):
    def __init__(self, dungeon=None):
        self.initialize(attack=0, affn='Nuetral', luck=50, dungeon=dungeon)
        self.rarity = None
        self.inity()
        self.name = "Mystery Staff"

    def inity(self):

        def selfDestruct(player, dungeon):
            dungeon.statusbar.addText("Oh no! It backfired!", dungeon)
            player.takeDamage(player.stats['Health'] / 4, dungeon, lethalability=False)

        def giveItem(player, dungeon):
            def randLoc(player):
                rnge = player.sightrange
                if rnge > 10:
                    rnge = 10
                x = player.x + (randInt(rnge) * (-1 * randInt(2)))
                y = player.x + (randInt(rnge) * (-1 * randInt(2)))
                print x >= dungeon.legnth or y >= dungeon.height
                while x >= dungeon.legnth or y >= dungeon.height:
                    x = player.x + (randInt(rnge) * (-1 * randInt(2)))
                    y = player.x + (randInt(rnge) * (-1 * randInt(2)))
                print x, y, dungeon.legnth, dungeon.height
                return x, y

            from Item import randItem

            y, x = randLoc(player)



            try:
                while dungeon.dung[x, y].ID!=0:
                    x, y = randLoc(player)
            except:
                while dungeon.dung[y, x].opaque:
                    x, y = randLoc(player)


            item = randItem(dungeon.zlevel)()
            dungeon.setInst(y, x, item)

        def Mystery(player, dungeon):
            if random.random() > .75:
                selfDestruct(player, dungeon)
            else:
                giveItem(player, dungeon)

        Mystery = Spell(name='Mystery', when_use='Noncombat', cost=10, magicReq=1,
                        usefunc=Mystery, disc='Unknown Effect.')

        self.spells = [Mystery]
