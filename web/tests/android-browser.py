"""Check the actual offline bundle, including a viewport/encounter UX matrix."""
import json,os,pathlib,subprocess,time,urllib.request
from playwright.sync_api import sync_playwright,expect
root=pathlib.Path(__file__).resolve().parents[1]
fixtures=json.loads(subprocess.check_output(['node','--import','tsx','tests/mobile-fixtures.ts'],cwd=root,text=True))
server=subprocess.Popen(['python3','-m','http.server','3191','--bind','127.0.0.1','--directory','dist/android'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

def load_fixture(page,name):
 page.evaluate('''game=>{const storage=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));const all=JSON.parse(localStorage.getItem(storage));all.games[localStorage.getItem('dungeon-key')]=game;localStorage.setItem(storage,JSON.stringify(all));}''',fixtures[name])
 page.reload();page.wait_for_selector('canvas');expect(page.locator('.mobile-nav')).to_be_visible()

def fits(page):
 expect(page.locator('body')).to_have_class('playing-compact')
 bounds=page.evaluate('''()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height};};return {height:innerHeight,width:innerWidth,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,nav:box('.mobile-nav'),hud:box('.mobile-hud'),map:box('canvas')};}''')
 assert bounds['scrollHeight']<=bounds['height']+1,bounds
 assert bounds['scrollWidth']<=bounds['width'],bounds
 assert 0<=bounds['hud']['top']<bounds['hud']['bottom']<=bounds['height'],bounds
 assert bounds['nav']['bottom']<=bounds['height']+1,bounds
 assert bounds['map']['height']>=70,bounds

def visible_action(page,name):
 button=page.get_by_role('button',name=name,exact=True);expect(button).to_be_visible();b=button.bounding_box();assert b['y']>=0 and b['y']+b['height']<=page.evaluate('innerHeight'),(name,b)
 assert button.evaluate('''el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit!==el&&!el.contains(hit))return false;for(let p=el.parentElement;p;p=p.parentElement){if(['hidden','auto','scroll','clip'].includes(getComputedStyle(p).overflowY)){const b=p.getBoundingClientRect();if(r.top<b.top-1||r.bottom>b.bottom+1)return false;}}return true;}'''),('Obscured action',name,b)
 return button

try:
 for _ in range(100):
  try:urllib.request.urlopen('http://127.0.0.1:3191',timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  executable=os.environ.get('CHROMIUM_PATH')
  if not executable and pathlib.Path('/usr/bin/chromium').exists():executable='/usr/bin/chromium'
  browser=p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':760},is_mobile=True,has_touch=True)
  page=context.new_page();errors=[];api_requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   if '/api/' in r.request.url:api_requests.append(r.request.url);r.abort()
   elif not r.request.url.startswith('http://127.0.0.1:3191/'):r.abort()
   else:r.continue_()
  page.route('**/*',route)
  page.goto('http://127.0.0.1:3191');page.get_by_placeholder('Adventurer').fill('Android Elara');page.get_by_role('button',name='Mage').tap();page.get_by_role('button',name='Enter the dungeon').tap();page.wait_for_selector('canvas')
  visible_action(page,'Spells').tap();dialog=page.get_by_role('dialog',name='Magic');expect(dialog).to_be_visible();dialog.get_by_role('button',name='Cast · 1 MP').tap();expect(page.locator('.hud-vitals')).to_contain_text('9 / 10');expect(dialog).not_to_be_visible()
  page.get_by_role('button',name='Saved on phone').tap();page.get_by_role('dialog').wait_for();expect(page.get_by_role('dialog')).to_contain_text('saved on this phone');assert len(page.get_by_label('Device journey code').input_value())==64
  page.get_by_role('button',name='✕').tap();page.reload();page.wait_for_selector('canvas');expect(page.locator('.mobile-hud')).to_contain_text('Android Elara');expect(page.locator('.hud-vitals')).to_contain_text('9 / 10')
  viewport_cases=[] if os.environ.get('MOBILE_SKIP_MATRIX') else [(320,480),(360,560),(390,760),(430,915),(844,390)]
  for width,height in viewport_cases:
   page.set_viewport_size({'width':width,'height':height})
   print(f'Checking {width}x{height}',flush=True)
   for scene,primary in [('explore','Move up'),('combat','Attack'),('enemyInitiated','Attack'),('floorKnife','Take item'),('loot','Take item'),('fullBag','Bag full · Manage items'),('level','Power +2'),('dead','Begin a new journey'),('won','Continue exploring'),('stairs','Ascend to the next floor'),('critical','Move up'),('lastBreath','Use healing potion'),('lethal','Attack'),('critThreat','Attack')]:
    load_fixture(page,scene);fits(page)
    try:visible_action(page,primary)
    except Exception:
     page.screenshot(path=str(root/'work/mobile-failure.png'));print('Failed scene',scene,width,height,flush=True);raise
    if scene in ['combat','enemyInitiated','lethal','critThreat']:
     visible_action(page,'Enemy stats');visible_action(page,f"Items ({sum(i['kind'] in ['heal','mana','antidote','rope','projectile','armor','boost','xp'] for i in fixtures[scene]['inventory'])})")
    if scene=='explore':assert visible_action(page,'Move up').bounding_box()['height']>=44
  page.set_viewport_size({'width':390,'height':760});load_fixture(page,'explore');visible_action(page,'Use healing potion').tap();expect(page.locator('.hud-vitals')).to_contain_text('15 / 15')
  for name,title in [('Bag','Inventory'),('Spells','Magic'),('Open adventure log','Adventure log'),('Character','Character')]:
   visible_action(page,name).tap();expect(page.get_by_role('dialog',name=title)).to_be_visible();visible_action(page,'Return to dungeon').tap();fits(page)
  visible_action(page,'Show floor overview').tap();expect(page.get_by_role('button',name='Follow hero')).to_have_attribute('aria-pressed','true');fits(page);visible_action(page,'Follow hero').tap()
  load_fixture(page,'combat');visible_action(page,'Spells').tap();page.get_by_role('dialog',name='Magic').get_by_role('button',name='Cast · 5 MP').tap();expect(page.get_by_role('dialog',name='Magic')).not_to_be_visible();fits(page);expect(page.locator('.encounter')).to_contain_text('20/30')
  load_fixture(page,'combat');expect(page.locator('.encounter-notice')).to_contain_text('INSPECTING ENEMY');visible_action(page,'Enemy stats').focus();page.keyboard.press('Enter');expect(page.get_by_role('dialog',name='Enemy stats')).to_be_visible();expect(page.get_by_role('dialog',name='Enemy stats')).to_contain_text('Inspecting is safe');visible_action(page,'Return to dungeon').tap();expect(page.locator('.encounter-notice')).to_contain_text('NO ATTACK YET')
  page.get_by_role('button',name='Items (',exact=False).tap();dialog=page.get_by_role('dialog',name='Combat items');expect(dialog).to_contain_text('Throwing Knife');dialog.get_by_role('button',name='Throw',exact=True).tap();expect(dialog).not_to_be_visible();expect(page.locator('.encounter')).to_contain_text('25/30');expect(page.locator('.encounter-notice')).to_contain_text('COMBAT IN PROGRESS');page.get_by_role('button',name='Items (',exact=False).tap();page.get_by_role('dialog',name='Combat items').get_by_role('button',name='Drink potion',exact=True).tap();expect(page.locator('.hud-vitals')).to_contain_text('17 / 17');expect(page.locator('.encounter')).to_contain_text('25/30');visible_action(page,'Enemy stats').focus();page.keyboard.press('Enter');expect(page.get_by_role('dialog',name='Enemy stats')).to_be_visible();visible_action(page,'Return to dungeon').tap();expect(page.locator('.encounter')).to_contain_text('25/30')
  load_fixture(page,'enemyInitiated');expect(page.locator('.encounter-notice')).to_contain_text('approached you');expect(page.locator('.encounter-notice')).to_contain_text('No blow exchanged yet');page.screenshot(path=str(root/'work/combat-ux-v3.png'))
  load_fixture(page,'floorKnife');expect(page.get_by_role('button',name='Use from floor',exact=True)).to_have_count(0);expect(page.get_by_role('button',name='Take item',exact=True)).to_be_enabled()
  load_fixture(page,'equipment');visible_action(page,'Bag').tap();weapon=page.get_by_role('dialog',name='Inventory').locator('.item').filter(has_text='Heavy practice sword');expect(weapon).to_contain_text('Requires 40 Power; you have 1.');expect(weapon.get_by_role('button',name='Equip',exact=True)).to_be_disabled();visible_action(page,'Return to dungeon').tap()
  load_fixture(page,'fullBag');visible_action(page,'Bag full · Manage items').tap();page.get_by_role('dialog',name='Inventory').get_by_role('button',name='Drop',exact=True).first.tap();visible_action(page,'Return to dungeon').tap();visible_action(page,'Take item').tap();expect(page.locator('.controls')).to_be_visible();fits(page)
  load_fixture(page,'fullBag');visible_action(page,'Use from floor').tap();expect(page.locator('.hud-vitals')).to_contain_text('15 / 15');expect(page.locator('.controls')).to_be_visible();fits(page)
  load_fixture(page,'critical');expect(page.locator('.mobile-hud')).to_contain_text('CRITICAL');expect(page.locator('.shell')).to_have_class('shell compact-game health-critical')
  load_fixture(page,'lastBreath');expect(page.locator('.mobile-hud')).to_contain_text('LAST BREATH');page.screenshot(path=str(root/'work/last-breath-v3.png'))
  load_fixture(page,'lethal');expect(page.locator('.lethal-warning')).to_contain_text('NEXT HIT CAN KILL YOU');page.screenshot(path=str(root/'work/lethal-warning-v3.png'))
  load_fixture(page,'critThreat');expect(page.locator('.lethal-warning')).to_contain_text('A CRITICAL HIT CAN KILL YOU')
  load_fixture(page,'level');visible_action(page,'Power +2').tap();expect(page.locator('.controls')).to_be_visible();fits(page)
  load_fixture(page,'explore');page.screenshot(path=str(root/'work/mobile-ux-v2.png'),full_page=True)
  page.emulate_media(reduced_motion='reduce');load_fixture(page,'explore');visible_action(page,'Use healing potion').tap();expect(page.locator('.hud-vitals')).to_contain_text('15 / 15')
  assert not api_requests,api_requests
  assert not errors,errors
  print(f'PASS: {len(viewport_cases)*14} viewport/scene checks; reduced-motion healing; floor use with full bag; 10%/1% health cues; lethal/critical warnings; no page scrolling; primary actions visible; touch healing; combat magic; full-bag recovery; level-up; drawers; overview; offline save/reload; no browser errors')
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
