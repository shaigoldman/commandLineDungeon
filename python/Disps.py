from keylistener import sysIsWindows

def PDisp():
    if sysIsWindows():
        return 'P'
    else:
        return chr(11494)


def DieDisp():
    if sysIsWindows():
        return 'X'
    else:
        return chr(9760)


def ZDisp(level):
    if sysIsWindows():
        if level is None or level < 3:
            return 'z'
        return 'Z'
    else:
        if level is None or level < 3:
            return chr(993)
        return chr(992)


def SDisp(level):
    if sysIsWindows():
        if level is None or level < 3:
            return 's'
        return 'S'
    else:
        if level > 3:
            return chr(1126)
        return chr(1127)


def NDisp(level):
    if sysIsWindows():
        if level < 3:
            return 'n'
        return 'N'
    else:
        if level > 3:
            return chr(3219)
        return chr(3218)

def ParDisp(level):
    if sysIsWindows():
        if level < 3:
            return 't'
        return 'T'
    else:
        return chr(2610)

def GolDisp(level):
    if sysIsWindows():
        if level < 3:
            return 'h'
        return 'H'
    else:
        return chr(11658)

def NPCDisp(typ):
    if typ == 0:
        return chr(11741)
    elif typ == 1:
        return chr(11669)
    else:
        return chr(6057)

def DDisp():
    if sysIsWindows():
        return 'D'
    else:
        return chr(3842)


def IDisp():
    if sysIsWindows():
        return 'I'
    else:
        return chr(4034)


def RDisp():
    if sysIsWindows():
        return 'R'
    else:
        return chr(990)


def stairDisp():
    if sysIsWindows():
        return '^'
    else:
        return chr(5954)
