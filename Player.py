import random
import numpy as np
import sys, os, time
from Mob import Mob
from Item import *
import Instance
import Classes
from Misc_funcs import *
from keylistener import waitForKey

class Player(Mob):

    def __init__(self, dungeon=None, statusbar=None, choseclas=True, testing=False):

        self.mysteryrange = 0

        if dungeon == None:
            return

        self.init(dungeon)
        self.testing = testing
        self.items = [Small_Health_Potion(), Escape_Rope()]
        self.keys = []

        self.sightrange = 4 + (100*testing)

        if choseclas:
            self.get_name(statusbar)
        else:
            self.name = 'Player'
            self.stats = Classes.Knight()

        self.health = self.stats['Health']
        self.stats['EXP'] = 0 #+ (99*testing)
        self.stats['Level'] = 1
        if self.name == 'Over9000' or testing:
            self.stats['Level'] = 9001
        self.stats['Effects'] = {}

        self.disp = hilite(PDisp(), '34')
        self.ID = 3
        
        self.inventorysize = 5 + (5*self.testing)
        self.score = 0


        #self.learnedWeaponry = False

        # from Item import *
        # item = None
        # for i in range(4):
        #     while not item:
        #         item = randItem()
        #     self.items.append(item())

    def normalize(self):
        self.items = self.items.tolist()
        self.keys = self.keys.tolist()
        self.weapons = self.weapons.tolist()
        if self.weapons and self.weapons[0].itemtype == 'Tome':
            if self.weapons[0].name == 'Wind Tome':
                self.weapons[0] = Wind_Tome()
            elif self.weapons[0].name == 'Fire Tome':
                self.weapons[0] = Fire_Tome()
        if self.stats['Class'] == 'Warrior':
            self.stats['Bonus'] = 'Power'
        if self.stats['Class'] == 'Mage':
            self.stats['Bonus'] = 'Magic'
        if self.stats['Class'] == 'Scout':
            self.stats['Bonus'] = 'Speed'
        if self.stats['Class'] == 'Knight':
            self.stats['Bonus'] = 'Health'
        else:
            self.stats['Bonus'] = 'Power'

    def get_name(self, statusbar):
        statusbar.addText('What is your name?')
        self.name = raw_input()
        self.name = ' '.join(word[0].upper() + word[1:] for word in self.name.split())
        if self.name == '':
            self.name = 'Test'
        self.stats = self.get_class(statusbar)
        if self.stats['Class'] == 'Mage':
            self.chooseTome(statusbar)
            self.items.append(Mana_Potion())
        if not self.testing:
            statusbar.addText('Use the arrow keys to move. Press I to use items. \nRun into monsters to attack. Try to find the stairs.')
            statusbar.addQuery('Press any key to begin.', printans=False)
            time.sleep(.2)

    def get_class(self, statusbar):
        if self.name == 'Over9000' or self.testing:
            self.sightrange = 400
            return Classes.Over9000()

        choices = {'a': Classes.Warrior(), 'b': Classes.Knight(),
                    'c': Classes.Scout(), 'd': Classes.Mage()}
        while 1:
            statusbar.addText(('Choose a class:\n'+
                ' a] %s\n b] %s\n c] %s\n d] %s\n'+
                'Press a, b, c, or d.') % (choices['a']['Class'], choices['b']['Class'], choices['c']['Class'], choices['d']['Class']))
            choice = statusbar.addQuery('')
            if choice in ['a', 'b', 'c', 'd', '*']:
                break
            printSlowly('That is not a valid option.')
            statusbar.clear()
            os.system('clear')
        if choice == '*':
            return Classes.Sucks()
        inpt = statusbar.addQuery('View stats (y/n)?')
        if inpt == 'y': 
            Classes.printStats(choices[choice], statusbar=statusbar)
        inpt = statusbar.addQuery('Choose this class (y/n)?')
        if inpt == 'y':
            return choices[choice]
        else:
            return self.get_class(statusbar)

    def chooseTome(self, statusbar):
        while 1:
            inpt = statusbar.addOptionList(None, ['Wind', 'Fire', 'Water'], 
                    includeNoneOpt=False, startText='Choose a magic book element:')
            from Tome import Magic_Staff
            tome = Magic_Staff(element=inpt.lower())
            tome.printDisc(None, statusbar)
            inpt2 = statusbar.addYN(None, 'View Spells')
            if inpt2 == 'y':
                tome.printSpells(None, statusbar, self)
            statusbar.addText('')
            inpt3 = statusbar.addYN(None, 'Choose this tome')
            if inpt3 == 'y':
                self.weapons.append(tome)
                return

    def endFight(self, mob):
        self.fighting = None
        if mob:
            mob.fighting = None

    def fight(self, mob, statusbar, dungeon, printStats=True):
        
        self.fighting = mob
        mob.fighting = self
        dungeon.disp()

        statusbar.addText((mob.boldName()), dungeon)
        done = False
        
        while not done:
            if mob.pacible:
                inpt = statusbar.addOptionList(dungeon,
                    ['Fight %s' % mob.name, 
                    'Talk to %s' % mob.name])
                dungeon.statusbar.clear(dungeon, dispDung=True)
                
                if inpt == 'Talk to %s' % mob.name:
                    mob.talk(self, dungeon)
                    self.endFight(mob)
                    return
                if inpt == None:
                    self.endFight(mob)
                    dungeon.statusbar.clear()
                    return
                else:
                    inpt = 'y'
            else:
                inpt = statusbar.addQuery('Fight the %s (y/n)?' % (mob.name), dungeon)
            
            if (inpt == 'y' or inpt == 'n'):
                done = True
            else:
                statusbar.addText('That is not a valid option.'
                    , dungeon, endsegment=True)

        when = 'During Combat'

        if inpt == 'y':
            done = False
            #define who goes first 
            playerFirst = self.willAttackFirst(mob, dungeon)
            #Inform hit rates
            self.determineHitRate(mob, dungeon, usingWeapons=bool(self.weapons),  
                printCalculation=True, printRate=True, waitForResp=False)
            mob.determineHitRate(self, dungeon, usingWeapons=bool(mob.weapons), 
                printCalculation=False, printRate=True, waitForResp=True)
            #fight
            while not done:
                while 1:
                    options = ['Attack the %s' % mob.name]
                    if self.items:
                        options.append('Use an item')
                    if self.hasMagic() and self.getAvailableSpells(when):
                        options.append('Use Magic')
                    choice = dungeon.statusbar.addOptionList(dungeon, options, noneOptTxt='End Attack')

                    dungeon.statusbar.clear(dungeon, dispDung=True)

                    if not choice:
                        dungeon.statusbar.endSegment(dungeon)
                        done = True
                        break
                    else:
                        dungeon.statusbar.addBreak(dungeon)
                        if choice == 'Use an item':
                            self.useItem(dungeon, when=when)
                        elif choice == 'Use Magic':
                            self.castCombatSpells(dungeon, mob)
                        else:
                            break
                    if not mob.alive or done:
                        done = True
                        break

                if not mob.alive or done:
                    done = True
                    break

                contiueAttack = 1
                while not done and contiueAttack:
                    if playerFirst:
                        self.attack(mob, dungeon)
                    if not mob.alive:
                        done=True
                        break
                    if mob.fight:
                        mob.fight(self, dungeon)
                        if not self.alive:
                            done=True
                            break
                            #break
                    if not playerFirst and mob.alive and self.alive:
                        contiueAttack *= self.attack(mob, dungeon)
                    if not mob.alive:
                        done=True
                        #break
                    contiueAttack *= (self.health > (mob.stats['Power'] * 1.2))

                statusbar.addBreak(dungeon)

        statusbar.clear()
        if self.alive:
            if not mob.alive:
                statusbar.addText('Continue exploring the dungeon!', dungeon, endsegment=True)
            self.endFight(mob)

    def flee(self, monster, dungeon):
        while 1:
            opts = ['Flee']
            if self.getAvailableItems('When Fleeing'):
                opts.append('Use Item')
            opts.append('Fight')
            inpt = dungeon.statusbar.addOptionList(dungeon, opts, includeNoneOpt=False)
            if inpt == 'Fight':
                return
            elif inpt == 'Flee':
                numerator = self.stats['Speed'] - monster.stats['Speed']
                denomenator = (self.stats['Speed'] + monster.stats['Speed'])/2.
                fleechance = numerator / denomenator
                if fleechance <= .3:
                    fleechance = .3
                if fleechance > 1:
                    fleechance = 1

                dungeon.statusbar.addText('Flee chance: %.2f' % fleechance)

                if 'Escape Rope' in [i.itemtype for i in self.items]:
                    item = self.items[[i.itemtype for i in self.items].index('Escape Rope')]
                    inpt2 = dungeon.statusbar.addYN(dungeon, 'Use the escape rope?')
                    if inpt2 == 'y':
                        item.use(self, dungeon, 'When Fleeing')
                        self.items.remove(item)
                        return self.escape(dungeon)
                    else:
                        dungeon.statusbar.addText('%s attempted to flee with no escape rope!' % self.name, 
                            dungeon, waitForResp=True)
                break
            elif inpt == 'Use Item':
                item = self.useItem(dungeon, when='When Fleeing')
                if item and item.itemtype == 'Escape Rope':
                    return self.escape(dungeon)
            dungeon.statusbar.addNotValid(dungeon)
        
        fleed = random.random() < fleechance
        if fleed:
            return self.escape(dungeon)
        else:
            dungeon.statusbar.addText('Couldn\'t get away!', dungeon, endsegment=True, waitForResp=True)
        return fleed

    def escape(self, dungeon):
        dungeon.statusbar.addText('You got away safely!', dungeon, endsegment=True, waitForResp=True)
        self.endFight(self.fighting)
        dungeon.disp()
        return True

    def die(self, dungeon):
        self.disp = hilite(DieDisp(), '30')
        self.alive = False
        dungeon.disp()
        dungeon.statusbar.addText('You died!', dungeon, endsegment=True)
        self.gameEnd(dungeon)

    def win(self, dungeon):
        self.score += 1000
        #dungeon.statusbar.addText('%s escaped the dungeon!' % self.name)
        dungeon.statusbar.addText('You won!!')
        inp = dungeon.statusbar.addQuery('Continue (y/n)?')
        if inp == True:
            self.gameEnd(dungeon)

    def gameEnd(self, dungeon):
        if self.name == 'Test' or self.name == 'Over9000':
            sys.exit()
        try:
            f = open('high_score.txt', 'r')
            high_score = f.read()
            f.close
            high_score = int(high_score)
        except:
            high_score = 0

        if self.score > high_score:
            dungeon.statusbar.addText('You beat the high score!', dungeon)
            high_score = self.score
            f = open('high_score.txt', 'w')
            f.write('%d' % high_score)
            f.close()

        dungeon.statusbar.addText('Your score: %d. High Score: %d' 
            % (self.score, high_score), dungeon, endsegment=False)

        dungeon.statusbar.addText('(Press up and enter to play again)', dungeon)

        import saving
        savefile = self.name + '.sav'
        saving.removeFile(savefile)


        sys.exit()

    def getAvailableSpells(self, when='Noncombat'):
        availableSpells = []
        for item in self.getItemsPlusWeapon():
            if item.itemtype == 'Tome':
                availableSpells.extend(item.getAvailableSpells(self, when=when))
                
        availableSpells = np.asarray(
            availableSpells)[np.unique([spell.name for spell in availableSpells], return_index=True)[1]].tolist()

        order = np.asarray([spell.cost for spell in availableSpells]).argsort()
        return np.asarray(availableSpells)[order].tolist()

    def chooseSpell(self, dungeon, when='Noncombat'):
        availableSpells = self.getAvailableSpells(when)
        availableSpellsNames = ['%s (cost=%s mana)' % (spell.name, spell.cost) for spell in availableSpells]
        inpt1 = dungeon.statusbar.addOptionList(dungeon, availableSpellsNames)
        if not inpt1:
            return inpt1
        choice = availableSpells[availableSpellsNames.index(inpt1)]


        dungeon.statusbar.addPermText(color.BOLD+choice.name+color.END)
        while 1:
            dungeon.statusbar.clear(addcurvy=False)
            dungeon.disp()
            opts = ['Cast', 'View Description']
            inpt2 = dungeon.statusbar.addOptionList(dungeon, opts, noneOptTxt='Back')
            if not inpt2:
                dungeon.statusbar.revertPermText()
                dungeon.statusbar.addBreak(dungeon)
                return self.chooseSpell(dungeon, when=when)
            elif inpt2 == 'View Description':
                dungeon.statusbar.clear(addcurvy=False)
                dungeon.disp()
                text = choice.getDisc(caster=self, includeName=False)
                dungeon.statusbar.addText(text, dungeon, clearable=False)
                dungeon.statusbar.endSegment(dungeon, printCont=False)
                dungeon.statusbar.addBreak(dungeon, dispDung=True)
            elif inpt2 == 'Cast':
                dungeon.statusbar.revertPermText()
                return choice


    def castCombatSpells(self, dungeon, mob):
        #spell = self.weapon.viewSpells(self, 'During Combat', dungeon)
        spell = self.chooseSpell(dungeon, when='During Combat')
        if spell:
            spell.cast(dungeon, self, mob)
        dungeon.statusbar.addBreak(dungeon)

    def getAvailableItems(self, when, acceptAnytime=True):
        availableItems = []
        for i in self.items:
            if when in i.when_use or ('Anytime' in i.when_use  and acceptAnytime):
                availableItems.append(i)
        return availableItems

    def pickUpItem(self, item, dungeon, source='floor', monname=None):
        antext = 'a'
        if item.name[0] in ['a', 'e', 'o', 'i', 'u',
                            'A', 'E', 'O', 'I', 'U']:
            antext +='n'
        if item.isProperName:
            antext = ''
        if source == 'floor':
            dungeon.statusbar.addText('You stepped on %s %s!' % (antext, item.name), dungeon)
        elif source == 'monster':
            dungeon.statusbar.addText('The %s dropped %s %s!' % 
                (monname, antext, item.name), dungeon)
        elif source == 'Deal':
            dungeon.statusbar.addText('You got %s %s!' % 
                (antext, item.name), dungeon)       

        item.printDisc(dungeon) 

        if item.itemtype == 'Key':
            self.keys.append(item)
            dungeon.statusbar.addText('You got the key!', dungeon)
            return item
        
        opts = []
        opts.append('Pick up')
        if item.itemtype == 'Tome':
            opts.append('View spells')
        if 'Noncombat' in item.when_use or 'Anytime' in item.when_use:
            if (item.itemtype == 'Tome' or item.itemtype == 'Weapon'):
                if self.shouldEquip(item):
                    opts.append('Equip')
            else:
                opts.append('Use')
        opts.append('Ignore')
        if source == 'floor':
            opts.append('Trash')

        inpt = None
        if not item.pickupable:
            inpt = 'Use'
        while inpt not in ['Pick up', 'Use', 'Equip', 'Ignore', 'Trash']:
            inpt = dungeon.statusbar.addOptionList(
                dungeon, opts, includeNoneOpt=False)
            dungeon.statusbar.addBreak(dungeon)
            if inpt == 'View spells':
                item.printSpells(dungeon)
                dungeon.statusbar.endSegment(dungeon, False)
            if inpt == 'View description':
                item.printDisc(dungeon)
                dungeon.statusbar.endSegment(dungeon, False)

        if inpt == 'Ignore':
            return False

        if inpt == 'Trash':
            self.standingon = item.standingon
            dungeon.statusbar.addText('%s trashed the %s.' % 
                (self.name, item.name), dungeon, endsegment=True)
            return False

        self.items.append(item)
        if inpt == 'Use' or inpt == 'Equip':
            self.useSpecificItem(item, 
                dungeon, 'Noncombat', showoptions=False)
        
        if len(self.items) > self.inventorysize - 1*bool(self.weapons):
            self.dropItem(dungeon)
        elif source != 'monster':
            dungeon.statusbar.endSegment(dungeon)

        return item


    def useSpecificItem(self, item, dungeon, 
        when='Noncombat', showoptions=True):

        while 1:
            q = None
            if item in self.weapons:
                q = 'Unequip'
            elif (item.itemtype == 'Weapon' or item.itemtype == 'Tome') and not item in self.weapons:
                if self.shouldEquip(item):
                    q = 'Equip'
            elif item.itemtype == 'Projectile':
                q = 'Throw'
            else :
                q = 'Use'
            if showoptions:
                opts = []
                if (when in item.when_use) or ('Anytime' in item.when_use) and q:
                    opts.append(q)
                if item.itemtype == 'Tome':
                    opts.append('View Spells')
                opts.append('View Description')
                opts.append('Drop')
                inpt = dungeon.statusbar.addOptionList(dungeon, opts, noneOptTxt='Back')
                if inpt == None:
                    return False
                if inpt == q:
                    item.use(self, dungeon, when)
                    if item.used:
                        self.items.remove(item)
                        return item
                    return False
                elif inpt == 'View Spells':
                    item.printSpells(dungeon)
                elif inpt == 'View Description':
                    item.printDisc(dungeon)
                elif inpt == 'Drop':
                    item.drop(self, dungeon)
                    return item
            else:
                item.use(self, dungeon, when)
                if item.used:
                    self.items.remove(item)
                    return item
                return False

    def unequip(self, dungeon):
        
        opts = [w.name for w in self.weapons]
        
        choice = dungeon.statusbar.addOptionList(self, dungeon, opts, includeNoneOpt=True,
                      noneOptTxt='Back', startText='%s\'s weapons:' % self.name)
        
        if not choice:
            return False
        
        for i in range(0,len(opts)):
            if opts[i]==choice:
                index = i
        
        self.weapons[index].unequip(self, dungeon)
        return True
        

    def listItems(self, dungeon, shownone=True):
        dungeon.statusbar.addText(('%s\'s inventory:' % 
            self.name), dungeon)

        if self.weapons:
            for w in range(len(self.weapons)):
                dungeon.statusbar.addText(' %d] '%(w+1)+self.weapons[w].name, dungeon)

        letters = 'abcdefghijklmnopqrstuvqxyz'
        endIndex = len(self.items)
        if shownone:
            endIndex += 1
        letters = letters[:endIndex]
        i=-1
        for i in range(len(self.items)):
            dungeon.statusbar.addText(' '+letters[i]+'] '+self.items[i].name, dungeon)
        if shownone:
            dungeon.statusbar.addText(' '+letters[i+1]+'] None', dungeon)
        inpt = dungeon.statusbar.addQuery('Choose an item.')
        dungeon.statusbar.addBreak(dungeon)

        return inpt, letters

    def whichWeapon(self, inputKey):
        return self.weapons[int(inputKey)-1]

    def dropItem(self, dungeon, source='Too Many'):
        dungeon.statusbar.addBreak(dungeon)

        if not self.items:
            dungeon.statusbar.addText('%s has no items!' % self.name, dungeon)
            return

        if source == 'Too Many':
            dungeon.statusbar.addText('You can\'t hold this many items!', dungeon)
            dungeon.statusbar.addText('%s\'s inventory size: %d' % (self.name, self.inventorysize), dungeon)
        text ='Choose an item to drop'
        if source == 'Too Many':
            text += ' or use'
        dungeon.statusbar.addText(text+':', dungeon)

        while 1:
            inpt, options = self.listItems(dungeon, shownone=False)
            if not (inpt in options or (inpt in numberchars() and self.weapons and len(inpt)<=2)):
                dungeon.statusbar.addText(
                    'That is not a valid option.', 
                    dungeon, endsegment=True)
            else:
                break
        if inpt in numberchars():
            whichweapon = self.whichWeapon(inpt)
            dungeon.statusbar.addText(('You dropped the %s!' 
                % whichweapon.name), dungeon)
            dropped = whichweapon
            self.weapons.remove(dropped)
        else:
            index = options.index(inpt)
            dropped = self.items[index]
            if source == 'Deal':
                self.items[index].drop(self, dungeon)
            elif not self.useSpecificItem(self.items[index], dungeon, when='Noncombat'):
                self.dropItem(dungeon, source)

        dungeon.statusbar.addBreak(dungeon)
        return dropped

    def useItem(self, dungeon, when='Noncombat'): 
        if not self.items and not self.weapons:
            dungeon.statusbar.addText('You have no items!', dungeon, endsegment=True)
            return False

        inpt, options = self.listItems(dungeon)

        if not(inpt in options[:-1] or inpt in numberchars()):
            return
        if not inpt in numberchars():
            index = options.index(inpt)
            self.items[index].printDisc(dungeon)
            useditem = self.useSpecificItem(self.items[index], dungeon, when)
        else:
            whichweapon = self.whichWeapon(inpt)
            whichweapon.printDisc(dungeon)
            useditem = self.useSpecificItem(whichweapon, dungeon, when)

        dungeon.disp()
        dungeon.statusbar.addBreak(dungeon)

        return useditem


    def climb(self, staircase, dungeon):
        newD = staircase.use(self, dungeon)
        if newD:
            for i in vars(dungeon):
                if i != 'statusbar':
                    setattr(dungeon, i, vars(newD)[i])
        dungeon.disp()

    def action(self, key, dungeon):
        import saving
        savefile = self.name + '.sav'
        saving.saveGame(dungeon, savefile)

        #----Move---#
        moved = self.move(key, dungeon)
        if moved:
            dungeon.revMatrix = dungeon.getRevMatrix()
            dungeon.disp()
            self.takePoison(dungeon)
            
            #---Item---#
            if self.standingon.ID == 5:
                steppedOn = self.pickUpItem(self.standingon, dungeon)
                if steppedOn:
                    self.standingon = steppedOn.standingon
            #---Replenisher---#
            if self.standingon.ID == 7:
                used = self.standingon.use(self, dungeon)
                if used:
                    self.standingon = self.standingon.standingon
            #---Stairs---#
            if self.standingon.ID == 6:
                self.climb(self.standingon, dungeon)
            
            return True

        #----Yield----#
        if key == ' ':
            dungeon.disp()
            return True

        #----Fight Monsters----#
        if self.checkDirection(key, 4, dungeon) == 'up':
            self.fight(dungeon.dung[self.y-1, self.x], dungeon.statusbar, dungeon)
        elif self.checkDirection(key, 4, dungeon) == 'down':
            self.fight(dungeon.dung[self.y+1, self.x], dungeon.statusbar, dungeon)
        elif self.checkDirection(key, 4, dungeon) == 'right':
            self.fight(dungeon.dung[self.y, self.x+1], dungeon.statusbar, dungeon)
        elif self.checkDirection(key, 4, dungeon) == 'left':
            self.fight(dungeon.dung[self.y, self.x-1], dungeon.statusbar, dungeon)

        #----Get Help----#
        elif key == 'h':
            dungeon.statusbar.addText('You are the %s.\n' % self.disp+
                'Navigate through the dungeon with the arrow keys.\n'+
                'Attack monsters for experience points (EXP) and level-ups.\n'+
                'Press s to view your stats.'+
                '\nPress i to view your items.'+
                '\nPress space to yield your turn to monsters.\nPress v to save your progress.', dungeon, endsegment=False)
            dungeon.statusbar.endSegment(dungeon)

        #----Stats----#
        elif key == 's':
            self.printStats(dungeon.statusbar, dungeon, ask=False)
            dungeon.statusbar.endSegment(dungeon)

        #----Items----#
        elif key == 'i':
            self.useItem(dungeon, when='Noncombat')
            dungeon.statusbar.endSegment(dungeon)

        #----Save----#
        elif key == 'v':
            import saving
            inpt = dungeon.statusbar.addQuery('Save your progress (y/n)?')
            if inpt == 'y':
                savefile = self.name + '.sav'
                saving.saveGame(dungeon, savefile)
            inpt = dungeon.statusbar.addQuery('Quit the game (y/n)?')
            if inpt == 'y':
                sys.exit()

        #---Spells---#
        elif key == 'm' and self.hasMagic():
            spell = self.chooseSpell(dungeon, when='Noncombat')
            if spell:
                spell.cast(dungeon, self)
            dungeon.statusbar.endSegment(dungeon)

        #----Conclude Actions----#
        if self.alive:
            dungeon.disp()
        return False

    def levelUp(self, dungeon):
        dungeon.statusbar.addBreak(dungeon)
        self.score += 100
        dungeon.statusbar.addText(u'\x1b[A', dungeon, delay=0, newline=False, endsegment=True)
        self.stats['Level'] += 1
        dungeon.statusbar.addText('Level up!', dungeon)
        dungeon.statusbar.addText('%s:' % self.name, dungeon)
        dungeon.statusbar.addText('Level %d' % self.stats['Level'], dungeon)

        for i in self.stats:
            if i == 'Health':
                rand = int(random.random()*7)+2
            elif i == 'Mana':
                continue
            elif i == 'Armor':
                rand = int(random.random()*3)
            else:
                rand = int(random.random()*4)

            if (i != 'Level' and i != 'EXP' 
                and i != 'Class' and i != 'Effects'
                and i != 'Bonus'):
                if self.stats['Bonus'] == i:
                    rand += 2
                    dungeon.statusbar.addText('%s + %d + 2 = %d' % (i, rand-2, 
                        self.stats[i]+rand), dungeon)
                else:
                    dungeon.statusbar.addText('%s + %d = %d' % (i, rand, 
                        self.stats[i]+rand), dungeon)
                self.stats[i] += rand

        self.health = self.stats['Health']
        self.stats['Mana'] = self.getMana()
        dungeon.statusbar.addText('Mana Replenished!', dungeon)
        dungeon.statusbar.addText('Health Restored!', dungeon)
        self.stats['EXP'] -= 100

        dungeon.statusbar.endSegment(dungeon, False)
        dungeon.statusbar.clear()
        dungeon.disp()

        opts = self.stats.keys()
        remover = ['Level', 'Mana', 'Class',
                    'Effects', 'Bonus', 'Accuracy', 'Speed']
        for r in remover:
            opts.remove(r)
        opts.append('Accuracy + Speed')
        
        if 'Armor' in opts and (self.stats['Level']%3 != 0 or self.stats['Class'] != 'Knight'):
            opts.remove('Armor')

        inpt = dungeon.statusbar.addOptionList(dungeon, opts, 
            includeNoneOpt=False, startText='Choose an additional stat to increase.')
        if inpt == 'EXP':
            dungeon.statusbar.addText('%s gained 20 EXP!' % self.name, dungeon, endsegment=True)
            self.stats['EXP'] += 20
        elif inpt == 'Accuracy + Speed':
            stats = ['Accuracy', 'Speed']
            for stat in stats:
                dungeon.statusbar.addText('%s + 2 = %d' % (stat,
                    self.stats[stat]+2), dungeon)
                self.stats[stat] += 2
        else:
            dungeon.statusbar.addText('%s + 2 = %d' % (inpt,
                self.stats[inpt]+2), dungeon)
            self.stats[inpt] += 2

        dungeon.disp()
        if self.stats['EXP'] >= 100:
            self.levelUp(dungeon)
            dungeon.statusbar.addBreak(dungeon)
        else:
            dungeon.statusbar.endSegment(dungeon)




