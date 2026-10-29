"""Current-build UI regression checks for combat forecasts, piles, stairs and swipe-away."""
exec(__import__('pathlib').Path(__file__).with_name('expansion-browser.py').read_text().split('try:\n for _ in range(100):')[0])
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True,reduced_motion='no-preference');page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE);page.get_by_role('button',name='Scout',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  scenes=[('lootPile','Pick up'),('stairPile','Ascend · leave floor items'),('guaranteedKill','Attack'),('missKill','Attack'),('firstThreat','Attack'),('dragonEncounter','Attack'),('combatLowHealth','Attack')]
  for width,height in ([] if os.environ.get('FOLLOWUP_SKIP_MATRIX') else [(320,480),(360,560),(390,760),(430,915),(844,390)]):
   page.set_viewport_size({'width':width,'height':height});print('Follow-up layouts',width,height,flush=True)
   for scene,action in scenes:
    print('Checking follow-up',scene,width,height,flush=True)
    load(page,scene);fits(page);visible(page,action)
  if os.environ.get('FOLLOWUP_LAYOUT_ONLY'):
   assert not errors,errors;print('PASS: 35 targeted combat/loot/dragon/caster-low-health layouts',flush=True);browser.close();raise SystemExit(0)
  page.set_viewport_size({'width':390,'height':760});load(page,'lootPile');expect(page.get_by_role('navigation',name='Items at your feet').get_by_role('button')).to_have_count(3)
  visible(page,'Inspect ground: Rare Key').tap();expect(page.get_by_role('dialog')).to_contain_text('Rare Key');expect(page.locator('.rarity-badge')).to_contain_text('Rare');before=saved(page);visible(page,'Pick up').tap();page.wait_for_timeout(120);after=saved(page);assert after['inventory'][-1]['name']=='Rare Key';assert len(after['loot'])==2
  visible(page,'Ground: Power Doubler · 2').tap();expect(page.locator('.rarity-badge')).to_contain_text('Ultrarare');visible(page,'Use from floor').tap();assert saved(page)['player']['stats']['Power']==before['player']['stats']['Power']*2
  for dx,dy in [(60,0),(-60,0),(0,60),(0,-60)]:
   load(page,'lootPile');before=saved(page);zone=page.locator('.loot-swipe-zone').bounding_box();x=zone['x']+zone['width']/2;y=zone['y']+zone['height']/2
   touch=context.new_cdp_session(page);touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx,'y':y+dy}]});touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});touch.detach()
   expect(page.get_by_role('dialog')).to_have_count(0);page.wait_for_timeout(120);after=saved(page);assert after['player']['x']==before['player']['x']+(1 if dx>0 else -1 if dx<0 else 0);assert after['player']['y']==before['player']['y']+(1 if dy>0 else -1 if dy<0 else 0);assert after['loot']==before['loot'];assert after['turn']==before['turn']+1
  load(page,'stairPile');visible(page,'Close details').tap();visible(page,'Ascend').tap();page.wait_for_timeout(100);assert saved(page)['floor']==1
  load(page,'stairPile');visible(page,'Ascend · leave floor items').tap();page.wait_for_timeout(100);assert saved(page)['floor']==1
  print('PASS: pile selection, correct item pickup/use, four-direction touch swipe-away, stairs with loot',flush=True)
  load(page,'guaranteedKill');expect(page.locator('.safe-strike')).to_contain_text('Guaranteed');expect(page.locator('.kill-warning')).to_have_count(0);expect(page.get_by_label('Your damage forecast')).to_contain_text('Crit 0%');expect(page.locator('.turn-order')).to_contain_text('First to act: You');assert '→' not in page.locator('.turn-order').inner_text()
  visible(page,'Expand enemy stats').tap();dialog=page.get_by_role('dialog',name='Enemy stats');expect(dialog).to_contain_text('1 normal hit');expect(dialog).to_contain_text('Base stats');expect(dialog).to_contain_text('Combat adjustments');visible(page,'Close details').tap();visible(page,'Attack').tap();assert saved(page)['player']['hp']==5;assert not saved(page)['monsters']
  load(page,'missKill');expect(page.locator('.kill-warning')).to_contain_text('if you miss');load(page,'firstThreat');expect(page.locator('.kill-warning')).to_contain_text('they act first')
  load(page,'staffSwap');visible(page,'Close details').tap();visible(page,'Expand full player stats').tap();expect(page.locator('.stats-breakdown')).to_contain_text('Base');expect(page.locator('.stats-breakdown')).to_contain_text('Gear');expect(page.locator('.stats-breakdown')).to_contain_text('Effects');page.screenshot(path=str(root/'work/base-gear-stats-v7.png'));visible(page,'Close details').tap()
  load(page,'dragonEncounter');expect(page.get_by_alt_text('Red winged serpent dragon')).to_be_visible();page.wait_for_timeout(150);page.screenshot(path=str(root/'work/red-serpent-dragon-v7.png'));fits(page)
  assert not errors,errors
  print('PASS: nuanced retaliation, percentages, hits to kill, first-actor inspection, base/gear breakdown, two-tile dragon, no browser exceptions',flush=True);browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
