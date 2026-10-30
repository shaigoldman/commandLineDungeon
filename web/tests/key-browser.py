"""Stair Key names, icon, counts, carrier and separate chest/door keys on phones."""
exec(__import__('pathlib').Path(__file__).with_name('expansion-browser.py').read_text().split('try:\n for _ in range(100):')[0])
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE);page.get_by_role('button',name='Scout',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  for width,height in [(320,480),(360,560),(390,760),(430,915),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});load(page,'lockedStairs');fits(page);expect(page.locator('.stair-key-count')).to_contain_text('0 Stair Keys');expect(page.locator('.stair-lock-note')).to_contain_text('needs a Stair Key');visible(page,'Ascend').tap();expect(page.locator('.play-toast')).to_contain_text('Standard and Rare Keys cannot unlock stairs');assert saved(page)['keys']==0
   for key in ['Standard Key','Rare Key']:
    load(page,'lockedStairs');visible(page,'Item: '+key).tap();expect(page.get_by_role('dialog')).to_contain_text('not stairs');fits(page)
   load(page,'stairKeyReady');expect(page.locator('.stair-key-count')).to_contain_text('1 Stair Key');assert page.locator('.stair-key-count img').evaluate('el=>el.complete&&el.naturalWidth>0');fits(page);before=saved(page);visible(page,'Ascend').tap();page.wait_for_timeout(120);after=saved(page);assert after['keys']==0;assert after['floor']==before['floor']+1;assert [i['id'] for i in after['inventory']]==[i['id'] for i in before['inventory']]
   load(page,'stairKeyCarrier');fits(page);visible(page,'Expand enemy stats').tap();expect(page.get_by_role('dialog')).to_contain_text('Carries a Stair Key');visible(page,'Close details').tap();visible(page,'Attack').tap();expect(page.locator('.play-toast')).to_contain_text('Stair Key acquired');expect(page.locator('.stair-key-count')).to_contain_text('1 Stair Key');assert saved(page)['keys']==1
   visible(page,'Expand full player stats').tap();expect(page.get_by_role('dialog')).to_contain_text('Stair Keys 1');expect(page.get_by_role('dialog')).to_contain_text('tracked separately');fits(page)
   print('PASS: Stair Key HUD/icon, locked stairs rejection, both key inspections, independent consumption, carrier reward, full stats at',width,height,flush=True)
  page.set_viewport_size({'width':390,'height':760});load(page,'stairKeyReady');page.screenshot(path=str(root/'work/stair-keys-v71.png'))
  assert not errors,errors;browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
