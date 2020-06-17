import random, os
from Dungeon import Dungeon
from Player import Player
from keylistener import *
from Statusbar import Statusbar
import saving

def loadD():

    testing = True
    testing = False
    usingsav = None
    
    if not sysIsWindows():
        os.system('clear')
    else:
        os.system('cls')

    S = Statusbar()

    fnames = os.listdir(os.getcwd())
    savefiles = []
    for f in fnames:
        if '.sav' in f:
            savefiles.append(f)
    S.disp(hlp=False)
    inpt = ''
    if len(savefiles)>0:
            inpt = S.addQuery('Load a previous save file (y/n)?')
            letters = 'abcdefghijklmnopqrstuvwxyz1234567890'
            if inpt == 'y':
                optstr = ''
                for i in range(len(savefiles)):
                    optstr += ' '+letters[i]+'] '+savefiles[i]+'\n'
                optstr += ' '+letters[i+1]+'] none'
                S.addText(optstr)
                rsp = 'ughty'
                while not rsp in letters[:len(savefiles)+1]:
                    rsp = S.addQuery('Choose a save file.')
                rsp = letters.index(rsp)
                if rsp == i+1:
                    usingsav = None
                else:
                    usingsav = savefiles[rsp]
                    import saving
                    D = saving.loadGame(usingsav)
                    P = D.P
    if not usingsav:
        zlevel = 0
        if inpt == 't':
            testing = True
        zlevel = 50*testing
        numitems = 10+(30*testing)
        #numitems =0

        D = Dungeon(legnth=30, height=15, numitems=numitems,
            numrooms=8, maxroomsize=5, minroomsize=3, zlevel=zlevel)
        P = Player(D, S, True, testing)
        D.addP(P)
        from Npc import Npc
        for i in range(15*testing):
            D.addM(Npc(D))

    return D


def main():

    D = loadD()

    D.disp()
    D.disp()

    while 1:
        direction = waitForKey()
        moved = D.P.action(direction, D)

        if moved:
            for m in D.Ms:
                m.health = int(m.health)
                m.action(D)
            D.disp()
        if D.P.stats['Speed']>5 and D.P.alive:
            D.P.health = int(D.P.health)
            direction = waitForKey()
            moved = D.P.action(direction, D)
        if moved:
            for m in D.Ms:
                if m.stats['Speed']>5:
                    m.action(D)
            D.disp()
        
        if not D.P.alive:
            break
    
main()

