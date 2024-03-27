import numpy as np
import collections

def getTypeString(obj):
    typestring = str(type(obj))
    typestring = typestring[typestring.index('\'')+1:
        typestring.index('>')-1]
    return typestring


def saveItem(item):
    if type(item) != bool:
        try:
            item = int(item)
        except ValueError:
            pass
        except TypeError:
            pass
    if (type(item) == int or 
        type(item) == type(np.int64(4)) or 
        type(item) == float or
        type(item) == type(np.int32(4))):
        return str(item)
    elif (type(item) == str or
        type(item) == bytes or
        type(item) == np.string_ or
        type(item) == bool):
        try:
            return str(item.decode('utf8'))
        except AttributeError:
            return item
        except UnicodeEncodeError:
            return str(item)
        else:
            pass
            #print item
    elif (type(item) == dict or 
        type(item) ==  collections.OrderedDict):
        return saveDict(item)
    elif (type(item) == np.ndarray or 
        type(item) == list
        or type(item) == tuple):
        return saveNpArray(item)
    elif callable(item):
        return saveFunc(item)
    elif type(item) == type(None):
        return str(None)
    else:
        try:
            return ('\\%s-' % (getTypeString(item)) 
                + '%s/' % saveDict(vars(item)))
        except TypeError:
            return str(None)


def saveDict(dictionary):
    savestr = '{'
    for i in dictionary:
        try:
            savestr += '%s:%s;' % (i, saveItem(dictionary[i]))
        except UnicodeDecodeError:
            savestr += '%s:%s;' % (i, saveItem(dictionary[i]))

    savestr += '}'
    return savestr


def saveNpArray(npArray):
    npArray = np.asarray(npArray)
    savestr = ''
    dimensions = len(npArray.shape)
    savestr += '<'
    if dimensions > 1:
        for i in npArray:
            savestr += saveNpArray(i)+','
    elif dimensions == 1:
        for i in npArray:
            savestr += '%s,' % saveItem(i)
    savestr += '>'
    return savestr


def saveFunc(func):
    # import marshal
    # saved = marshal.dumps(func.func_code)
    # return '#%s$' % saved
    return 'FUNC%s' % func.__name__


def findEnder(string, begchar, endchar):
    #print '\n','\n', begchar, string
    numtofind=1
    for j in range(len(string)):
        if string[j] == begchar:
            numtofind += 1
        if string[j] == endchar:
            numtofind -=1
            if numtofind == 0:
                return j
    raise Exception('No end found')


def checkBool(string):
    try:
        if string == 'True':
            return True
        elif string == 'False':
            return False
        elif string == 'None':
            return None
        else:
            return string
    except ValueError:
        raise Exception('Whoops')


def convertString(string):
    try:
        if string[0] == '{':
            return loadDict(string)
        elif string[0] == '<':
            return loadNpArray(string)
        elif string[0] == '\\':
            return loadObj(string)
        elif string[0] == '#':
            return loadFunc(string)

    except IndexError:
        return string
    try:
        return int(string)
    except ValueError:
        try:
            return float(string)
        except ValueError:
            return checkBool(string)


def loadNpArray(arraystring):
    array = []
    currstring = ''
    i = 1 #skip the first bracket
    while i < len(arraystring):
        if arraystring[i] == '<':
            end = findEnder(arraystring[i+1:], '<', '>')+i+1
            currstring += arraystring[i:end+1]
            i = end
        elif arraystring[i] == '{':
            end = findEnder(arraystring[i+1:], '{', '}')+i+1
            currstring += arraystring[i:end+1]
            i = end
        elif arraystring[i] == '\\':
            end = findEnder(arraystring[i+1:], '\\', '/')+i+1
            currstring += arraystring[i:end+1]
            i = end
        elif arraystring[i] == '#':
            endarray = findEnder(arraystring[i+1:], '#', '$')+i+1
            currstring += arraystring[i:endarray]
            i = endarray
        elif arraystring[i] == ',':
            item = convertString(currstring)
            array.append(item)
            currstring = ''
        else:
            currstring += arraystring[i]
        i+=1
    return np.asarray(array)

def loadDict(dictstring):

    dictionary = {}
    currstring=''
    i = 1
    while i < len(dictstring):
        if dictstring[i] == '\\':
            endobjstring = findEnder(dictstring[i+1:], '\\', '/')+i+1
            currstring += dictstring[i:endobjstring+1]
            i = endobjstring
        elif dictstring[i] == '{':
            endsubdict = findEnder(dictstring[i+1:], '{', '}')+i+1
            currstring += dictstring[i:endsubdict]
            i = endsubdict
        elif dictstring[i] == '<':
            endarray = findEnder(dictstring[i+1:], '<', '>')+i+1
            currstring += dictstring[i:endarray]
            i = endarray
        elif dictstring[i] == '#':
            endarray = findEnder(dictstring[i+1:], '#', '$')+i+1
            currstring += dictstring[i:endarray]
            i = endarray
        elif dictstring[i] == ';':
            varname = currstring[:currstring.index(':')]
            var = currstring[currstring.index(':')+1:]
            var = convertString(var)
            dictionary[str(varname)] = var
            currstring=''
        else:
            currstring += dictstring[i]
        i += 1
    return dictionary


def loadObj(objstring):
    print (objstring)
    import Player, Dungeon, Monster, Npc
    import Instance, Item, Weapon, Tome, Boosters, Replenisher
    import Statusbar
    try:
        location = objstring[1:objstring.index('.')] #skip the \\
    except ValueError:
        print (objstring)
    objtype = objstring[objstring.index('.')+1:objstring.index('-')]
    variables = loadDict(objstring[objstring.index('{'):-1]) # skip the /
    obj = getattr(locals()[location], objtype)

    obj = obj()
    for i in variables:
        if not 'func' in i:
            setattr(obj, i, variables[i])
    try:
        if obj.ID == 5 and obj.itemtype=='Tome':
            #print 'tomehere'
            obj.inity()
    except:
        pass
    try:
        obj['stats'] = Classes.orderStats(obj['stats'])
    except:
        pass
    return obj


def loadFunc(funcstring):
    # import marshal, types
    # code = marshal.loads(funcstring)
    # f= types.FunctionType(code, globals(), "")
    return funcstring


def saveGame(dungeon, savefile):
    dungeon.statusbar.clear()
    savestr = saveItem(dungeon)
    f=open(savefile, 'wb')
    savestr=savestr.encode('utf8')
    f.write(savestr)
    f.close()


def loadGame(savefile):
    import os
    f=open(savefile, 'r')
    savestr = f.read()
    f.close()
    D = loadObj(savestr)
    D.normalize()
    return D

def removeFile(savefile):
    import os
    os.remove(savefile)
