import random
import numpy as np
import sys, math
import os
from Instance import Instance, Empty
import collections
import Misc_funcs
from Misc_funcs import *
import abc


class Mob(Instance):

    def assignRandomXY(self, dungeon, firstAssign=False):
        openspaces = np.asarray(np.where(dungeon.getIDs() == 0))
        index = np.random.randint(openspaces.shape[1])
        if self.standingon and not firstAssign:
            dungeon.setInst(self.x, self.y, self.standingon)
        self.x = openspaces[1, index]
        self.y = openspaces[0, index]
        self.standingon = dungeon.dung[self.y, self.x]
        dungeon.setInst(self.x, self.y, self)

    def init(self, dungeon):
        self.standingon = None

        if dungeon:
            self.assignRandomXY(dungeon, firstAssign=True)

        self.mysteryrange = 0

        self.opaque = True
        self.hide()

        self.weapons = []
        self.hands = 1
        self.alive = True

        self.blood_drain = False
        self.fighting = None
        self.pacible = False  # True for NPCs

    def getActualStatKeys(self):
        return [
            'Power', 'Magic', 'Accuracy', 'Speed'
        ]

    def checkDirection(self, direction, ID, dungeon):
        if direction == 'up' and dungeon.getIDs()[self.y - 1, self.x] == ID:
            return 'up'
        elif direction == 'down' and dungeon.getIDs()[self.y + 1, self.x] == ID:
            return 'down'
        elif direction == 'right' and dungeon.getIDs()[self.y, self.x + 1] == ID:
            return 'right'
        elif direction == 'left' and dungeon.getIDs()[self.y, self.x - 1] == ID:
            return 'left'

    def checkDirectionClear(self, direction, dungeon):
        if direction == 'up' and not dungeon.dung[self.y - 1, self.x].opaque:
            return 'up'
        elif direction == 'down' and not dungeon.dung[self.y + 1, self.x].opaque:
            return 'down'
        elif direction == 'right' and not dungeon.dung[self.y, self.x + 1].opaque:
            return 'right'
        elif direction == 'left' and not dungeon.dung[self.y, self.x - 1].opaque:
            return 'left'

    def move(self, direction, dungeon):
        x = self.x
        y = self.y
        if self.checkDirectionClear(direction, dungeon) == 'up':
            self.y -= 1
        elif self.checkDirectionClear(direction, dungeon) == 'down':
            self.y += 1
        elif self.checkDirectionClear(direction, dungeon) == 'right':
            self.x += 1
        elif self.checkDirectionClear(direction, dungeon) == 'left':
            self.x -= 1
        else:
            return False
        dungeon.setInst(x, y, self.standingon)
        self.standingon = dungeon.dung[self.y, self.x]
        dungeon.setInst(self.x, self.y, self)

        return True

    def getSpeed(self):
        spd = self.stats['Speed']
        if self.weapons:
            for w in self.weapons:
                spd -= w.stats['Weight'] / 4
        if 'Soeed Booster' in self.stats['Effects']:
            spd += math.ceil(spd * (self.stats['Effects']['Speed Booster'][1] / 100.))
        return spd

    def willAttackFirst(self, enemy, dungeon):
        if self.getSpeed() >= enemy.getSpeed():
            return True
        else:
            dungeon.statusbar.addText(('%s has more Speed and will attack first!' %
                                       enemy.name), dungeon, waitForResp=True)
            return False

    def getAttackStats(self, usingWeapons=False, usingTome=False):
        stats = collections.OrderedDict([
            ('Luck', self.stats['Luck']),
            ('Attack', self.stats['Power']),
            ('Speed', self.stats['Speed']),
            ('Accuracy', self.stats['Accuracy'])])

        if usingTome:
            stats['Attack'] = self.getMagicAttk()

        for stat in stats:
            if stat + ' Booster' in self.stats['Effects']:
                stats[stat] += math.ceil(stats[stat] *
                                         ((self.stats['Effects'][stat + ' Booster'][1]) / 100.))
                self.stats['Effects'][stat + ' Booster'][0] -= 1
                if self.stats['Effects'][stat + ' Booster'][0] == 0:
                    del self.stats['Effects'][stat + ' Booster']

            if usingWeapons and self.weapons:
                if stat == 'Accuracy':
                    for w in self.weapons:
                        stats[stat] -= w.stats['Weight'] * 2
                elif stat == 'Speed':
                    for w in self.weapons:
                        stats[stat] -= w.stats['Weight'] / 2
                else:
                    for w in self.weapons:
                        stats[stat] += w.stats[stat]

        return stats

    def determineHitRate(self, enemy, dungeon=None, usingWeapons=False,
                         printCalculation=False, printRate=False, waitForResp=False,
                         max100=False):
        stats = self.getAttackStats(usingWeapons=usingWeapons, usingTome=False)
        enemy_stats = enemy.getAttackStats(usingWeapons=bool(enemy.weapons), usingTome=False)
        hitRate = stats['Accuracy'] + stats['Speed'] - (enemy_stats['Speed'] * 1.2)
        if hitRate < 40:
        	hitRate = 40
        if printCalculation:
            dungeon.statusbar.addText('Hit chance = Acc. + Spd - (Enemy Spd * 1.2) [Min: 40%].', dungeon)
        if printRate:
            hitdisp = str(hitRate)
            if '.' in hitdisp:
                hitdisp = hitdisp[:hitdisp.index('.') + 2]
            if hitRate > 100:
                hitdisp = '100'
            dungeon.statusbar.addText('%s\'s hit chance: %s%%.' % (
                self.name, hitdisp), dungeon, waitForResp=waitForResp)
        if max100 and hitRate >= 100:
            return 100
        return hitRate

    def attack(self, enemy, dungeon):

        usingWeapon = []
        usingTome = []

        for w in self.weapons:
            if w.itemtype == 'Tome':
                if self.stats['Mana'] < 2:
                    dungeon.statusbar.addText(('%s doesn\'t have enough mana to use the %s.'
                                               % (self.name, w.name)), dungeon)
                else:
                    usingTome.append(w)
            if w.itemtype == 'Weapon':
                usingWeapon.append(w)

        if usingWeapon and self.ID == 3:
            not_using = []
            for t in [usingWeapon, usingTome]:
                for w in t:
                    while 1:
                        text = 'Attack with %s' % (w.name)
                        if w.itemtype == 'Tome':
                            text += ' (Mana cost=%d)' % w.getCost(self)
                        text += ' (y/n)?'

                        inpt = dungeon.statusbar.addQuery(text)

                        if inpt == 'y':
                            break
                        elif inpt == 'n':
                            not_using.append(w)
                            break
                        else:
                            dungeon.statusbar.addNotValid(dungeon)
            for w in not_using:
                if w in usingWeapon:
                    usingWeapon.remove(w)
                elif w in usingTome:
                    usingTome.remove(w)

        strng = '%s attacked %s' % (self.name, enemy.name)
        for w in range(len(usingWeapon)):
            if w > 0:
                strng += ', and'
            strng += ' with a %s' % usingWeapon[w].name
        strng += '.'
        dungeon.statusbar.addText(strng, dungeon)

        stats = self.getAttackStats(usingWeapons=usingWeapon, usingTome=usingTome)

        if (usingTome):
            self.stats['Mana'] -= 2
            dungeon.statusbar.addText('%s\'s mana: %d/%d' %
                                      (self.name, self.stats['Mana'], self.stats['Magic']), dungeon)

        for w in usingWeapon:
            w.usesLeft -= 1
            if w.usesLeft <= 0:
                w.brek(self, dungeon)
            else:
                dungeon.statusbar.addText(('%s uses left: %d/%d' %
                                           (w.name, w.usesLeft, w.uses)),
                                          dungeon)

        if (random.random() * 100 < self.determineHitRate(enemy, usingWeapons=usingWeapon,
                                                          printCalculation=False, printRate=False)):

            dmg = stats['Attack']

            critical_chance = stats['Luck'] * .01
            if critical_chance > .70:
            	critical_chance = .70
            if random.random() * random.random() > 1 - critical_chance:
                dungeon.statusbar.addText('Critical hit!', dungeon)
                dmg *= 3

            enemy.takeDamage(dmg, dungeon)
            if self.blood_drain:
                self.gainHealth(dmg, dungeon)

        else:
            dungeon.statusbar.addText('%s missed!' % (self.name), dungeon)
            dungeon.statusbar.endSegment(dungeon, False)
            dmg = 0

        dungeon.disp()
        return dmg > 0

    def getPoison(self, poison, dungeon):
        if not self.alive:
            return

        if ('Poison' in self.stats['Effects']) and not (poison[0] == self.stats['Effects']['Poison'][0] and
                                                        poison[1] == self.stats['Effects']['Poison'][1]):
            dungeon.statusbar.addText('%s was poisoned!' % (self.name), dungeon)
            dungeon.statusbar.addText(('Poison: %d damage for the ' +
                                       'next %d moves.') % (poison[1], poison[0]), dungeon)

        # first is how long, second is amount of dmg
        if not 'Poison' in self.stats['Effects']:
            self.stats['Effects']['Poison'] = [poison[0], poison[1]]
        else:
            if poison[0] > self.stats['Effects']['Poison'][0]:
                self.stats['Effects']['Poison'][0] = poison[0]
            if poison[1] > self.stats['Effects']['Poison'][1]:
                self.stats['Effects']['Poison'][1] = poison[1]

    def takePoison(self, dungeon):
        if 'Poison' in self.stats['Effects']:
            dungeon.disp()
            self.stats['Effects']['Poison'][0] -= 1
            dmg = self.stats['Effects']['Poison'][1]
            dungeon.statusbar.addText('%s took %d damage from poison!' % (self.name, dmg), dungeon)
            if self.stats['Effects']['Poison'][0] == 0:
                del self.stats['Effects']['Poison']
            self.takeDamage(dmg, dungeon, source='Poison')
            dungeon.disp()

    def takeDamage(self, dmg, dungeon, source='Attack', lethalability=True):
        if source == 'Attack':
            if not lethalability and dmg > self.health:
                dmg = self.health - 1
            dungeon.statusbar.addText('%s was dealt %d damage!' % (self.name,
                                                                   dmg), dungeon)
            if 'Armor' in self.stats:
                if self.stats['Armor'] > 0:
                    dmg -= self.stats['Armor']
                    if dmg < 0:
                        dmg = 0
                    dungeon.statusbar.addText('%s\'s armor absorbed %d of the damage!' %
                                              (self.name, self.stats['Armor']), dungeon)

        origH = self.health
        dmg = int(dmg)
        self.health -= dmg

        if self.health <= 0:
            self.health = 0

        dungeon.statusbar.addText('%s health: %d - %d = %d' % (self.name,
                                                               origH, dmg, self.health), dungeon)

        f = open('dmgFile', 'w')
        f.write(self.name + '\n')
        f.write('Health: ');
        f.write(str(origH) + '\n')
        f.write('dmg: ');
        f.write(str(dmg) + '\n')
        f.write('HealthNow: ');
        f.write(str(self.health) + '\n')
        f.close()

        dungeon.statusbar.endSegment(dungeon, False)

        if self.health <= 0:
            try:
                self.die(dungeon)
            except TypeError:
                self.die(dungeon.P, dungeon)

    def printStats(self, statusbar, dungeon, range=0, ask=True):
        statusbar.addText('Level %d %s:' % (self.stats['Level'], self.name), dungeon)
        done = False
        while not done and ask:
            inpt = statusbar.addQuery('View Stats (y/n)?', dungeon)
            if (inpt == 'y' or inpt == 'n'):
                done = True
            else:
                statusbar.addText('That is not a valid option.', dungeon)
        if not ask or inpt == 'y':
            from Classes import printStats
            printStats(self.stats, dungeon, health=self.health, range=range, mob=self, weapons=self.weapons)

    def gainHealth(self, healthGain, dungeon):

        if int(self.health) >= int(self.stats['Health']):
            return

        if self.health + healthGain > self.stats['Health']:
            healthGain = self.stats['Health'] - self.health

        dungeon.statusbar.addText(('%s gained %d health!')
                                  % (self.name, healthGain), dungeon)
        self.health += healthGain

        dungeon.statusbar.addText(('%s\'s health: %d/%d')
                                  % (self.name, self.health, self.stats['Health']), dungeon)

    def getMana(self, adder=3):
        return 10

        m = self.stats['Magic']
        if m < adder:
            return m
        mm = 0
        for j in range(m / adder):
            if j < adder:
                mm += adder - j
            else:
                mm += 1
        mm += 5
        if mm > 20:
            mm = 20
        return mm

    def gainMana(self, mana, dungeon):
        dungeon.statusbar.addText(('%s gained %d mana!')
                                  % (self.name, mana), dungeon)
        self.stats['Mana'] += mana
        if self.stats['Mana'] > self.getMana():
            self.stats['Mana'] = self.getMana()
        dungeon.statusbar.addText(('%s\'s mana: %d/%d')
                                  % (self.name, self.stats['Mana'], self.getMana()), dungeon)

    def hasMagic(self):
        return 'Tome' in [item.itemtype for item in self.getItemsPlusWeapon()]
        # return self.weapon and self.weapon.itemtype == 'Tome'

    def tomeEquipped(self):
        return self.weapons and 'Tome' in [w.itemtype for w in self.weapons]

    def getItemsPlusWeapon(self):
        itemsList = []
        if self.ID == 3:
            self.items
            itemsList.extend(self.items)
        for w in self.weapons:
            itemsList.append(w)
        return itemsList

    def getBoost(self, value, stat):
        boost = 0
        if stat + ' Booster' in self.stats['Effects']:
            boost = self.stats['Effects'][stat + ' Booster'][1]
        return value + value * boost / 100

    def magicReducer(self):
        return 0
        return 10

    def getMagicAttk(self, reducer=None):
        return self.stats['Magic'] - self.magicReducer()

    def getWeaponsAttkBoost(self, isMagicAttack=False):
        if not self.weapons:
            return 0
        return sum(
            [w.stats['Attack'] * (
                    (w.itemtype == 'Tome' and isMagicAttack) or (w.itemtype != 'Tome' and not isMagicAttack)
            ) for w in self.weapons])

    def getWeaponsAccrDetr(self):
        return sum([w.getAccrDetr() for w in self.weapons])

    def getWeaponsSpeedDetr(self):
        return sum([w.getSpeedDetr() for w in self.weapons])

    def getWeaponsLuckBoost(self):
        return sum([w.stats['Luck'] for w in self.weapons])

    def getCombAttk(self, isMagicAttack=None):
        if isMagicAttack == None:
            isMagicAttack = self.tomeEquipped()
        attk = self.stats['Power']
        if self.tomeEquipped():
            attk = self.getMagicAttk()
        return self.getBoost(attk + self.getWeaponsAttkBoost(isMagicAttack=isMagicAttack), 'Attack')

    def getCombStat(self, stat):
        if stat == 'Attack':
            return self.getCombAttk()
        if stat == 'Hit' and self.fighting:
            return self.determineHitRate(self.fighting, usingWeapons=self.weapons, max100=True)
        if self.weapons:
            if stat == 'Accuracy':
                return self.getBoost(self.stats['Accuracy'] - self.getWeaponsAccrDetr(), 'Accuracy')
            if stat == 'Speed':
                return self.getBoost(self.stats['Speed'] - self.getWeaponsSpeedDetr(), 'Speed')
            if stat == 'Luck':
                return self.getBoost(self.stats['Luck'] + self.getWeaponsLuckBoost(), 'Luck')
        return self.getBoost(self.stats[stat], stat)

    def shouldEquip(self, weapon):
        return ((weapon.itemtype == 'Tome' and self.getMagicAttk() + weapon.stats['Attack'] > self.stats['Power'])
                or (weapon.itemtype == 'Weapon' and self.getMagicAttk() < self.stats['Power'] + weapon.stats['Attack']))

    def getStatInfo(self, stat):
        text = ''
        if self.mysteryrange == 0 or not (stat in self.shownstats):
            if stat == 'Attack':
                text += 'Attk: '
            else:
                text += '%s: ' % (stat)
            if (stat == 'Attack' and self.weapons):
                sign = '+'
                if self.getCombStat(stat) < self.getCombStat('Power'):
                    sign = '-'
                text += '%d(w:%s%d)' % (self.getCombStat('Power'), sign,
                                        abs(self.getCombStat(stat) - self.getCombStat('Power')))
            else:
                text += '%d' % (self.getCombStat(stat))

        else:
            shown = self.shownstats[stat] + self.getCombStat(stat)
            min = shown - self.mysteryrange
            if min < 0:
                min = 0
            text += '%s: %d-%d' % (stat, int(min), int(shown + self.mysteryrange))
        return text

    def boldName(self):
        return '%sLevel %d %s%s' % (color.BOLD, self.stats['Level'], self.name, color.END)

    @abc.abstractmethod
    def die():
        self.alive = False
