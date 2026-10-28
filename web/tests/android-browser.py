"""Exercise the bundled Android-mode build with all external requests disabled."""
import os,pathlib,subprocess,socket,tempfile,time,urllib.request
from playwright.sync_api import sync_playwright,expect
root=pathlib.Path(__file__).resolve().parents[1]
server=subprocess.Popen(['python3','-m','http.server','3190','--bind','127.0.0.1','--directory','dist/android'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 for _ in range(100):
  try:urllib.request.urlopen('http://127.0.0.1:3190',timeout=1);break
  except Exception:time.sleep(.1)
 with sync_playwright() as p:
  executable=os.environ.get('CHROMIUM_PATH')
  if not executable and pathlib.Path('/usr/bin/chromium').exists():executable='/usr/bin/chromium'
  browser=p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
  context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  page=context.new_page();errors=[];api_requests=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  def route(r):
   if '/api/' in r.request.url:api_requests.append(r.request.url);r.abort()
   elif not r.request.url.startswith('http://127.0.0.1:3190/'):r.abort()
   else:r.continue_()
  page.route('**/*',route)
  page.goto('http://127.0.0.1:3190');page.get_by_placeholder('Adventurer').fill('Android Elara');page.get_by_role('button',name='Mage').tap();page.get_by_role('button',name='Enter the dungeon').tap();page.wait_for_selector('canvas')
  page.get_by_role('button',name='spells',exact=False).first.tap();page.get_by_role('button',name='Cast · 1 MP').tap();expect(page.locator('.bar-label').filter(has_text='MANA')).to_contain_text('9 / 10')
  page.get_by_role('button',name='Saved on phone').tap();page.get_by_role('dialog').wait_for();expect(page.get_by_role('dialog')).to_contain_text('saved on this phone');assert len(page.get_by_label('Device journey code').input_value())==64
  page.get_by_role('button',name='✕').tap();page.reload();page.wait_for_selector('canvas');expect(page.locator('h2').first).to_have_text('Android Elara');expect(page.locator('.bar-label').filter(has_text='MANA')).to_contain_text('9 / 10')
  assert page.locator('canvas').get_attribute('width')=='576'
  assert page.get_by_role('button',name='Move up',exact=True).bounding_box()['height']>=44
  page.get_by_role('button',name='Move up',exact=True).tap()
  page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(300);assert page.locator('canvas').get_attribute('width')=='960'
  assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
  assert not api_requests,api_requests
  assert not errors,errors
  print('PASS: offline Android-mode build; touch controls; saved spell/mana; reload/resume; portrait/landscape camera; no API/external dependency or browser exception')
  browser.close()
finally:
 server.terminate();server.wait(timeout=5)
