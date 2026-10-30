import random
import numpy as np
import sys
import os

from Statusbar import Statusbar

from Misc_funcs import *
from Instance import *
from Monster import *
from Item import *
from Replenisher import *
from Replenisher import Replenisher
from Npc import Npc

class Dungeon(object):

    P = None

    def __init__(self, legnth=None, height=None, numitems=None, 
        numrooms=None, maxroomsize=None, minroomsize=None, zlevel=None,
        difficulty=None):

        if legnth == None:
            return

        self.statusbar = Statusbar()

        if not difficulty and difficulty != 0:
           game_modes = ['Normal', 'Hard']
           self.difficulty = game_modes.index(self.statusbar.addOptionList(self, game_modes, includeNoneOpt=False, startText='Choose difficulty:'))
        else:
           self.difficulty = 0

        self.legnth = legnth
        self.height = height
        self.dung = np.asarray([[Wall()] * legnth] * height)
        self.createRooms(numrooms, maxroomsize, minroomsize)
        self.zlevel = zlevel

        self.monAttkRate = .4 * (1.2 * self.difficulty)
        if self.monAttkRate > .8:
            self.monAttkRate = .8

        for i in range(self.dung.shape[0]):
            for j in range(self.dung.shape[1]):
                self.dung[i, j].x = i
                self.dung[i, j].y = i

        monsters = [Zombie, Spider, Snake]

        ParasiteFloorMin = 2
        GolemFloorMin = 3
        if self.zlevel >= ParasiteFloorMin:
            monsters.append(Parasite)
        if self.zlevel >= GolemFloorMin:
            monsters.append(Golem)

        self.Is = []
        for i in range(numitems):
            item = randItem(self.zlevel)
            if item:
                self.addI(item(self))

        self.Ms = []
        monlevelrng = (self.zlevel) + 3
        # for j in range(2 + ((monlevelrng - 1) * self.zlevel), 
        #       1 + ((monlevelrng - 1) * self.zlevel) + monlevelrng):
        #   for k in range(ranger):
        #       M = random.choice(monsters)(self, j)
        #       self.addM(M)
        # for k in range(6):
        #   M = random.choice(monsters)(self, 1*bool(int(random.random()*2)) + ((monlevelrng - 1) * self.zlevel))
        #   self.addM(M)

        for k in range(18):
            M = random.choice(monsters)(self, 1*bool(int(random.random()*2)) + ((monlevelrng - 1) * self.zlevel))
            self.addM(M)

        for i in range(10):
            Replenisher(self)
        
        stairs = Stairs(self, self.zlevel)
        if (self.zlevel+1)%3 == 2:
            stairs.lock()
            miniG = random.choice(monsters)(self, 
                (monlevelrng + ((monlevelrng - 1) * self.zlevel)))
            miniG.item = Key()
            #miniG.disp = hilite('G', '30')
            self.addM(miniG)

        if (self.zlevel+1)%3 == 0:
            G = Dragon(self, (10*self.zlevel), putInDungeon=False)
            G.name = 'Ruthagor, Dungeon Master'
        else:
            G = (random.choice(monsters)(self, 
                (1 + monlevelrng + ((monlevelrng - 1) * self.zlevel)),
                putInDungeon=False))
            if (self.zlevel+1)%3 == 2:
                G.name = 'Ergathon, Ruthagor\'s chosen'
            else:
                G.name += ' Boss'

        G.canmove = False
        G.moveTo(stairs.x, stairs.y, self)
        self.addM(G)

        if self.zlevel > 0 and (random.random() > .5):
            self.addM(Npc(self))

        self.revMatrix = self.getRevMatrix()
        self.revMask = np.zeros([self.height, self.legnth]).astype(int)

    def createARoom(self, x, y, legnth, height, disp=' '):
        self.dung[y:y+height, x:x+legnth] = Empty(disp=disp)

    def connectX(self, x, prevx, y):
        if prevx<x:
            self.dung[y, prevx:x+1] = Empty(disp='-')
        elif prevx>x:
            self.dung[y, x:prevx+1] = Empty(disp='-')

    def connectY(self, x, y, prevy):
        if prevy<y:
            self.dung[prevy:y+1, x] = Empty(disp='|')
        elif prevy>y:
            self.dung[y:prevy+1, x] = Empty(disp='|')

    def createRooms(self, numrooms, maxroomsize, minroomsize):
        chars = [str(i) for i in range(numrooms)]

        prevxs=[]
        prevys=[]
        for i in range(numrooms):
            height = int(random.random() * (maxroomsize - 
                minroomsize) + minroomsize)
            legnth = int(random.random() * (maxroomsize - 
                minroomsize) + minroomsize)

            if i%4 == 0 or i%4 == 2:
                minx = 0
                maxx = int(self.legnth/2)
            else:
                minx = int(self.legnth/2)
                maxx = self.legnth
            if i%4 == 0 or i%4 == 1:   
                miny = 0
                maxy = int(self.height/2)
            else:
                miny = int(self.height/2)
                maxy = self.height

            x = (int(random.random() * (maxx-minx-legnth))+minx)
            y = (int(random.random() * (maxy-miny-height))+miny)

            self.createARoom(x, y, legnth, height, disp=chars[i])
            if prevxs != []:
                index=int(random.random()*len(prevxs))
                conY = y
                conX = prevxs[index]
                if random.random()>.5: 
                    conY = prevys[index]
                    conX = x
                self.connectX(x, prevxs[index], conY)
                self.connectY(conX, y, prevys[index])
            prevxs.append(x)
            prevys.append(y)
            #self.disp()

    def normalize(self):
        self.Ms = self.Ms.tolist()
        self.Is = self.Is.tolist()
        self.P.normalize()
        self.addP(self.P)
    
    def getIDs(self):
        IDs=np.zeros([self.height, self.legnth])
        for i in range(self.dung.shape[0]):
            for j in range(self.dung.shape[1]):
                IDs[i,j] = self.dung[i,j].ID
        return IDs

    def addP(self, P):
        self.P = P
        self.dung[self.P.y, self.P.x] = self.P
        self.revMatrix = self.getRevMatrix()

    def addM(self, M):
        self.Ms.append(M)
        self.dung[M.y, M.x] = M

    def addI(self, I):
        self.Is.append(I)
        self.dung[I.y, I.x] = I

    def set_sb(self, sb):
        self.statusbar=sb

    def setInst(self, x, y, instance):
        self.dung[y, x] = instance

    def getRevMatrix(self):
        matrix = []
        for i in range(self.dung.shape[0]):
            row = []
            for j in range(self.dung.shape[1]):
                try:
                    xdif = abs(j-self.P.x)
                    ydif = abs(i-self.P.y)
                    
                    if ((xdif/2)**2+ydif**2<self.P.sightrange**2):
                        row.append(1)
                    else:
                        row.append(0)
                except AttributeError:
                    row.append(0)
            matrix.append(row)
        return np.asarray(matrix)

    class infoPane(object):
        info = []
        title = ''

        def __init__(self, typ, startline, dungeon, b4pane=None, maxsize=14):
            self.info = []
            self.b4pane = b4pane
            self.startline = 0 # for indexing behind panes
            self.maxsize = maxsize

            if b4pane:
                lens = [len(line) for line in self.b4pane.info]
                self.startline = max(lens)
            if not dungeon.P:
                return

            self.setStart(startline) # for indexing panes underneath each other
            if startline > 0:
                startline +=1
            self.start = [startline]
            #1 is Base, 2 is PStats, 3 is inventory1, 4 is Menu, 
            #5 is EStats or Leg, 6 is Spells, 7 is Inventory2
            if typ == 1:
                self.setBaseInfo(dungeon)
            if typ == 2:
                self.setStatInfo(dungeon.P, 'Combined Stats')
            if typ == 3:
                self.setItemInfo(dungeon)
            if typ == 4:
                self.setMenuInfo(dungeon)
            if typ == 5:
                if dungeon.P.fighting:
                    name = dungeon.P.fighting.name
                    if len(name)>18:
                        name = name[:15] + '...'
                    self.setStatInfo(dungeon.P.fighting, 
                        'Lvl %d %s%s %s' % (dungeon.P.fighting.stats['Level'], 
                            name, color.END, dungeon.P.fighting.disp))
                elif len(dungeon.P.weapons)>=2 and dungeon.P.hasMagic():
                    self.setWeaponInfo(dungeon)
                else:
                    self.setLegendInfo(dungeon)
            if typ == 6:
                self.setSpellsInfo(dungeon)
            if typ == 7:
                self.setItem2Info(dungeon)
            if typ == 8:
                self.setWeaponInfo(dungeon)

            self.shorten()

        def setStart(self, start):
            if start == 0: 
                return
            for i in range(start+1):
                self.info.append('')

        def setBaseInfo(self, dungeon):
            self.addTitle(self.shortenword(dungeon.P.name))
            info = []
            info.append('Score: %d' % (dungeon.P.score))
            info.append('Lvl: %d' % dungeon.P.stats['Level'])
            info.append('EXP: %d/100' % dungeon.P.stats['EXP'])

            if 'Armor' in dungeon.P.stats:
                info.append('Armr: %d' % dungeon.P.stats['Armor']) 
            if dungeon.P.hands > 1:
                 info.append('Hands: %d' % dungeon.P.hands) 

            if len(dungeon.P.weapons)==1:
                for w in dungeon.P.weapons:
                    name = w.name
                    shrn = name[name.index(' ')+1:]
                    if len(shrn) > 6:
                        shrn = shrn[:5]
                    name = name[0] + '. '+ shrn
                    info.append('Eqp: %s' % (name))
                    if not w.itemtype == 'Tome':
                        info.append('Uses: %d/%d' % (
                            w.usesLeft, w.uses))
                    
            if 'Mana' in dungeon.P.stats:
                info.append('Mana: %i/%i' % (dungeon.P.stats['Mana'], dungeon.P.getMana()))
            else:
                dungeon.P.stats['Mana'] = dungeon.P.getMana()
                info.append('Mana: %i/%i' % (dungeon.P.stats['Mana'], dungeon.P.getMana()))
            
            if dungeon.zlevel%3 == 2:
                info.append('Keys: %s' % len(dungeon.P.keys))

            info.append('Floor: %d' % (dungeon.zlevel+1))
            self.info.extend(info)

        def setStatInfo(self, mob, title):
            if not mob:
                return
            if mob.weapons and mob.ID == 3:
                self.maxsize = 20
            if ',' in title:
                title = title.split(' ', 2)[2]
            self.addTitle(title)
            info = []
            info.append('Cls: %s' % mob.stats['Class'])
            info.append('HP: %d/%d' % (mob.health, mob.stats['Health']))
            info.append(mob.getStatInfo('Attack'))
            if mob.getCombStat('Luck'):
                info.append(mob.getStatInfo('Luck'))
            info.append(mob.getStatInfo('Accuracy'))
            info.append(mob.getStatInfo('Speed'))
            if mob.ID == 3:
                info.append(mob.getStatInfo('Magic'))
            elif 'Armor' in mob.stats:
                info.append(mob.getStatInfo('Armor'))
            if mob.fighting:
                info.append(mob.getStatInfo('Hit')+'%')
            if 'Poison' in mob.stats['Effects']:
                info.append('%d psn/%d turns' % 
                        (mob.stats['Effects']['Poison'][1], 
                        mob.stats['Effects']['Poison'][0]))
            if 'Poison' in mob.stats:
                info.append('%d psn/%d turns' % 
                        (mob.stats['Poison'][1], 
                        mob.stats['Poison'][0]))
            if mob.blood_drain:
                info.append('Blood Drain')

            self.info.extend(info)

        def setItemInfo(self, dungeon):
            title = 'Inventory'
            if len(dungeon.P.items)>5:
                title += '1'
            self.addTitle(title)
            for i in dungeon.P.items[:5]:
                self.info.append(i.name)

        def setItem2Info(self, dungeon):
            self.addTitle('Inventory2')
            for i in range(5, len(dungeon.P.items)):
                self.info.append(dungeon.P.items[i].name)

        def setMenuInfo(self, dungeon):
            self.addTitle('Menu')
            info = []
            info.append('H- Help')
            info.append('S- Stats')
            info.append('I- Items')
            if dungeon.P.hasMagic():
                info.append('M- Spells')
            info.append('V- Save/Quit')
            info.append('Space- Yield')
            self.info.extend(info)

        def setLegendInfo(self, dungeon):
            self.addTitle('Legend')
            self.info.append(dungeon.P.disp+': Player')
            self.info.append('%s, %s, %s' % (Zombie().disp, Spider().disp, Snake().disp)+ ':')
            self.info.append('   Monsters' )
            self.info.append('%s: Items' % Item().disp)
            self.info.append('%s: Energy Pod' % Replenisher().disp)
            self.info.append('%s: Stairs' % unhilite(Stairs().disp))
            self.maxsize = 100

        def setSpellsInfo(self, dungeon):
            spells = []
            if dungeon.P.hasMagic():
                spells = dungeon.P.getAvailableSpells(when='Anytime')
            if not spells:
                return
            self.addTitle('Castable Spells')
            for i in spells:
                self.info.append('%s (%d Mn)' % (i.name, i.getCost(dungeon.P)))
            self.maxsize = 100
        
        def setWeaponInfo(self, dungeon):
            self.addTitle('Weaponry')
            self.maxsize = 50
            info = []
            for w in dungeon.P.weapons:
                name = w.name
                shrn = name[name.index(' ')+1:]
                if len(shrn) > 6:
                    shrn = shrn[:5]
                name = name[0] + '. '+ shrn
                string = '%s: ' % (name)
                if not w.itemtype == 'Tome':
                    string += '%d/%d' % (w.usesLeft, w.uses)
                info.append(string)
            self.info.extend(info)

        def addSpaces(self, line):
            spaces = 0
            if self.b4pane:
                try:
                    spaces = self.startline - len(
                        self.b4pane.info[line])
                    if line in self.b4pane.start:
                        spaces += 2
                except IndexError:
                    if line == len(self.b4pane.info):
                        spaces = self.startline+1-12
                    else:
                        spaces = self.startline+3
                try:
                    if self.b4pane.b4pane and len(self.b4pane.info) < line:
                        spaces += (max([len(i) for i in self.b4pane.b4pane.info]) -
                            len(self.b4pane.b4pane.info[line]))
                except IndexError:
                    if self.b4pane.b4pane and len(self.b4pane.info) < line:
                        try:
                            spaces += (max([len(i) for i in self.b4pane.b4pane.info]) -
	                            len(self.b4pane.b4pane.info[line-1]))
                        except IndexError:
	                        spaces += 15

            for i in range(spaces):
                sys.stdout.write(' ')

        def shortenword(self, word):
            if len(word) > self.maxsize:
                word = word[:8]+'...'
            return word
        def shortenTitle(self):
            if len(self.info[0]) > self.maxsize+15:
                self.info[0] = self.info[0][:self.maxsize+12]+'...'

        def shorten(self):
            self.shortenTitle()
            for line in range(min(self.start)+1, len(self.info)):
                self.info[line] = self.shortenword(self.info[line])

        def addTitle(self, title):
            self.info.append(title)

        def printLine(self, line, dungeon=None):
            maxlines = dungeon.shape[0]#-1
            if line > len(self.info) or line > maxlines:
                return
            if line == len(self.info) :
                self.addSpaces(line)
                sys.stdout.write('  ')
                if self.info:
                    for i in range(12):
                        sys.stdout.write('-')
            elif self.info[line] == '-' * 12:
                self.addSpaces(line)
                sys.stdout.write('  '+self.info[line]+' ')
            elif line in self.start:
                self.addSpaces(line)
                sys.stdout.write(' '+color.UNDERLINE+
                    self.info[line]+color.END)
            elif line<len(self.info) and line <= maxlines:
                if line == maxlines and len(self.info)>line:
                    self.addSpaces(line)
                    sys.stdout.write(' | .../')
                elif self.info[line]:
                    self.addSpaces(line)
                    sys.stdout.write(' | '+self.info[line])


        def concat(self, pane2):
            while len(self.info) < len(pane2.info):
                self.info.append('')
            for i in range(len(self.info)):
                if not self.info[i]:
                    self.info[i] = pane2.info[i]
            spot = None
            for i in range(len(self.info)):
                try:
                    if self.info[i] == '':
                        spot = i
                except UnicodeDecodeError:
                    pass
            if spot:
                self.info[spot] = '-' * 12
            self.start.extend(pane2.start)
            
    def disp(self):

        dungeon = self.dung

        if not sysIsWindows():
            os.system('clear')
        else:
            os.system('cls')

        #---- INFOPANES

        #1 is Base, 2 is PStats, 3 is inventory1, 4 is Menu, 
        #5 is EStats or Leg, 6 is Spells, 7 is Inventory2

        basePane = self.infoPane(1, 0, self)
        if len(self.P.items) <= 5:
            menuShouldBe = 4 #Menu is regular
            InventoryShouldBe = 3 #Standard inventory is Inv1
        else:
            menuShouldBe = 3 #Menu is Inv1
            InventoryShouldBe = 7 #Standard inventory is Inv2

        menuPane = self.infoPane(menuShouldBe, len(basePane.info), self)
        basePane.concat(menuPane)

        statPane = self.infoPane(2, 0, self, basePane)        
        itemPane = self.infoPane(InventoryShouldBe, len(statPane.info),
            self, menuPane)
        statPane.concat(itemPane)

        otherInfoPane = self.infoPane(5, 0, self, statPane, maxsize=30)
        if self.P.hasMagic():
            if not 'Mana' in self.P.stats:
                self.P.stats['Mana'] == self.P.getMana()
            magicPane = self.infoPane(6, len(otherInfoPane.info), self, statPane)
            otherInfoPane.concat(magicPane)
        elif len(self.P.weapons)>1:
            weaponsPane = self.infoPane(8, len(otherInfoPane.info), self, statPane)
            otherInfoPane.concat(weaponsPane)

        #---- DUNGEON   

        wchar = Wall().darkdisp
        for i in range(dungeon.shape[1]+2):
            sys.stdout.write(wchar)

        basePane.printLine(0, dungeon)
        statPane.printLine(0, dungeon)
        otherInfoPane.printLine(0, dungeon)

        sys.stdout.write('\n')

        for i in range (dungeon.shape[0]):
            sys.stdout.write(wchar)
            for j in range(dungeon.shape[1]):
                xdif = abs(j-self.P.x)
                ydif = abs(i-self.P.y)
                
                if self.revMatrix[i, j] or self.revMask[i, j]:
                    #print dungeon[i,j].revealed
                    if not dungeon[i, j].ID == 1:
                        disp = hilite(dungeon[i, j].disp, '107')
                    else:
                        if (self.zlevel+1)%3 == 0:
                            disp = hilite(unhilite(dungeon[i,j].disp), '41')
                        elif (self.zlevel+1)%3 == 2:
                            disp = hilite(unhilite(dungeon[i,j].disp), '42')
                        else:
                            disp = dungeon[i,j].disp
                    sys.stdout.write(disp)
                else:
                    sys.stdout.write(wchar)
            sys.stdout.write(wchar)
            basePane.printLine(i+1, dungeon)
            statPane.printLine(i+1, dungeon)
            otherInfoPane.printLine(i+1, dungeon)
            
            sys.stdout.write('\n')


        for i in range(dungeon.shape[1]+2):
            sys.stdout.write((wchar))

        self.statusbar.disp()




