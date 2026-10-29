"""Offline phone playthroughs of rare enemy deaths and new staff magic."""
exec(__import__('pathlib').Path(__file__).with_name('expansion-browser.py').read_text().split('try:\n for _ in range(100):')[0])
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox'])
  page=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True).new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE);page.get_by_role('button',name='Scout',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  load(page,'rareGremlin');expect(page.locator('.enemy-panel')).to_contain_text('Gremlin');page.screenshot(path=str(root/'work/gremlin-encounter-v74.png'));
  for _ in range(8):
   visible(page,'Attack').tap()
   if any(l['item']['name']=='Pot of Gold' for l in saved(page)['loot']):break
  after=saved(page);pot=next(l['item'] for l in after['loot'] if l['item']['name']=='Pot of Gold');assert 1<=pot['value']<=50;page.screenshot(path=str(root/'work/gremlin-pot-v74.png'))
  load(page,'rareRobot');hp=saved(page)['player']['hp'];expect(page.get_by_text('Robot explosion:',exact=False)).to_be_visible();page.screenshot(path=str(root/'work/robot-encounter-v74.png'));
  for _ in range(8):
   visible(page,'Attack').tap()
   if any('robot explodes' in line for line in saved(page)['log']):break
  after=saved(page);assert after['player']['hp']<hp;expect(page.locator('.play-toast')).to_contain_text('Robot explosion');page.screenshot(path=str(root/'work/robot-explosion-v74.png'))
  load(page,'rareBefriend');visible(page,'Cast Befriend · 8 MP').tap();after=saved(page);assert not after.get('combat') and after['monsters'][0]['merchant'];assert after['player']['stats']['Mana']==2
  load(page,'rareUnseal');visible(page,'Cast Unseal · 8 MP').tap();after=saved(page);assert after['chests'][0]['opened'] and after['pendingLoot'];assert after['player']['stats']['Mana']==2
  load(page,'rareKindle');visible(page,'Cast Kindle · 2 MP').tap();before=saved(page);assert before['monsters'][0]['burn'][0]==4;expect(page.locator('.enemy-panel')).to_contain_text('BURN');visible(page,'Attack').tap();after=saved(page);assert after['monsters'][0]['burn'][0]<4;assert any('fire damage' in line for line in after['log'])
  assert not errors,errors
  print('PASS: mobile Gremlin pot, Robot explosion and cue, Water Befriend, Wind Unseal, Fire Kindle and burn HUD',flush=True)
  browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
