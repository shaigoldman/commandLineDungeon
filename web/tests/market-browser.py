"""Real phone playthrough of the current villager price and resale rules."""
exec(__import__('pathlib').Path(__file__).with_name('expansion-browser.py').read_text().split('try:\n for _ in range(100):')[0])
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE);page.get_by_role('button',name='Scout',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  for width,height in [(390,760),(844,390)]:
   page.set_viewport_size({'width':width,'height':height});load(page,'fairMarket');before=saved(page);stock=before['monsters'][0]['merchant']['stock'];offer=next(s for s in stock if s['item']['name']=='Standard Key');assert 11<=offer['price']<=16
   visible(page,'Talk / trade').tap();dialog=page.get_by_role('dialog',name='Villager market');expect(dialog).to_contain_text('20 gold');expect(dialog).to_contain_text('Standard Key');visible(page,'Buy Standard Key');fits(page)
   if width==390:page.screenshot(path=str(root/'work/affordable-market-v72.png'))
   visible(page,'Buy Standard Key').tap();after=saved(page);assert after['player']['gold']==20-offer['price'];assert any(i['id']==offer['item']['id'] for i in after['inventory']);assert not any(s['item']['id']==offer['item']['id'] for s in after['monsters'][0]['merchant']['stock'])
   page.reload();page.wait_for_selector('canvas');reloaded=saved(page);assert reloaded['player']['gold']==after['player']['gold'];assert any(i['id']==offer['item']['id'] for i in reloaded['inventory'])
   visible(page,'Talk / trade').tap();visible(page,'Sell items').tap();visible(page,'Ask for offer').tap();quoted=saved(page)['monsters'][0]['merchant']['buyPrices'][offer['item']['id']];assert 0<quoted<offer['price'];visible(page,f'Sell for {quoted} gold').tap();final=saved(page);assert final['player']['gold']==20-offer['price']+quoted;assert not any(i['id']==offer['item']['id'] for i in final['inventory'])
   print(f'PASS: real {offer["price"]}-gold key purchase, {quoted}-gold resale, fixed saved stock and purse at {width}x{height}',flush=True)
  page.set_viewport_size({'width':390,'height':760});load(page,'marketAuto');before=saved(page);power=before['player']['stats']['Power'];item=before['monsters'][0]['merchant']['stock'][0]['item'];visible(page,'Talk / trade').tap();visible(page,'Buy '+item['name']).tap();after=saved(page);assert after['player']['stats']['Power']==power+item['value'];assert after['player']['gold']==before['player']['gold']-3;expect(page.locator('.play-toast')).to_contain_text('Bought '+item['name']);page.reload();page.wait_for_selector('canvas');assert saved(page)['player']['stats']['Power']==power+item['value'];visible(page,'Talk / trade').tap();swipe_map(page,65,0);page.wait_for_timeout(120);assert not saved(page).get('combat')
  load(page,'enemyInitiated');expect(page.get_by_role('button',name=re.compile('^Flee · [0-9]+% chance$'))).to_be_visible();before=saved(page);swipe_map(page,65,0);page.wait_for_timeout(120);after=saved(page);assert after['revision']>before['revision'] and (not after.get('combat') or after['player']['hp']<=before['player']['hp']);print('PASS: automatic villager purchase, saved stat gain, dialog swipe leave, enemy flee button and encounter swipe',flush=True)
  assert not errors,errors;browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
