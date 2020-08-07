import collections

def orderStats(stats, classname):

    ordered = collections.OrderedDict([
        ('Class', classname), ('Bonus', stats['Bonus']),
        ('Health', stats['Health']), ('Power', stats['Power']), 
        ('Luck', stats['Luck']), ('Accuracy', stats['Accuracy']), 
        ('Speed', stats['Speed']), ('Magic', stats['Magic'])])
    for i in stats:
        if not i in ordered:
            ordered[i] = stats[i]
    return ordered


def Warrior():
    health = 20
    power = 12
    luck = 10
    accuracy = 85
    speed = 3
    magic = 5
    bonus = 'Power'
    classname = 'Warrior'
    return collections.OrderedDict([
        ('Class', classname), ('Bonus', bonus),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Knight():
    health = 30
    power = 8
    luck = 1
    accuracy = 85
    speed = 1
    magic = 5
    armor = 1
    bonus = 'Health'
    classname = 'Knight'
    return collections.OrderedDict([
        ('Class', classname), ('Bonus', bonus),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic),
        ('Armor', armor)])

def Scout():
    health = 15
    power = 6
    luck = 35
    accuracy = 90
    speed = 12
    magic = 5
    bonus = 'Speed'
    classname = 'Scout'
    return collections.OrderedDict([
        ('Class', classname), ('Bonus', bonus),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Mage():
    health = 17
    power = 2
    luck = 8
    accuracy = 80
    speed = 2
    magic = 10
    bonus = 'Magic'
    classname = 'Mage'
    return collections.OrderedDict([
        ('Class', classname), ('Bonus', bonus),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Over9000():
    health = 9001
    power = 0#9001
    luck = 9001
    accuracy = 9001
    speed = 9001
    magic = 9001
    armor = 9001
    bonus = 'Power'
    classname = 'Over9000'
    return collections.OrderedDict([
        ('Class', classname), ('Bonus', bonus),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic),
    ('Armor', armor)])

def Sucks():
    health = 1
    power = 1
    luck = 1
    accuracy = 1
    speed = 1
    magic = 1
    classname = 'D'
    bonus = 'Power'
    return collections.OrderedDict([
        ('Class', classname), ('Bonus', bonus),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])


# ---- Monster Classes ---- #
def Zombie():
    health = 7
    power = 4
    luck = 0
    accuracy = 65
    speed = 1
    magic = 1
    classname = 'Zombie'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Spider():
    health = 5
    power = 2
    luck = 0
    accuracy = 85
    speed = 5
    magic = 4
    classname = 'Spider'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Snake():
    health = 3
    power = 1
    luck = 0
    accuracy = 75
    speed = 3
    magic = 2
    classname = 'Snake'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Parasite():
    health = 10
    power = 1
    luck = 0
    accuracy = 65
    speed = 1
    magic = 10
    classname = 'Parasite'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Golem():
    health = 20
    power = 20
    luck = 10
    accuracy = 65
    speed = 1
    magic = 15
    armor = 1
    classname = 'Golem'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic),
        ('Armor', armor)])

def Dragon():
    health = 200
    power = 50
    luck = 0
    accuracy = 100
    speed = 40
    magic = 20
    classname = 'Dragon'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

def Chieftan():
    health = 3
    power = 9
    luck = 0
    accuracy = 80
    speed = 9
    magic = 10
    classname = 'Chieftan'
    return collections.OrderedDict([
        ('Class', classname),
        ('Health', health), ('Power', power), 
        ('Luck', luck), ('Accuracy', accuracy), 
        ('Speed', speed), ('Magic', magic)])

# --- General funcs ---- #
def printStats(stats, dungeon=None, statusbar=None, health=None, 
               range=0, mob=None, weapons=None):
    import random
    if not (dungeon or statusbar):
        class InputError(Exception):
            pass
        raise InputError('Input either a dungeon or a statusbar.')
    elif not statusbar:
        statusbar=dungeon.statusbar
    if not health:
        health = stats['Health']
    for i in stats:
        if i == 'Health':
            statusbar.addText('%s: %d/%d' % (i, health, 
                stats[i]), dungeon)
        elif i == 'Mana':
            statusbar.addText('%s: %d/%d' % (i, stats['Mana'], 
                stats['Magic']), dungeon)
        elif i =='EXP Reward':
            if mob:
                reward = mob.get_EXP_Reward(dungeon.P)
                statusbar.addText('%s: %d' % (i, 
                    reward), dungeon)
        elif i == 'Class':
            statusbar.addText('%s: %s' % 
                    (i, stats[i]), dungeon)
        elif i == 'Poison' and stats[i] != None:
            statusbar.addText( ('%s: %d damage for the '+
                'next %d moves.') % (i, stats[i][1], stats[i][0]), dungeon)
        elif i == 'Effects' and stats['Effects']:
            statusbar.addText('Status effects:', dungeon)
            for j in stats[i]:
                if j == 'Poison':
                    statusbar.addText( ('%s: %d damage for the '+
                    'next %d moves.') % (j, stats[i][j][1], stats[i][j][0]), dungeon)
        elif i == 'Bonus':
            statusbar.addText('+2 %s per level ' % (stats[i]), dungeon)
        elif type(stats[i]) == int and i != 'Level':
            text = ''
            if range == 0:
                text +='%s: %d' % (i, stats[i])
            else:
                rand = random.random() * range
                if random.random()<.5:
                    rand *= -1
                shown = int(stats[i] + range)
                min = shown-range
                if min<0:
                    min = 0
                text +='%s: %d-%d' % (i, int(min), int(shown+range))
            if weapons:
                for weapon in weapon:
                    if weapon.itemtype == 'Weapon':
                        if i == 'Power':
                            text += ' + %d (from %s)' % (weapon.stats['Attack'], weapon.name)
                        elif i == 'Speed':
                            text += ' - %d (from %s)' % (weapon.getSpeedDetr(), weapon.name)
                        elif i == 'Accuracy':
                            text += ' - %d (from %s)' % (weapon.getAccrDetr(), weapon.name)
                    elif weapon.itemtype == 'Tome':
                        if i == 'Magic':
                            text += ' + %d (from %s)' % (weapon.stats['Attack'], weapon.name)
                    if i == 'Luck':
                        text += ' + %d (from %s)' % (weapon.stats['Luck'], weapon.name)
            try:
                dungeon.statusbar.addText(text, dungeon)
            except:
                statusbar.addText(text, dungeon)

        if dungeon:
            dungeon.set_sb(statusbar)
    

