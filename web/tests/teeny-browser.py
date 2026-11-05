"""Teeny Dungeon phone flow and README screenshots against the offline bundle."""
import os,json,pathlib,subprocess,time,urllib.request
from playwright.sync_api import sync_playwright,expect
root=pathlib.Path(__file__).resolve().parents[1]
shots=root/'docs/screenshots';shots.mkdir(parents=True,exist_ok=True)
fixtures=json.loads(subprocess.check_output(['node','--import','tsx','tests/mobile-fixtures.ts'],cwd=root,text=True))
server=subprocess.Popen(['python3','-m','http.server','3194','--bind','127.0.0.1','--directory',str(root/'dist/android')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(100):
  try:urllib.request.urlopen('http://127.0.0.1:3194');break
  except Exception:time.sleep(.1)
 with sync_playwright() as pw:
  exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
  browser=pw.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:3194');expect(page.locator('h1')).to_contain_text('TEENY');page.screenshot(path=str(shots/'welcome.png'))
  page.get_by_placeholder('Adventurer').fill('Elara');page.get_by_role('button',name='Mage',exact=False).click();page.get_by_role('button',name='Enter the dungeon').click();page.wait_for_selector('canvas')
  def load(g):
   page.evaluate('''game=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));const all=JSON.parse(localStorage.getItem(k));all.games[localStorage.getItem('dungeon-key')]=game;localStorage.setItem(k,JSON.stringify(all));}''',g)
   page.reload();page.wait_for_selector('canvas');page.wait_for_timeout(350)
  def saved():return page.evaluate('''()=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));return JSON.parse(localStorage.getItem(k)).games[localStorage.getItem('dungeon-key')];}''')
  page.emulate_media(reduced_motion='reduce')
  def mapshot(game):
   load(game);page.get_by_role('button',name='Overview',exact=True).click();page.wait_for_timeout(150)
   return page.locator('canvas').screenshot()
  fog=fixtures['fogSecret'];plain=json.loads(json.dumps(fog));plain['secretDoors']=[]
  dark_map=mapshot(plain);assert mapshot(fog)==dark_map,'Secret door leaked through darkness'
  near=json.loads(json.dumps(fog));near['player']['x']=28;near_plain=json.loads(json.dumps(near));near_plain['secretDoors']=[]
  assert mapshot(near)!=mapshot(near_plain),'Secret door did not appear within sight'
  lit=json.loads(json.dumps(fog));lit['light']=[[True for _ in row]for row in lit['light']];lit_plain=json.loads(json.dumps(lit));lit_plain['secretDoors']=[]
  assert mapshot(lit)!=mapshot(lit_plain),'Night Vision failed to reveal the door'
  legacy=json.loads(json.dumps(fog));legacy['secretDoors'][0].pop('fogVersion',None)
  for yy in range(4,11):
   for xx in range(33,40):legacy['light'][yy][xx]=True
  for xx in range(29,34):legacy['light'][7][xx]=True
  assert mapshot(legacy)==dark_map,'Legacy secret-door light was not repaired on load'
  assert saved()['secretDoors'][0].get('fogVersion') is None,'Read-only loading unexpectedly overwrote a save'
  page.emulate_media(reduced_motion='no-preference')
  load(fixtures['explore']);page.screenshot(path=str(shots/'explore.png'));assert page.get_by_role('button',name='Wait',exact=True).count()==0
  journal=json.loads(json.dumps(fixtures['explore']));journal['log']=['Zombie takes 12 poison damage. You gain 5 HP and 3 mana.','Gained 20 EXP.'];journal['logSerial']=2;load(journal)
  feed=page.locator('.play-map .chronicle-feed');expect(feed).to_be_visible()
  expect(feed).to_contain_text('Zombie takes 12 poison damage.')
  assert feed.locator('header').bounding_box()['height']<=34
  assert feed.locator('header button').last.bounding_box()['x']+feed.locator('header button').last.bounding_box()['width']<=feed.bounding_box()['x']+feed.bounding_box()['width']
  assert page.locator('.play-toast,.chronicle-peek').count()==0
  expect(feed.locator('.chronicle-status')).to_have_text('poison')
  before=saved()['revision'];feed.locator('.chronicle-feed-scroll').focus();page.keyboard.press('ArrowDown');assert saved()['revision']==before
  page.wait_for_timeout(6700);expect(feed).to_contain_text('Gained 20 EXP.')
  page.get_by_role('button',name='Hide recent chronicle entries').click();expect(feed.locator('ol')).to_have_count(0)
  page.get_by_role('button',name='Show recent chronicle entries').click();expect(feed.locator('li')).to_have_count(2)
  (root/'work').mkdir(exist_ok=True);page.screenshot(path=str(root/'work/live-chronicle.png'))
  page.get_by_role('button',name='Open journey chronicle',exact=True).click()
  expect(page.get_by_role('dialog',name='Journey chronicle')).to_be_visible()
  expect(page.locator('.chronicle-entries .chronicle-name').first).to_have_text('Zombie')
  expect(page.locator('.chronicle-entries .chronicle-status').first).to_have_text('poison')
  expect(page.locator('.chronicle-entries .chronicle-hp').first).to_have_text('HP')
  assert float(page.locator('.chronicle-entries p').first.evaluate('e=>parseFloat(getComputedStyle(e).fontSize)'))>=17
  page.get_by_role('button',name='Combat',exact=True).click();expect(page.locator('.chronicle-entries li')).to_have_count(1)
  page.get_by_role('button',name='Discoveries',exact=True).click();expect(page.locator('.chronicle-entries')).to_contain_text('Gained 20 EXP.')
  page.get_by_role('button',name='All',exact=True).click();page.screenshot(path=str(shots/'chronicle.png'))
  page.get_by_role('button',name='Close details',exact=True).click()
  g=fixtures['combat'];g['player']['stats']['Mana']=0;load(g)
  expect(page.locator('.magic-ribbon')).to_be_visible();expect(page.locator('.spell-card.unavailable').first).to_be_visible();page.locator('.spell-card').first.click();expect(page.locator('.spell-inspection')).to_be_visible();expect(page.locator('.spell-inspection .primary')).to_be_disabled();page.screenshot(path=str(shots/'spell-inspection.png'));page.get_by_role('button',name='Close spell').click()
  before=saved()['revision'];canvas=page.locator('canvas').bounding_box();x=canvas['x']+canvas['width']/2;y=canvas['y']+canvas['height']/2;page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+60,y,steps=6);page.mouse.up();page.wait_for_timeout(150);assert saved()['revision']==before
  load(fixtures['combat']);page.screenshot(path=str(shots/'encounter.png'))
  page.get_by_role('button',name='Hide recent chronicle entries').click();page.get_by_role('button',name='Attack',exact=True).click()
  expect(page.locator('.chronicle-feed ol')).to_be_visible();expect(page.locator('.chronicle-feed li').first).to_contain_text(saved()['log'][-1])
  page.reload();page.wait_for_selector('canvas');expect(page.locator('.chronicle-feed li').first).to_contain_text(saved()['log'][-1])
  page.evaluate('document.activeElement.blur()');before=saved()['revision'];page.keyboard.press('Space');page.wait_for_timeout(100);assert saved()['revision']==before
  load(fixtures['fullBag']);expect(page.locator('.inventory-ribbon')).to_contain_text('FULL');page.screenshot(path=str(shots/'bag.png'))
  load(fixtures['market']);assert page.locator('.chief-speech').bounding_box()['y']+page.locator('.chief-speech').bounding_box()['height']<=page.locator('.chronicle-feed').bounding_box()['y'];page.get_by_role('button',name='Talk / trade',exact=True).click();page.get_by_role('button',name='Sell items',exact=True).click();expect(page.locator('.market-offer').first).to_be_visible();review=page.get_by_role('button',name='Review sale').first;review.click();expect(page.get_by_role('button',name='Sell for',exact=False)).to_be_visible();page.screenshot(path=str(shots/'market.png'))
  load(fixtures['floorBoon']);page.get_by_role('button',name='Attack',exact=True).click()
  expect(page.locator('.boon-notice')).to_be_visible();expect(page.locator('.boon-notice')).to_contain_text('Three health pods')
  assert len([pod for pod in saved()['pods'] if pod.get('healthOnly')])==3
  assert saved()['floorBoonGranted'] and saved()['pendingLevels']
  page.wait_for_timeout(1200);expect(page.locator('.boon-notice')).to_be_visible()
  page.get_by_role('button',name='Dismiss boon announcement',exact=True).click();expect(page.locator('.boon-notice')).to_have_count(0)
  page.get_by_role('button',name='Power +2',exact=True).click();page.wait_for_timeout(150)
  page.reload();page.wait_for_selector('canvas');assert saved()['floorBoonGranted'] and len([pod for pod in saved()['pods'] if pod.get('healthOnly')])==3
  page.get_by_role('button',name='Open journey chronicle',exact=True).click();expect(page.locator('.chronicle-entries')).to_contain_text('FLOOR BOON:');page.get_by_role('button',name='Close details',exact=True).click()
  print('PASS: three health pods, floor-clearing announcement over level-up, dismissal, reload and chronicle',flush=True)
  load(fixtures['goldenGauntlet'])
  gauntlet=page.get_by_role('button',name='Item: Golden Gauntlet',exact=True)
  expect(gauntlet).to_contain_text('PASSIVE · ACTIVE');expect(gauntlet).to_contain_text('+10 Attack')
  assert 'unavailable' not in (gauntlet.get_attribute('class') or '')
  expect(page.locator('.damage-forecast b')).to_contain_text('40')
  gauntlet.click();expect(page.locator('.passive-status')).to_contain_text('ACTIVE · +10 Attack')
  assert page.get_by_role('button',name='Use item',exact=True).count()==0
  page.get_by_role('button',name='Close details',exact=True).click()
  hp=saved()['monsters'][0]['hp'];page.get_by_role('button',name='Attack',exact=True).click();page.wait_for_timeout(150);assert saved()['monsters'][0]['hp']==hp-40
  page.get_by_role('button',name='Item: Tiny Mana Potion',exact=True).click();page.get_by_role('button',name='Use item',exact=True).click();page.wait_for_timeout(150)
  expect(page.get_by_role('button',name='Item: Golden Gauntlet',exact=True)).to_contain_text('PASSIVE · INACTIVE')
  expect(page.get_by_role('button',name='Item: Golden Gauntlet',exact=True)).to_contain_text('Needs 0 mana')
  expect(page.locator('.damage-forecast b')).to_contain_text('30')
  page.reload();page.wait_for_selector('canvas');expect(page.get_by_role('button',name='Item: Golden Gauntlet',exact=True)).to_contain_text('PASSIVE · INACTIVE')
  print('PASS: Golden Gauntlet preview, real damage, Magic Scales, passive status, mana refill and reload',flush=True)
  load(fixtures['specialtyMarket']);page.get_by_role('button',name='Talk / trade',exact=True).click()
  expect(page.locator('.trade-specialty')).to_contain_text('Magic & mana')
  page.get_by_role('button',name='Buy Sapphire Staff',exact=True).click();page.wait_for_timeout(150)
  assert any(i['name']=='Sapphire Staff' for i in saved()['inventory'])
  page.get_by_role('button',name='Sell items',exact=True).click()
  offer=page.locator('.market-offer').filter(has_text='Dark Staff');expect(offer).to_contain_text('Specialty offer')
  expect(page.locator('.market-offer').filter(has_text='Throwing Knife')).to_contain_text('Not buying this item')
  price=int(offer.locator('em').inner_text().split()[0]);assert 22<=price<=24
  offer.get_by_role('button',name='Review sale',exact=True).click();offer.get_by_role('button',name=f'Sell for {price} gold',exact=True).click();page.wait_for_timeout(150)
  assert saved()['player']['gold']==480+price
  assert not any(i['name']=='Dark Staff' for i in saved()['inventory'])
  page.reload();page.wait_for_selector('canvas');assert saved()['player']['gold']==480+price
  page.get_by_role('button',name='Talk / trade',exact=True).click();expect(page.locator('.trade-specialty')).to_contain_text('Magic & mana')
  page.set_viewport_size({'width':320,'height':480});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=str(root/'work/specialty-market.png'));page.set_viewport_size({'width':390,'height':844})
  load(fixtures['trapUi']);page.screenshot(path=str(shots/'traps.png'))
  load(fixtures['won']);expect(page.get_by_role('dialog',name='Victory')).to_be_visible();page.get_by_role('button',name='Continue to floor 4 →',exact=True).click();page.wait_for_timeout(250);assert saved()['floor']==3;assert saved()['status']=='playing'
  load(fixtures['level']);page.screenshot(path=str(shots/'level-up.png'));expect(page.locator('.level-gains')).to_be_visible()
  dead=fixtures['dead'];dead['death']['critical']=True;dead['achievements']=[{'name':'First Blood','points':25}];load(dead);expect(page.get_by_test_id('death-screen')).to_contain_text('CRITICAL HIT');page.wait_for_timeout(3800);page.screenshot(path=str(shots/'death.png'));assert float(page.get_by_test_id('death-screen').evaluate('e=>getComputedStyle(e).opacity'))==1
  for width,height in [(320,480),(360,560),(390,760),(430,915),(844,390)]:
   page.set_viewport_size({'width':width,'height':height})
   for scene in ['explore','combat','fullBag','level','won','market','trapUi']:
    load(fixtures[scene]);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(scene,width,height)
    assert page.evaluate('document.documentElement.scrollHeight<=innerHeight+1'),(scene,width,height)
    expect(page.locator('.inventory-ribbon')).to_be_attached()
  assert not errors,errors
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  browser.close();print('PASS: phone spell inspection, unavailable spells, no swipe fleeing or waiting, full bag, level gains, critical death overlay; screenshots captured')
finally:
 server.terminate();server.wait(timeout=5)
