"""Production browser smoke test. Starts/stops its own Node server with isolated saves."""
import os, pathlib, subprocess, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as data:
 env=dict(os.environ,PORT='3189',DATA_DIR=data,NODE_ENV='test')
 server=subprocess.Popen(['node','dist/server.js'],cwd=root,env=env,stdout=subprocess.DEVNULL)
 try:
  for _ in range(100):
   try:urllib.request.urlopen('http://localhost:3189/api/health');break
   except Exception:time.sleep(.1)
  with sync_playwright() as p:
   executable=os.environ.get('CHROMIUM_PATH')
   if not executable and pathlib.Path('/usr/bin/chromium').exists():executable='/usr/bin/chromium'
   b=p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
   page=b.new_page(viewport={'width':1440,'height':1000});errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://localhost:3189');page.get_by_placeholder('Adventurer').fill('Elara')
   page.get_by_role('button',name='Mage').click();page.get_by_role('button',name='Enter the dungeon').click()
   page.wait_for_selector('canvas');page.get_by_role('button',name='spells',exact=False).first.click()
   page.get_by_role('button',name='Cast · 1 MP').click();page.wait_for_timeout(300)
   assert page.locator('.bar-label').filter(has_text='MANA').inner_text().endswith('9 / 10')
   page.keyboard.press('v');page.get_by_role('dialog').wait_for();key=page.get_by_label('Private recovery key').input_value();assert len(key)==64
   page.get_by_role('button',name='✕').click();page.reload();page.wait_for_selector('canvas');assert page.locator('h2').first.inner_text()=='Elara'
   server.terminate();server.wait(timeout=10);server=subprocess.Popen(['node','dist/server.js'],cwd=root,env=env,stdout=subprocess.DEVNULL)
   for _ in range(100):
    try:urllib.request.urlopen('http://localhost:3189/api/health');break
    except Exception:time.sleep(.1)
   page.reload();page.wait_for_selector('canvas');assert page.locator('h2').first.inner_text()=='Elara'
   before=page.locator('.map-toolbar').inner_text();page.keyboard.press('Space');page.wait_for_timeout(300);assert before!=page.locator('.map-toolbar').inner_text()
   context=b.new_context();other=context.new_page();other.goto('http://localhost:3189');other.get_by_text('Restore a saved journey').click();other.get_by_label('Recovery key',exact=True).fill(key);other.get_by_role('button',name='Restore',exact=True).click();other.wait_for_selector('canvas');assert other.locator('h2').first.inner_text()=='Elara'
   page.set_viewport_size({'width':390,'height':844});assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
   page.get_by_role('button',name='Move up',exact=True).click();page.wait_for_timeout(200)
   assert not errors,errors
   print('PASS: desktop, mobile touch controls, keyboard, spell, autosave, reload, server restart, recovery, no browser exceptions')
   b.close()
 finally:
  server.terminate();server.wait(timeout=10)
