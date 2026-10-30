"""Verify the bundled phone game offline, including every requested redesign flow."""
import json,os,pathlib,re,shutil,subprocess,tempfile,time,urllib.request
from playwright.sync_api import sync_playwright,expect
root=pathlib.Path(__file__).resolve().parents[1]
fixtures=json.loads(subprocess.check_output(['node','--import','tsx','tests/mobile-fixtures.ts'],cwd=root,text=True))
bundle=tempfile.TemporaryDirectory(prefix='dungeon-phone-test-')
shutil.copytree(root/'dist/android',bundle.name,dirs_exist_ok=True)
server=subprocess.Popen(['python3','-m','http.server','3191','--bind','127.0.0.1','--directory',bundle.name],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
def saved(page):
 return page.evaluate('''()=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));return JSON.parse(localStorage.getItem(k)).games[localStorage.getItem('dungeon-key')];}''')
def load(page,name):
 page.evaluate('''game=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));const all=JSON.parse(localStorage.getItem(k));all.games[localStorage.getItem('dungeon-key')]=game;localStorage.setItem(k,JSON.stringify(all));}''',fixtures[name]);page.reload();page.wait_for_selector('[data-testid=death-screen]' if name=='dead' else 'canvas')
 if name!='dead':expect(page.locator('.inventory-ribbon')).to_be_visible()
def visible(page,name):
 b=page.get_by_role('button',name=name,exact=True);expect(b).to_be_visible()
 if b.evaluate("el=>!!el.closest('.item-carousel,.spell-carousel,.play-modal')"):b.scroll_into_view_if_needed();page.wait_for_timeout(80)
 r=b.bounding_box();assert r['y']>=0 and r['y']+r['height']<=page.evaluate('innerHeight')+1,(name,r)
 assert b.evaluate('''el=>{const r=el.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===el||el.contains(h);}'''),('Obscured',name,r)
 return b
def fits(page):
 state=page.evaluate('''()=>{const box=s=>{const b=document.querySelector(s)?.getBoundingClientRect();return b?{top:b.top,bottom:b.bottom,height:b.height}:null;};return {h:innerHeight,w:innerWidth,sh:document.documentElement.scrollHeight,sw:document.documentElement.scrollWidth,map:box('canvas'),bag:box('.inventory-ribbon'),magic:box('.magic-ribbon'),actors:box('.actor-panels')};}''')
 assert state['sh']<=state['h']+1 and state['sw']<=state['w'],state
 assert state['map']['height']>=64,state
 for key in ['bag','magic','actors']:
  b=state[key]
  if b:assert 0<=b['top'] and b['bottom']<=state['h']+1,(key,state)
 assert page.get_by_role('button',name='Log',exact=True).count()==0
 assert page.get_by_role('button',name='Move up',exact=True).count()==0

def swipe_map(page,dx,dy):
 b=page.locator('canvas').bounding_box();x=b['x']+b['width']*.5;y=b['y']+b['height']*.5
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+dx,y+dy,steps=6);page.mouse.up()
try:
 for _ in range(100):
  try:urllib.request.urlopen('http://127.0.0.1:3191',timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=p.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox']);context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True,reduced_motion="no-preference");page=context.new_page();errors=[];api=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   if '/api/' in r.request.url:api.append(r.request.url);r.abort()
   elif not r.request.url.startswith('http://127.0.0.1:3191/'):r.abort()
   else:r.continue_()
  page.route('**/*',route);page.goto('http://127.0.0.1:3191');page.get_by_placeholder('Adventurer').fill('Android Shai');page.get_by_role('button',name='Mage',exact=False).tap();page.get_by_role('button',name='Enter the dungeon').tap();page.wait_for_selector('canvas')
  visible(page,'Cast Teleport · 1 MP').tap();expect(page.locator('.hero-vitals')).to_contain_text('9/10');page.reload();page.wait_for_selector('canvas');expect(page.locator('.player-panel')).to_contain_text('Android Shai')
  cases=[] if os.environ.get('MOBILE_SKIP_MATRIX') else [(320,480),(360,560),(390,760),(430,915),(844,390)]
  scenes=[('swipe','Wait'),('poisonMove','Wait'),('staffLow','Attack'),('staffEmpty','Attack'),('combat','Attack'),('enemyInitiated','Attack'),('floorWeapon','Confirm equip from ground'),('floorSwap','Equip & leave old gear here'),('groundThrow','Throw at Zombie'),('groundTeleport','Use once & teleport'),('npcTalk','Talk / trade'),('level','Power +2'),('dead','Begin a new journey'),('won','Continue exploring'),('stairs','Ascend'),('moss','Wait'),('ice','Wait'),('ember','Wait')]
  if os.environ.get('MOBILE_LOOT_ONLY'):scenes=[('lootPaused','Use from floor'),('floorWeapon','Confirm equip from ground'),('floorSwap','Equip & leave old gear here')]
  if os.environ.get('MOBILE_EXPANSION_ONLY'):scenes=[('market','Talk / trade'),('fullLoot','Pick up'),('lockedChest','Open chest'),('secretDoor','Unlock secret door'),('chamber','Wait'),('emperor','Talk / trade'),('king','Talk / trade'),('curse','Wait')]
  for width,height in cases:
   page.set_viewport_size({'width':width,'height':height});print(f'Checking {width}x{height}',flush=True)
   for scene,action in scenes:
    load(page,scene)
    try:
     if scene=='dead':
      expect(page.get_by_test_id('death-screen')).to_be_visible();expect(page.locator('.death-score')).to_be_visible();visible(page,action)
     else:fits(page);visible(page,action)
    except Exception:page.screenshot(path=str(root/'work/redesign-failure.png'));print('Failed',scene,width,height,flush=True);raise
  page.set_viewport_size({'width':390,'height':760});load(page,'swipe');assert page.locator('.magic-ribbon').count()==0;before=saved(page);swipe_map(page,65,0);page.wait_for_timeout(250);after=saved(page);assert after['player']['x']==before['player']['x']+1 and after['turn']==before['turn']+1
  visible(page,'Wait').tap();page.wait_for_timeout(100);assert saved(page)['turn']==after['turn']+1;swipe_map(page,-60,0);page.wait_for_timeout(150);assert saved(page)['player']['x']==before['player']['x']
  for overview in [False,True]:
   load(page,'lootAhead')
   if overview:visible(page,'Overview').tap();page.wait_for_timeout(150)
   before=saved(page);swipe_map(page,65,0);expect(page.get_by_role('dialog',name='Item details')).to_be_visible()
   expect(page.locator('.rarity-badge')).to_contain_text('Common');expect(page.locator('.item-lore i')).to_be_visible()
   during=saved(page)
   if overview:page.keyboard.press('ArrowRight');page.wait_for_timeout(150)
   else:visible(page,'Close details').tap();page.wait_for_timeout(120);swipe_map(page,65,0);page.wait_for_timeout(150)
   after=saved(page);assert not after.get('pendingLoot');assert after['player']['x']==before['player']['x']+2
   assert after['loot']==during['loot'];assert after['inventory']==during['inventory']
   assert page.get_by_role('button',name='Follow hero' if overview else 'Overview',exact=True).count()==1
  print('PASS: automatic rarity/lore inspection in both map views; closing leaves loot and resumes movement',flush=True)
  load(page,'poisonMove');swipe_map(page,0,60);page.wait_for_timeout(100);expect(page.locator('.poison-chip').first).to_contain_text('2 steps');expect(page.locator('[data-testid="poison-flash"]')).to_have_count(1);page.wait_for_function("()=>{const e=document.querySelector('[data-testid=poison-flash]');return e&&Number(getComputedStyle(e).opacity)>0}",timeout=4000);assert saved(page)['player']['hp']==9;page.screenshot(path=str(root/'work/poison-v6.png'))
  visible(page,'Expand full player stats').tap();dialog=page.get_by_role('dialog',name='Full player stats');expect(dialog).to_contain_text('Poison');visible(page,'Close details').tap()
  load(page,'critical');expect(page.locator('.hero-vitals')).to_contain_text('CRITICAL · ≤10% HP');fits(page)
  load(page,'lastBreath');expect(page.locator('.hero-vitals')).to_contain_text('LAST BREATH · ≤1% HP');fits(page)
  load(page,'staffEmpty');assert page.locator('.magic-ribbon').count()==0;expect(page.locator('.mana-warning')).to_contain_text('UNARMED');expect(page.get_by_label('Your damage forecast')).to_contain_text('1 damage')
  load(page,'staffLow');expect(page.locator('.mana-warning')).to_contain_text('Staff inactive');visible(page,'Expand enemy stats').tap();expect(page.get_by_role('dialog',name='Enemy stats')).to_contain_text('Zombie');visible(page,'Close details').tap();visible(page,'Item: Mana Potion').tap();visible(page,'Use item').tap();expect(page.locator('.mana-warning')).to_have_count(0);expect(page.get_by_label('Your damage forecast')).to_contain_text('18 damage')
  visible(page,'Cast Teleport · 1 MP').tap();expect(page.locator('.enemy-panel')).to_have_count(0)
  load(page,'criticalHit');visible(page,'Attack').tap();expect(page.locator('.critical-notice')).to_contain_text('CRITICAL HIT!');page.screenshot(path=str(root/'work/critical-v6.png'))
  load(page,'floorWeapon');revision=saved(page)['revision'];dialog=page.get_by_role('dialog',name='Equipment comparison');expect(dialog).to_contain_text('Attack');expect(dialog).to_contain_text('Initiative');expect(dialog).to_contain_text('Power required');assert saved(page)['revision']==revision;page.screenshot(path=str(root/'work/equip-compare-v6.png'));visible(page,'Confirm equip from ground').tap();expect(page.locator('.held-line')).to_contain_text('Steel Sword');expect(page.get_by_role('button',name='Equipped: Steel Sword')).to_have_class('item-card is-equipped');expect(page.locator('.weapon-uses')).to_contain_text('uses');page.reload();page.wait_for_selector('canvas');expect(page.locator('.held-line')).to_contain_text('Steel Sword');page.screenshot(path=str(root/'work/explore-v6.png'))
  load(page,'floorSwap');expect(page.get_by_role('dialog')).to_contain_text('old gear stays');visible(page,'Equip & leave old gear here').tap();assert saved(page)['loot'][0]['item']['name']=='Iron Axe'
  load(page,'groundThrow');visible(page,'Throw at Zombie').tap();expect(page.locator('.enemy-panel')).to_contain_text('25/30');assert not saved(page)['loot']
  load(page,'groundTeleport');visible(page,'Use once & teleport').tap();expect(page.locator('.enemy-panel')).to_have_count(0);assert not saved(page)['loot']
  load(page,'carriedTeleport');visible(page,'Item: Teleporter').tap();visible(page,'Teleport to safety').tap();expect(page.locator('.enemy-panel')).to_have_count(0);assert any(i['kind']=='teleport' for i in saved(page)['inventory'])
  visible(page,'Item: Teleporter').tap();visible(page,'Drop').tap();visible(page,'Ground: Teleporter').tap();visible(page,'Use once & teleport').tap();assert not any(i['kind']=='teleport' for i in saved(page)['inventory']);assert not any(l['item']['kind']=='teleport' for l in saved(page)['loot'])
  load(page,'npcTalk');expect(page.get_by_label('Chieftain speech bubble')).to_contain_text('Curious traveler');visible(page,'Talk / trade').tap();expect(page.get_by_role('dialog',name='Chieftain dialogue')).to_contain_text('Health Gain');page.screenshot(path=str(root/'work/chieftain-v6.png'));visible(page,'Accept deal: Health Gain').tap();expect(page.locator('.enemy-panel')).to_have_count(0);assert saved(page)['player']['hp']>5
  load(page,'armory');row=page.locator('.item-carousel');assert row.evaluate('e=>e.scrollWidth>e.clientWidth');assert len(set(row.locator('img').evaluate_all('els=>els.map(e=>e.src)')))==9;page.screenshot(path=str(root/'work/item-ribbon-v6.png'))
  for scene in ['moss','ice','ember']:load(page,scene);page.screenshot(path=str(root/f'work/{scene}-v6.png'));fits(page)
  visible(page,'Saved on phone ●').tap();expect(page.get_by_role('dialog',name='Saved journey')).to_contain_text('saved on this phone');assert len(page.get_by_label('Device journey code').input_value())==64;visible(page,'Close details').tap()
  page.emulate_media(reduced_motion='reduce');load(page,'poisonMove');swipe_map(page,60,0);page.wait_for_timeout(100);assert saved(page)['player']['hp']==9
  assert not errors,errors
  assert not api,api
  print(f'PASS: {len(cases)*len(scenes)} viewport/state checks; swipe movement; no arrows/log/flee UI; top enemy and poison/mana states; forecasts/criticals; pure equipment comparisons and persistence; floor throws/teleports; teleport escapes; chieftain speech/trades; shared item art; themed floors; offline saves; no browser exceptions',flush=True)
  browser.close()
finally:server.terminate();server.wait(timeout=5);bundle.cleanup()
