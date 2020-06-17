def getDefaultOptions():
    return {
        'Scroll speed': 0.3,
        'Difficulty': 'Normal',
        'Autosave': True
    }

def getCurOptions():
    try:
        f = open('Options.opt', 'r')
        optstring = f.read()
        f.close()
        return saving.loadDict(optstring)
    except IOError:
        print 'eerr'
        opts = getDefaultOptions()
        savestr = saving.saveDict(opts)
        f = open('Options.opt', 'w')
        f.write(savestr)
        f.close()
        return opts

def settingsChange(statusbar=None, dungeon=None):
    if not statusbar:
        statusbar = dungeon.statusbar