import sys, time, os
from keylistener import breakIfKey, waitForKey
from Misc_funcs import *

class Statusbar(object):

    def __init__(self):
        self.text = ''
        self.revertPermText()
    
    def disp(self, hlp=True):
        sys.stdout.write(self.permtext+self.text)

    def addPermText(self, text):
        self.permtext += text

    def revertPermText(self):
        self.permtext = '\n ------------------------------ \n'
    
    def addText(self, text, dungeon=None, newline=True, 
        delay=0.04, endsegment=False, clearable=True,
        waitForResp=False):

        if '~' in text:
            print text, 'found em'

        if endsegment and not self.text[len(self.text)-2] == '~':
            text+='\n~\n'
            newline = False

        printSlowly(text, makeNewLine=newline, waitForResp=waitForResp)
        # if dungeon==None:
        #     raise(ValueError('no dungeon %s'%text))
        self.text += text
        if newline:
            self.text += '\n'

        if len(self.text) > 100 and clearable:
            try:
                self.mostlyClear(50, dungeon)
                dungeon.disp()
            except:
                self.mostlyClear(100, dungeon)
                if not sysIsWindows():
                    os.system('clear')
                else:
                    os.system('cls')
                self.disp(hlp=False)
        if len(self.text) > 250:
            self.text = self.text[self.text.index('\n'):]


    def addQuery(self, text, dungeon=None, delay=0.04, 
            printans=True, includeArrows=False, space=True,
            specificLetter=None):
        spce = ' '
        if not space:
            spce = ''

        printSlowly(text+spce, makeNewLine=False)
        while 1:
            key = waitForRsp(includeArrows=includeArrows)
            if not specificLetter or key == specificLetter:
                break
        if printans:
            printSlowly(key, makeNewLine=True)
        else:
            printSlowly('', makeNewLine=True)
        return key
    
    def endSegment(self, dungeon, printCont=True, includeArrows=True, specificLetter=None):
        self.addBreak(dungeon, clearable=False)
        if not 'to continue' in self.text[len(self.text)/2:] and not specificLetter:
            nonArrow = ''
            if not includeArrows:
                nonArrow = '(non arrow) '
            self.addQuery('Press any %skey to continue.' % nonArrow, dungeon, printans=False, includeArrows=includeArrows)
        if specificLetter:
            self.addQuery('Press %s to continue.' % specificLetter, dungeon, printans=False, includeArrows=includeArrows)
        self.clear()
        if printCont:
            self.addText('Continue exploring the dungeon!', 
                dungeon, endsegment=True)

        
    def addBreak(self, dungeon, clearable=True, dispDung=False):
        if self.text[len(self.text)-2] == '~':
            return
        self.addText(u'\x1b[A', dungeon, delay=0, 
            newline=False, endsegment=True, clearable=clearable)
        if dispDung:
            dungeon.disp()


    def addNotValid(self, dungeon):
        self.addText('That is not a valid option.', dungeon, delay=0, newline=True, endsegment=True)

    def addYN(self, dungeon, query):
        while 1:
            inpt = self.addQuery(query+' (y/n)?')
            if inpt == 'y' or inpt == 'n':
                return inpt
            self.addNotValid(dungeon)

    def addOptionList(self, dungeon, options, includeNoneOpt=True,
        noneOptTxt='None', startText='Choose one:'):
        letters = 'abcdefghijklmnopqrstuvwxyz1234567890'
        letters = letters[:len(options)+1]

        if not includeNoneOpt and len(options) == 1:
            self.addYN(dungeon, options[0])

        i=-1
        self.addText(startText, dungeon)
        for i in range(len(options)):
            self.addText(' %s] %s' % (letters[i], options[i]), dungeon)
        if includeNoneOpt:
            self.addText(' %s] %s' % (letters[i+1], noneOptTxt), dungeon)

        inpt = self.addQuery('', space=False)

        if inpt in letters[:-1]:
            return options[letters.index(inpt)]
        else:
            if includeNoneOpt:
                return None
            else:
                self.addNotValid(dungeon)
                return self.addOptionList(dungeon, options, includeNoneOpt,
                    noneOptTxt, startText)

                
    def clear(self, dungeon=None, dispDung=False, addcurvy=True):
        #printSlowly('~\n',False,0.03)
        if addcurvy:
            self.text = '\n~\n'
        else:
            self.text = '\n'
        if dungeon and dispDung:
            dungeon.disp()

    def mostlyClear(self, chars, dungeon):
        #self.addQuery('Press any key to continue.', dungeon,
        #    printans=False, clearable=False)
        #printSlowly('\n')
        start = len(self.text) - chars
        while 1:
            try:
                self.text = self.text[self.text.index('~')+1:]
            except ValueError:
                break
        print ''


