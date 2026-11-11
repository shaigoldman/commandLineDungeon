"""Real touch and layout regressions for inspection and item-choice flows."""
exec(__import__('pathlib').Path(__file__).with_name('expansion-browser.py').read_text().split('try:\n for _ in range(100):')[0])
def load(page,name):
 page.evaluate('''game=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));const all=JSON.parse(localStorage.getItem(k));all.games[localStorage.getItem('dungeon-key')]=game;localStorage.setItem(k,JSON.stringify(all));}''',fixtures[name]);page.reload()
 page.wait_for_selector('[data-testid=death-screen]' if fixtures[name]['status']=='dead' else 'canvas')
 if fixtures[name]['status']!='dead':expect(page.locator('.inventory-ribbon')).to_be_visible()
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True)
  page=context.new_page();page.set_default_timeout(10000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE);page.get_by_role('button',name='Warrior',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  for width,height in [(320,480),(360,560),(390,760),(430,915),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});load(page,'manyAchievements')
   expect(page.get_by_role('button',name='Begin a new journey')).to_be_visible()
   assert page.locator('.death-screen').evaluate('el=>el.scrollHeight<=el.clientHeight+1'),('death scroll',width,height)
   assert page.get_by_role('button',name='Begin a new journey').evaluate('el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0}'),('death restart clipped',width,height)
   page.get_by_role('button',name='View achievements',exact=False).tap();expect(page.get_by_role('dialog',name='Achievements')).to_contain_text('Achievement 30')
   expect(page.get_by_role('dialog',name='Achievements')).not_to_contain_text('Journal')
   expect(page.get_by_role('dialog',name='Achievements')).not_to_contain_text('Your journey has ended.')
   page.get_by_role('button',name='Close achievements').tap()
   print('PASS fixed death screen',width,height,flush=True)
  page.set_viewport_size({'width':390,'height':760})
  fixtures['achievementKill']=json.loads(json.dumps(fixtures['guaranteedKill']))
  fixtures['achievementKill']['achievements']=[]
  fixtures['achievementKill']['kills']=0
  fixtures['achievementKill']['monsters'][0]['boss']=True
  load(page,'achievementKill')
  expect(page.locator('.achievement-notice')).to_have_count(0)
  page.get_by_role('button',name='Attack',exact=True).tap()
  expect(page.locator('.achievement-notice')).to_contain_text('First Blood')
  expect(page.locator('.achievement-notice')).to_contain_text('+25 points')
  assert page.locator('.achievement-notice').evaluate('el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}')
  page.get_by_role('button',name='Dismiss achievement announcement').tap()
  expect(page.locator('.achievement-notice')).to_contain_text('Guardian Slayer')
  expect(page.locator('.achievement-notice')).to_contain_text('+150 points')
  expect(page.locator('.achievement-notice')).to_have_count(0,timeout=8000)
  page.reload();page.wait_for_selector('canvas')
  expect(page.locator('.achievement-notice')).to_have_count(0)
  print('PASS new achievement banners, queued awards, dismissal, timeout and no replay on reload',flush=True)
  load(page,'mixingGround');before=saved(page);box=page.get_by_role('dialog',name='Item details')
  expect(box).to_contain_text('1. Choose a stat to lose 3');expect(box.get_by_role('button',name='Magic +3',exact=True)).to_have_count(0)
  box.get_by_role('button',name='Power −3',exact=False).tap();expect(box).to_contain_text('2. Gain 3 in which stat?')
  assert saved(page)['player']['stats']==before['player']['stats']
  box.get_by_role('button',name='Magic +3',exact=True).tap();page.wait_for_timeout(200);after=saved(page)
  assert after['player']['stats']['Power']==before['player']['stats']['Power']-3
  assert after['player']['stats']['Magic']==before['player']['stats']['Magic']+3
  assert not after['loot'];print('PASS two-step floor mixing',flush=True)
  load(page,'energyChoice');page.get_by_role('button',name='Item: Energy Potion',exact=True).tap()
  page.get_by_role('button',name='Restore 5 mana',exact=False).tap();page.wait_for_timeout(200);assert saved(page)['player']['stats']['Mana']==5;assert saved(page)['player']['hp']==10
  print('PASS energy choice',flush=True)
  load(page,'wandChoice');page.get_by_role('button',name='Item: Magic Wand',exact=True).tap()
  box=page.get_by_role('dialog',name='Item details');expect(box).to_contain_text('1. Choose an item to transform')
  box.get_by_role('button',name='Piece of Trash',exact=False).tap();expect(box).to_contain_text('2. Choose your staff element')
  box.get_by_role('button',name='Fire Staff',exact=True).tap();page.wait_for_timeout(200);assert any(i.get('element')=='Fire' for i in saved(page)['inventory'])
  print('PASS two-step wand',flush=True)
  load(page,'inspectVisible');page.wait_for_timeout(900);before=saved(page);r=page.locator('canvas').bounding_box()
  page.touchscreen.tap(r['x']+r['width']*.8,r['y']+r['height']*.5)
  expect(page.get_by_role('dialog',name='Enemy stats')).to_contain_text(before['monsters'][0]['name'])
  assert saved(page)==before;page.get_by_role('button',name='Close details',exact=True).tap();print('PASS remote visible enemy inspection without actions',flush=True)
  load(page,'fullShop');page.get_by_role('button',name='Talk / trade',exact=True).tap()
  page.get_by_role('button',name='Buy Throwing Knife',exact=True).tap()
  expect(page.get_by_role('dialog',name='Bag over capacity')).to_be_visible()
  page.get_by_role('button',name='Use Night Vision Goggles',exact=True).tap();page.get_by_role('button',name='Use item',exact=True).tap()
  page.wait_for_timeout(200);after=saved(page);assert len(after['inventory'])==3;assert all(all(row) for row in after['light']);print('PASS full-bag buying and use to free space',flush=True)
  load(page,'fullShop');page.get_by_role('button',name='Talk / trade',exact=True).tap();page.get_by_text('Use a carried item',exact=True).tap();page.get_by_role('button',name='Use Night Vision Goggles',exact=True).tap();page.get_by_role('button',name='Use item',exact=True).tap();page.wait_for_timeout(200);assert all(all(row) for row in saved(page)['light']);print('PASS utility items in NPC menu',flush=True)
  for scene,theme in [('energyChoice','warrior'),('inspectVisible','scout'),('combatLowHealth','mage')]:
   load(page,scene);assert page.locator('.play-shell').evaluate('(el,t)=>el.classList.contains("theme-"+t)',theme)
   assert page.locator('.hero-vitals label').first.evaluate('el=>parseFloat(getComputedStyle(el).fontSize)>=16')
  load(page,'enemyFirst');page.get_by_role('button',name='Attack unarmed',exact=True).tap();expect(page.locator('.damage-notice')).to_be_visible()
  assert not errors,errors
  print('PASS larger health, class themes and damage feedback',flush=True)
  browser.close()
finally:server.terminate();server.wait(timeout=10);bundle.cleanup()
