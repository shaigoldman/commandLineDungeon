import random
import numpy as np
import sys
import os
from Misc_funcs import *

class Instance(object):

    ID = -1

    def __init__(self, x, y, disp='?', opaque=True):
        self.x = x
        self.y = y
        self.disp = disp
        self.opaque = opaque
        self.revealed = False
        self.darkdisp = hilite(' ', '40')

    def reveal(self):
        self.revealed = True

    def hide(self):
        self.revealed = False
        self.darkdisp = hilite(' ', '40')

    def moveTo(self, x, y, dungeon):
        dungeon.setInst(self.x, self.y, self.standingon)
        self.x = x
        self.y = y
        self.standingon = dungeon.dung[self.y, self.x]
        dungeon.setInst(self.x, self.y, self)


class Wall(Instance):
    def __init__(self, x=None,y=None):
        self.x=x
        self.y=y
        self.disp = hilite(' ', '100')
        self.hide()
        self.opaque = True
        self.ID = 1

class Empty(Instance):
    def __init__(self, x=None, y=None, disp = ' '):
        self.x=x
        self.y=y
        self.disp = ' '
        self.opaque = False
        self.hide()
        self.ID = 0
        self.rarity = 0

class Stairs(Instance):
    z=0
    def __init__(self, dungeon=None, z=None):

        self.disp = hilite(stairDisp(), '30')
        self.opaque = False

        self.ID = 6
        self.z = z
        self.locked = False

        if dungeon==None:
            return

        openspaces = np.asarray(np.where(dungeon.getIDs() == 0))
        index = np.random.randint(openspaces.shape[1])
        self.x = openspaces[1, index]
        self.y = openspaces[0, index]

        dungeon.setInst(self.x, self.y, self)
        self.hide()


    def use(self, player, dungeon):
        from Dungeon import Dungeon

        if self.locked:
            dungeon.statusbar.addText('The stairs are locked!', dungeon)
            #if 'Key' in [i.itemtype for i in player.items]:
            if player.keys:
                dungeon.statusbar.addBreak(dungeon)
                self.unlock(dungeon, player)
            else:
                dungeon.statusbar.addText('Find the key!', dungeon)
                dungeon.statusbar.endSegment(dungeon)
        if self.locked:
            return

        inpt = dungeon.statusbar.addQuery('Ascend the staircase (y/n)?')
        if inpt == 'y':
            dungeon.statusbar.addText('%s went up the staircase!' % player.name, dungeon)

            if self.z==2:
                dungeon.P.win(dungeon)
                #return

            D = Dungeon(dungeon.legnth, dungeon.height, 10, 8, 5, 3, self.z+1, difficulty=dungeon.difficulty)
            player.assignRandomXY(D, firstAssign=True)
            player.score += 500
            D.addP(player)
            return D
        else:
            return

    def lock(self):
        self.locked = True

    def unlock(self, dungeon, player):
        inpt = dungeon.statusbar.addYN(dungeon, 'Use a key')
        if inpt == 'y':
            player.keys[0].use(player, dungeon, 'Unlocking')
            self.locked = False
            player.keys.remove(player.keys[0])
            dungeon.statusbar.addText('The stairs were unlocked!', dungeon)
            dungeon.statusbar.addBreak(dungeon)


    # def unlock(self, dungeon, player):
    #     inpt = dungeon.statusbar.addYN(dungeon, 'Use a key')
    #     if inpt == 'y':
    #         (player.items[
    #             [i.itemtype for i in player.items].index('Key')
    #             ]).use(player, dungeon, 'Unlocking')
    #         self.locked = False
    #         player.items.remove(player.items[
    #             [i.itemtype for i in player.items].index('Key')
    #             ])
    #         dungeon.statusbar.addText('The stairs were unlocked!', dungeon)
    #         dungeon.statusbar.addBreak(dungeon)




