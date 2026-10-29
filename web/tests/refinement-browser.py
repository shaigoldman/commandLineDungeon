"""Real touch regressions for automatic coins, spoiler-free merchants and chest movement."""
exec(__import__('pathlib').Path(__file__).with_name('expansion-browser.py').read_text().split('try:\n for _ in range(100):')[0])
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE);page.get_by_role('button',name='Scout',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  def touch_map(dx,dy):
   box=page.locator('canvas').bounding_box();x=box['x']+box['width']*.5;y=box['y']+box['height']*.5
   touch=context.new_cdp_session(page);touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx,'y':y+dy}]});touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});touch.detach();page.wait_for_timeout(160)
  for size in [(320,480),(360,560),(390,760),(430,915),(844,390)]:
   page.set_viewport_size({'width':size[0],'height':size[1]})
   load(page,'goldAhead');before=saved(page);touch_map(60,0);after=saved(page)
   assert after['player']['gold']==27;assert not after['loot'];assert not after.get('pendingLoot');assert after['turn']==before['turn']+1
   expect(page.get_by_role('dialog')).to_have_count(0);expect(page.locator('.gold-purse')).to_have_text('27gold');expect(page.locator('.gold-purse img')).to_be_visible();fits(page)
   assert page.locator('.gold-purse img').evaluate('el=>el.complete&&el.naturalWidth>0')
   page.reload();page.wait_for_selector('canvas');assert saved(page)['player']['gold']==27
   load(page,'goldChest');visible(page,'Open chest').tap();expect(page.get_by_role('dialog')).to_have_count(0);assert saved(page)['player']['gold']==10;assert not saved(page).get('pendingLoot')
   for overview in [False,True]:
    for dx,dy in [(60,0),(-60,0),(0,60),(0,-60)]:
     load(page,'lockedChest')
     if overview:visible(page,'Overview').tap()
     touch_map(60,0) # Step onto the chest, then swipe away from its active prompt.
     before=saved(page);assert before['player']['x']==16;touch_map(dx,dy);after=saved(page)
     assert after['player']['x']==before['player']['x']+(1 if dx>0 else -1 if dx<0 else 0)
     assert after['player']['y']==before['player']['y']+(1 if dy>0 else -1 if dy<0 else 0)
     assert after['turn']==before['turn']+1;assert not after.get('pendingChest');assert not after['chests'][0]['opened'];assert after['inventory']==before['inventory']
   load(page,'market');expect(page.locator('main')).not_to_contain_text('Killing brings');expect(page.locator('main')).not_to_contain_text('Harming villagers')
   visible(page,'Talk / trade').tap();dialog=page.get_by_role('dialog');expect(dialog).not_to_contain_text('protected by a deadly curse');expect(dialog).not_to_contain_text('Killing one');fits(page)
   print('PASS: auto coins, purse icon/reload, coin chest, eight chest swipes, no merchant spoilers at',size,flush=True)
  page.set_viewport_size({'width':390,'height':760});load(page,'market');visible(page,'Talk / trade').tap();page.screenshot(path=str(root/'work/villager-market-v71.png'))
  assert not errors,errors;browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
