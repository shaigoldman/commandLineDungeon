from keylistener import sysIsWindows

def PDisp():
    if sysIsWindows():
        return 'P'
    else:
        return unichr(11494)


def DieDisp():
    if sysIsWindows():
        return 'X'
    else:
        return unichr(9760)


def ZDisp(level):
    if sysIsWindows():
        if level < 3:
            return 'z'
        return 'Z'
    else:
        if level > 3:
            return unichr(993)
        return unichr(992)


def SDisp(level):
    if sysIsWindows():
        if level < 3:
            return 's'
        return 'S'
    else:
        if level > 3:
            return unichr(1126)
        return unichr(1127)


def NDisp(level):
    if sysIsWindows():
        if level < 3:
            return 'n'
        return 'N'
    else:
        if level > 3:
            return unichr(3219)
        return unichr(3218)

def ParDisp(level):
    if sysIsWindows():
        if level < 3:
            return 't'
        return 'T'
    else:
        return unichr(2610)

def GolDisp(level):
    if sysIsWindows():
        if level < 3:
            return 'h'
        return 'H'
    else:
        return unichr(11658)

def NPCDisp(typ):
    if typ == 0:
        return unichr(11741)
    elif typ == 1:
        return unichr(11669)
    else:
        return unichr(6057)

def DDisp():
    if sysIsWindows():
        return 'D'
    else:
        return unichr(3842)


def IDisp():
    if sysIsWindows():
        return 'I'
    else:
        return unichr(4034)


def RDisp():
    if sysIsWindows():
        return 'R'
    else:
        return unichr(990)


def stairDisp():
    if sysIsWindows():
        return '^'
    else:
        return unichr(5954)
