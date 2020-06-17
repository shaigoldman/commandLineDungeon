#!/usr/bin/env python
import sys
def sysIsWindows():
  return ('win' in sys.platform and not 'dar' in sys.platform)

def interpSymb(char):
    if char == u'[A' or char == '\xe0H':
        return 'up'
    elif char == u'[B' or char == '\xe0P':
        return 'down'
    elif char == u'[C' or char == '\xe0M':
        return 'right'
    elif char == u'[D' or char == '\xe0K':
        return 'left'
    else:
        return 0


if not sysIsWindows():
    import termios
    import contextlib

    @contextlib.contextmanager
    def keylisten(file):
        old_attrs = termios.tcgetattr(file.fileno())
        new_attrs = old_attrs[:]
        new_attrs[3] = new_attrs[3] & ~(termios.ECHO | termios.ICANON)
        try:
            termios.tcsetattr(file.fileno(), termios.TCSADRAIN, new_attrs)
            yield
        finally:
            termios.tcsetattr(file.fileno(), termios.TCSADRAIN, old_attrs)


    def waitForKey(method=None, maxiter=None):
        with keylisten(sys.stdin):
            try:
                if method:
                    method()

                ch = sys.stdin.read(1)
                if ch == u'\x1b':
                    ch = sys.stdin.read(2)
                else:
                    return ch
                if interpSymb(ch):
                    return interpSymb(ch)
                


            except (KeyboardInterrupt, EOFError):
                print 'error'
                return 0
    def breakIfKey(method=None, maxiter=float('inf')):
        import sys
        import select
        import tty
        import termios

        def isData():
            return select.select([sys.stdin], [], [], 0) == ([sys.stdin], [], [])

        old_settings = termios.tcgetattr(sys.stdin)
        try:
            tty.setcbreak(sys.stdin.fileno())

            i = 0
            while 1:
                if method:
                    method()

                if isData():
                    c = sys.stdin.read(1)
                    if c == u'\x1b':
                        c = sys.stdin.read(2)
                    else:
                        return c
                    if interpSymb(c):
                        return interpSymb(c)

                i += 1
                if i>=maxiter:
                    return 0

        finally:
            termios.tcsetattr(sys.stdin, termios.TCSADRAIN, old_settings)


if sysIsWindows():
    def waitForKey(method=None, maxiter=None):
        if method:
            method()
        from msvcrt import getch
        ch = getch()
        if ch == '\xe0':
            ch += getch()

        if interpSymb(ch):
            return interpSymb(ch)
        return ch


    #second method of getting key inputs
    def breakIfKey(method=None, maxiter=float('inf')):
            method()



