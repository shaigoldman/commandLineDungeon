"""Real mobile browser playthroughs for the complete Ashfall expansion."""
# Use an isolated ephemeral port so independent browser suites cannot share bundles.
import socket
with socket.socket() as probe:
 probe.bind(("127.0.0.1",0)); test_port=probe.getsockname()[1]
BASE=f"http://127.0.0.1:{test_port}"
# Reuse the same offline fixture server and hit-target/layout helpers on a separate port.
exec((pathlib_source := __import__('pathlib').Path(__file__).with_name('android-browser.py').read_text()).split('try:\n for _ in range(100):')[0].replace('3191',str(test_port)))
try:
 for _ in range(100):
  try:urllib.request.urlopen(BASE,timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True,reduced_motion='no-preference');page=context.new_page();errors=[];api=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   if '/api/' in r.request.url:api.append(r.request.url);r.abort()
   elif not r.request.url.startswith(BASE+'/'):r.abort()
   else:r.continue_()
  page.route('**/*',route);page.goto(BASE);page.get_by_placeholder('Adventurer').fill('Ashfall tester');page.get_by_role('button',name='Scout',exact=False).tap();page.get_by_role('button',name='Enter the dungeon',exact=False).tap();page.wait_for_selector('canvas')
  scenes=[('market','Talk / trade'),('fullLoot','Pick up'),('lockedChest','Open chest'),('secretDoor','Unlock secret door'),('chamber','Wait'),('emperor','Talk / trade'),('king','Talk / trade'),('curse','Wait')]
  sizes=[] if os.environ.get('EXPANSION_SKIP_MATRIX') else [(320,480),(360,560),(390,760),(430,915),(844,390)]
  for width,height in sizes:
   page.set_viewport_size({'width':width,'height':height});print(f'Expansion layouts {width}x{height}',flush=True)
   for scene,action in scenes:
    load(page,scene)
    try:fits(page);visible(page,action)
    except Exception:page.screenshot(path=str(root/'work/expansion-failure.png'));print('Failed scene',scene,width,height,flush=True);raise
  page.set_viewport_size({'width':390,'height':760})
  for how in ['close','escape','backdrop']:
   load(page,'lootPaused');original=saved(page);expect(page.get_by_role('dialog',name='Item details')).to_be_visible()
   if how=='close':visible(page,'Close details').tap()
   elif how=='escape':page.keyboard.press('Escape')
   else:page.locator('.play-backdrop').tap(position={'x':2,'y':2})
   expect(page.get_by_role('dialog')).to_have_count(0);page.wait_for_timeout(120);after=saved(page);assert not after.get('pendingLoot') and after['loot']==original['loot'];swipe_map(page,60,0);page.wait_for_timeout(120);assert saved(page)['player']['x']==original['player']['x']+1
  load(page,'lootPaused');visible(page,'Pick up').tap();page.wait_for_timeout(100);assert not saved(page)['loot'];assert saved(page)['inventory'][-1]['name']=='Small Health Potion'
  load(page,'lootPaused');hp=saved(page)['player']['hp'];visible(page,'Use from floor').tap();page.wait_for_timeout(100);assert saved(page)['player']['hp']>hp;assert not saved(page)['loot']
  for leave in [True,False]:
   load(page,'fullLoot');before=saved(page);visible(page,'Pick up').tap();expect(page.get_by_role('dialog',name='Bag is full')).to_contain_text('Choose an item to drop');page.screenshot(path=str(root/'work/full-bag-swap-v7.png'))
   visible(page,'Leave new item: Rare Key' if leave else 'Drop: Throwing Knife').tap();page.wait_for_timeout(100);after=saved(page)
   assert len(after['inventory'])==2 and after['turn']==before['turn'];assert not after.get('pendingLoot')
   assert any(i['name']==('Throwing Knife' if leave else 'Rare Key') for i in after['inventory'])
   assert after['loot'][0]['item']['name']==('Rare Key' if leave else 'Throwing Knife')
  print('PASS: three ground actions; close/Escape/backdrop auto-leave; atomic full-bag chooser',flush=True)
  load(page,'market');visible(page,'Talk / trade').tap();dialog=page.get_by_role('dialog',name='Villager market');expect(dialog).to_contain_text('500 gold');expect(dialog).to_contain_text('Fragile Axe');page.screenshot(path=str(root/'work/villager-market-v7.png'))
  visible(page,'Buy Poison Antibody').tap();expect(dialog).to_contain_text('480 gold');assert len(saved(page)['monsters'][0]['merchant']['stock'])==3
  visible(page,'Sell items').tap();page.get_by_label('Item to sell',exact=True).select_option(label='Throwing Knife');visible(page,'Ask for offer').tap();refusal=saved(page)['monsters'][0]['merchant']['refusal'];expect(dialog).to_contain_text(refusal);assert page.get_by_role('button',name=re.compile('^Sell for')).count()==0
  page.get_by_label('Item to sell',exact=True).select_option(label='Fragile Axe ★ WANTED');visible(page,'Ask for offer').tap();offer=dialog.get_by_role('button',name=re.compile('^Sell for'));expect(offer).to_be_visible();quote=offer.inner_text();page.reload();page.wait_for_selector('canvas');visible(page,'Talk / trade').tap();dialog=page.get_by_role('dialog',name='Villager market');visible(page,'Sell items').tap();page.get_by_label('Item to sell').select_option(label='Fragile Axe ★ WANTED');expect(dialog.get_by_role('button',name=quote,exact=True)).to_be_visible();visible(page,quote).tap();assert not any(i['name']=='Fragile Axe' for i in saved(page)['inventory']);visible(page,'Leave peacefully').tap()
  visible(page,'Item: Poison Antibody').tap();visible(page,'Use item').tap();assert saved(page)['player'].get('poisonImmune');visible(page,'Expand full player stats').tap();expect(page.get_by_role('dialog',name='Full player stats')).to_contain_text('POISON IMMUNITY');visible(page,'Close details').tap()
  print('PASS: merchant purchase, wanted premium, refusal, fixed-price reload, permanent immunity',flush=True)
  load(page,'villagerDoom');villagerName=saved(page)['monsters'][0]['name'];visible(page,'Attack villager').tap();expect(page.locator('.play-toast')).to_contain_text(villagerName+': “');expect(page.locator('.play-toast')).to_contain_text('CURSED');assert saved(page)['xp']==0;assert not saved(page)['loot']
  for _ in range(5):visible(page,'Wait').tap();page.wait_for_timeout(100)
  assert saved(page)['monsters'][0]['className']=='Ghost';swipe_map(page,60,0);page.wait_for_timeout(100);expect(page.locator('.enemy-panel')).to_contain_text('Ghost of');page.screenshot(path=str(root/'work/ghost-encounter-v7.png'))
  visible(page,'Item: Poison Antidote').tap();visible(page,'Use item').tap();expect(page.locator('.curse-chip')).to_have_count(0)
  print('PASS: visible villager last words and curse, no rewards, delayed ghost at death site',flush=True)
  load(page,'curse');expect(page.locator('.curse-chip')).to_contain_text('12 turns');visible(page,'Wait').tap();page.wait_for_timeout(100);expect(page.locator('.curse-chip')).to_contain_text('11 turns');visible(page,'Item: Poison Antidote').tap();visible(page,'Use item').tap();expect(page.locator('.curse-chip')).to_have_count(0)
  load(page,'summonReady');visible(page,'Cast Summon · 9 MP').tap();page.wait_for_timeout(100);assert len(saved(page)['monsters'])==1;assert saved(page)['player']['stats']['Mana']==1
  load(page,'alchemizeReady');visible(page,'Cast Alchemize · 8 MP').tap();page.wait_for_timeout(100);assert saved(page)['player']['gold']>=3;expect(page.locator('.gold-purse')).to_contain_text('gold')
  load(page,'expansionBag');visible(page,'Item: Power Doubler').tap();visible(page,'Use item').tap();assert saved(page)['player']['stats']['Power']==20
  visible(page,'Item: 20 Gold Coins').tap();visible(page,'Use item').tap();assert saved(page)['player']['gold']==20
  visible(page,'Item: Seismic Shocker').tap();expect(page.get_by_role('dialog')).to_contain_text('yourself');visible(page,'Use item').tap();assert saved(page)['player']['hp']==95;assert saved(page)['monsters'][0]['hp']==15
  print('PASS: curse damage/cure, both advanced spells, doubler, coin purse, all-actor seismic damage',flush=True)
  load(page,'expansionBag');stone=next(i for i in saved(page)['inventory'] if i['kind']=='summon-stone');visible(page,'Item: Summoner Stone').tap();expect(page.get_by_role('dialog')).to_contain_text('uses left');visible(page,'Use item').tap();page.wait_for_timeout(120)
  after=saved(page);assert len(after['monsters'])==2;remaining=next((i['uses'] for i in after['inventory'] if i['id']==stone['id']),0);assert remaining==stone['uses']-1
  page.reload();page.wait_for_selector('canvas');assert next((i['uses'] for i in saved(page)['inventory'] if i['id']==stone['id']),0)==remaining
  for name in ['Candy','Rare Candy','Ultra Candy']:
   visible(page,'Item: '+name).tap();expect(page.locator('.rarity-badge')).to_be_visible();expect(page.locator('.item-lore i')).to_be_visible();visible(page,'Use item').tap()
  level=page.get_by_role('dialog',name='Level up');expect(level).to_contain_text('Current stats');expect(level).to_contain_text('Power');beforePower=saved(page)['player']['stats']['Power'];visible(page,'Power +2').tap();page.wait_for_timeout(100);assert saved(page)['player']['stats']['Power']==beforePower+2;assert saved(page)['xp']==45
  load(page,'staffSwap');dialog=page.get_by_role('dialog',name='Equipment comparison');expect(dialog).to_contain_text('Wind Staff');expect(dialog).to_contain_text('Iron Sword');page.screenshot(path=str(root/'work/staff-replacement-v7.png'));visible(page,'Confirm equip from ground').tap();assert len(saved(page)['player']['weapons'])==1;assert saved(page)['player']['weapons'][0]['name']=='Iron Sword'
  visible(page,'Item: Extra Hand').tap();visible(page,'Use item').tap();assert saved(page)['hands']==2
  visible(page,'Item: Wind Staff').tap();visible(page,'Confirm equip').tap();assert len(saved(page)['player']['weapons'])==2
  print('PASS: stone charges/reload, candy EXP and level stats overlay, rarity/lore, staff replacement and Extra Hand',flush=True)

  load(page,'lockedChest');visible(page,'Open chest').tap();page.wait_for_timeout(100);assert not saved(page)['inventory'];assert saved(page)['pendingLoot'];visible(page,'Pick up').tap()
  load(page,'secretDoor');visible(page,'Unlock secret door').tap();page.wait_for_timeout(750);assert saved(page)['inSecret'];expect(page.locator('.floor-name')).to_contain_text('Secret chamber');page.screenshot(path=str(root/'work/secret-room-v7.png'))
  swipe_map(page,60,0);page.wait_for_timeout(180);swipe_map(page,60,0);page.wait_for_timeout(180);swipe_map(page,60,0);page.wait_for_timeout(100);visible(page,'Open chest').tap();page.wait_for_timeout(100);reward=saved(page).get('pendingLoot');assert (reward and reward['rarity']>=6) or saved(page)['player'].get('gold',0)>0
  if reward:visible(page,'Pick up').tap();page.wait_for_timeout(100)
  if saved(page)['pendingLevels']:visible(page,'Power +2').tap()
  page.reload();page.wait_for_selector('canvas');assert saved(page)['inSecret'];assert saved(page)['chests'][0]['opened']
  for _ in range(5):swipe_map(page,-60,0);page.wait_for_timeout(150)
  page.wait_for_timeout(700);assert not saved(page).get('inSecret');expect(page.locator('.floor-name')).not_to_contain_text('Secret chamber')
  load(page,'emperor');visible(page,'Talk / trade').tap();expect(page.get_by_role('dialog')).to_contain_text('Pay 5 current HP');visible(page,'Accept deal: Imperial Treasury').tap();page.wait_for_timeout(100);assert saved(page)['player']['gold']==100
  load(page,'king');visible(page,'Talk / trade').tap();expect(page.get_by_role('dialog')).to_contain_text('King Niblet the Underprepared');assert page.locator('.market-offer').count()>30;page.screenshot(path=str(root/'work/villager-king-v7.png'));visible(page,'Leave peacefully').tap()
  assert not errors,errors
  assert not api,api
  print(f'PASS: {len(sizes)*len(scenes)} expansion layouts; all expansion browser playthroughs; secret room camera/return/save; emperor and king; offline persistence; no browser exceptions',flush=True)
  browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
