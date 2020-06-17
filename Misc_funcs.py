import sys, time
import numpy as np
from keylistener import *
import collections
from Disps import *
import random

def getDelay():
  if sysIsWindows():
    return .01
  else:
     return .02

def isStdChar(char):
  return char in ('abcdefghijklmnopqrztuvwxyz'+
    '1234567890' + ',.;:\'\"()!%-_+=')


def printSlowly(string, makeNewLine=True, delay=getDelay(), waitForResp=False):       
  for i in range(len(string)):
      def method():
          sys.stdout.write(string[i])
          sys.stdout.flush()
          if isStdChar(string[i]):
            time.sleep(delay)
      if breakIfKey(method=method, maxiter=1):
          sys.stdout.write(string[i+1:])
          break
  if waitForResp:
      waitForRsp(True)
  if makeNewLine:
      print("")


def waitForRsp(includeArrows=False):
    while 1:
        key = waitForKey()
        try:
            if len(key) == 1 and not includeArrows:
                break
            elif includeArrows:
                break
        except TypeError:
            pass
    return key
    

def hilite(string, attr='32', bold=False):
    attr = [attr]
    if bold:
        attr.append('1')
    return '\x1b[%sm%s\x1b[0m' % (';'.join(attr), string)

def unhilite(string):
  string = string[string.index('m')+1:]
  string = string[:string.index('\x1b')]
  return string

def numberchars():
    return "1234567890"

class color:
   PURPLE = '\033[95m'
   CYAN = '\033[96m'
   DARKCYAN = '\033[36m'
   BLUE = '\033[94m'
   GREEN = '\033[92m'
   YELLOW = '\033[93m'
   RED = '\033[91m'
   BOLD = '\033[1m'
   UNDERLINE = '\033[4m'
   END = '\033[0m'

class arrow:
    UP = u'\x1b[A'
    DOWN = u'\x1b[B'
    RIGHT = u'\x1b[C'
    LEFT = u'\x1b[D'

def randInt(mx):
    return int(random.random()*mx)

def randFromList(lis):
    if not lis:
      print 'No list here!'
      return None
    return lis[randInt(len(lis))]

def randomName(maxlen=3):
    csnt = list('bcdfghklmnprstvwxyz')
    csnt.extend(['sh', 'ch'])
    starts = ['j',
      'br', 'cr', 'dr', 'fr', 'gr', 'kr',
      'pr', 'sr', 'tr', 'vr', 'wr',
      'qu', 'dj', 'dw', 'sw'
      'bl', 'cl', 'fl', 'pl', 'sl', 'zl']
    vowels = list('aeiouaeiouaeiou')
    vowels.extend(['oo', 'ea', 'ou', 'ie', 'ei',
      'ai', 'oi', 'ii', 'ee'])
    name = ''
    for i in range(randInt(maxlen)+1):
        if random.random()>.5:
            name += csnt[randInt(len(csnt))]
        elif random.random()>.2:
            name += starts[randInt(len(starts))]
        name += vowels[randInt(len(vowels))]
        if random.random()>.5:
            name += csnt[randInt(len(csnt))]
    return name




