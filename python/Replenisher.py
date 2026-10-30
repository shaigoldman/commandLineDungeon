import random
import numpy as np
from Instance import Instance, Empty
import Classes
from Misc_funcs import *

class Replenisher(Instance):
    def __init__(self, dungeon=None):
        self.ismax = False
        if random.random() > .6:
            self.ismax = True
        color = 36
        if self.ismax:
            color = 95
            #93
        self.disp = hilite(RDisp(), str(color))

        self.hide()
        self.opaque = False
        self.standingon = Empty()
        self.ID = 7
        if dungeon == None:
            return
        openspaces = np.asarray(np.where(dungeon.getIDs() == 0))
        index = np.random.randint(openspaces.shape[1])
        self.x = openspaces[1, index]
        self.y = openspaces[0, index]
        dungeon.setInst(self.x, self.y, self)

    def use(self, player, dungeon):
        stat = 'Health'
        used = False
        if (player.hasMagic() and 
            ((random.random() > .5 and not player.stats['Mana'] == player.stats['Magic']) or
             (player.health == player.stats['Health']))):
            stat = 'Magic'

        name = ''
        if self.ismax:
            name += 'Max '
        name += stat +' Pod'
        dungeon.statusbar.addText('%s picked up a %s!' % (player.name, name), dungeon)
        if stat == 'Health':
            if player.health == player.stats['Health']:
                dungeon.statusbar.addText('%s has full health!' % player.name, dungeon)
            else:
                if not self.ismax:
                    player.gainHealth((player.stats['Health']/4)+1, dungeon)
                else:
                    player.gainHealth(player.stats['Health']-player.health,
                        dungeon)
                used = True
        if stat == 'Magic':
            if player.stats['Mana'] == player.getMana():
                dungeon.statusbar.addText('%s has maximum mana!' % player.name, dungeon)
            else:
                if not self.ismax:
                    player.gainMana((player.getMana()/4)+1, dungeon)
                else:
                    player.gainMana(player.getMana()-player.stats['Mana'],
                        dungeon)                    
                used = True
        dungeon.disp()
        return used

