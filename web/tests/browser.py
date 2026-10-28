"""Production web/server save, keyboard, touch and recovery smoke test."""
import os,pathlib,subprocess,tempfile,time,urllib.request
from playwright.sync_api import sync_playwright,expect
root=pathlib.Path(__file__).resolve().parents[1]
def stop(server):
 server.terminate()
 try:server.wait(timeout=5)
 except subprocess.TimeoutExpired:server.kill();server.wait(timeout=5)
def ready():
 for _ in range(100):
  try:urllib.request.urlopen('http://localhost:3189/api/health');return
  except Exception:time.sleep(.1)
 raise AssertionError('Server not ready')
with tempfile.TemporaryDirectory() as data:
 env=dict(os.environ,PORT='3189',DATA_DIR=data,NODE_ENV='test');server=subprocess.Popen(['node','dist/server.js'],cwd=root,env=env,stdout=subprocess.DEVNULL)
 try:
  ready()
  with sync_playwright() as p:
   exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
   b=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://localhost:3189');page.get_by_placeholder('Adventurer').fill('Elara');page.get_by_role('button',name='Mage',exact=False).click();page.get_by_role('button',name='Enter the dungeon').click();page.wait_for_selector('canvas')
   with page.expect_response(lambda r:r.url.endswith('/api/action')) as response:page.get_by_role('button',name='Cast Teleport · 1 MP',exact=True).click()
   assert response.value.ok;expect(page.locator('.hero-vitals')).to_contain_text('9/10')
   page.get_by_role('button',name='Saved journey ●',exact=True).click();key=page.get_by_label('Private recovery key').input_value();assert len(key)==64;page.get_by_role('button',name='Close details',exact=True).click()
   page.reload();page.wait_for_selector('canvas');expect(page.locator('.player-panel')).to_contain_text('Elara');expect(page.locator('.hero-vitals')).to_contain_text('9/10')
   stop(server);server=subprocess.Popen(['node','dist/server.js'],cwd=root,env=env,stdout=subprocess.DEVNULL);ready();page.reload();page.wait_for_selector('canvas');expect(page.locator('.player-panel')).to_contain_text('Elara')
   page.locator('canvas').focus()
   with page.expect_response(lambda r:r.url.endswith('/api/action')) as response:page.keyboard.press('Space')
   assert response.value.ok,response.value.text()
   other=b.new_context().new_page();other.goto('http://localhost:3189');other.get_by_text('Restore a saved journey').click();other.get_by_label('Recovery key',exact=True).fill(key);other.get_by_role('button',name='Restore',exact=True).click();other.wait_for_selector('canvas');expect(other.locator('.player-panel')).to_contain_text('Elara')
   page.set_viewport_size({'width':390,'height':760});expect(page.locator('.inventory-ribbon')).to_be_visible();page.get_by_role('button',name='Expand full player stats',exact=True).tap();expect(page.get_by_role('dialog',name='Full player stats')).to_contain_text('Elara');page.get_by_role('button',name='Close details',exact=True).tap()
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth');assert not errors,errors
   print('PASS: production server; desktop/phone layout; spell persistence; keyboard wait; server restart; private recovery in another browser; full stats; no browser exceptions')
   b.close()
 finally:stop(server)
