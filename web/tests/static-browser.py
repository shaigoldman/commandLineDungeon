"""Exercise the ordinary web bundle under a Pages-style subpath, without any backend."""
import json, os, pathlib, subprocess, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright, expect
root=pathlib.Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as tmp:
 site=pathlib.Path(tmp);(site/'commandLineDungeon').symlink_to(root/'dist/client',target_is_directory=True)
 server=subprocess.Popen(['python3','-m','http.server','3197','--bind','127.0.0.1','--directory',str(site)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  for _ in range(100):
   try:urllib.request.urlopen('http://127.0.0.1:3197/commandLineDungeon/');break
   except Exception:time.sleep(.1)
  with sync_playwright() as pw:
   exe=os.environ.get('CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').exists() else None)
   browser=pw.chromium.launch(executable_path=exe,headless=True,args=['--no-sandbox'])
   context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
   page=context.new_page();errors=[];api_calls=[];bad=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda r:api_calls.append(r.url) if '/api/' in r.url else None)
   page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
   url='http://127.0.0.1:3197/commandLineDungeon/'
   page.goto(url);page.get_by_placeholder('Adventurer').fill('Elara')
   page.get_by_role('button',name='Mage',exact=False).click();page.get_by_role('button',name='Enter the dungeon').click()
   expect(page.get_by_role('button',name='Saved in browser')).to_be_visible();page.wait_for_selector('canvas')
   def state(p=page):return p.evaluate('''()=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));return JSON.parse(localStorage.getItem(k)).games[localStorage.getItem('dungeon-key')];}''')
   before=state();page.get_by_role('button',name='Saved in browser').click();page.get_by_role('button',name='Saved adventures',exact=True).click()
   dialog=page.get_by_role('dialog',name='Saved adventures');expect(dialog.get_by_role('button',name='Resume Elara')).to_be_visible()
   with page.expect_download() as info:dialog.get_by_role('button',name='Export saves',exact=True).click()
   backup=site/'save.json';info.value.save_as(backup);parsed=json.loads(backup.read_text());assert parsed['games'][0]['player']['name']=='Elara'
   assert parsed['games'][0]['startedAt']==before['startedAt'];assert len(parsed['games'])==1
   # Fresh context has no heroes. Restore through the real file picker input.
   fresh=browser.new_context(viewport={'width':320,'height':560});other=fresh.new_page();other.goto(url)
   other.get_by_role('button',name='Recover a saved adventure').click();restored=other.get_by_role('dialog',name='Saved adventures')
   expect(restored).to_contain_text('No saved adventures yet.')
   restored.locator('input[type=file]').set_input_files(backup)
   expect(restored).to_contain_text('Imported 1 adventure.');restored.get_by_role('button',name='Resume Elara').click()
   other.wait_for_selector('canvas');assert state(other)==before
   other.reload();other.wait_for_selector('canvas');assert state(other)==before
   # Invalid files must be rejected without hiding or replacing existing heroes.
   other.get_by_role('button',name='Saved in browser').click();other.get_by_role('button',name='Saved adventures',exact=True).click()
   restored=other.get_by_role('dialog',name='Saved adventures');invalid=site/'invalid.json';invalid.write_text('{"games":[{}]}')
   restored.locator('input[type=file]').set_input_files(invalid);expect(restored.get_by_role('alert')).to_contain_text('invalid')
   expect(restored.get_by_role('button',name='Resume Elara')).to_be_visible();assert state(other)==before
   # Importing again creates a copy while preserving the active adventure.
   restored.locator('input[type=file]').set_input_files(backup);expect(restored.get_by_role('button',name='Resume Elara')).to_have_count(2)
   assert state(other)==before
   assert other.evaluate('document.documentElement.scrollWidth<=innerWidth')
   (root/'work').mkdir(exist_ok=True);other.screenshot(path=str(root/'work/browser-save-backups.png'))
   # Another tab sees the same save. Storage failure reports failure instead of success.
   twin=context.new_page();twin.goto(url);twin.wait_for_selector('canvas');assert state(twin)==before
   twin.get_by_role('button',name='Saved in browser').click();twin.get_by_role('button',name='Saved adventures',exact=True).click()
   d=twin.get_by_role('dialog',name='Saved adventures')
   twin.evaluate('''()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.endsWith('dungeon.android.saves.v1'))throw new DOMException('Full','QuotaExceededError');return original.call(this,k,v);};}''')
   d.locator('input[type=file]').set_input_files(backup);expect(d.get_by_role('alert')).to_contain_text('Not enough storage');assert state(twin)==before
   # Gameplay still works when the network is disconnected after initial load.
   dialog.get_by_role('button',name='Close saved adventures').click()
   page.get_by_role('button',name='Close details',exact=True).click()
   x,y=before['player']['x'],before['player']['y']
   move=next(key for dx,dy,key in [(0,-1,'ArrowUp'),(0,1,'ArrowDown'),(-1,0,'ArrowLeft'),(1,0,'ArrowRight')] if before['tiles'][y+dy][x+dx]==0)
   context.set_offline(True);page.keyboard.press(move)
   page.wait_for_timeout(500)
   assert state()['revision']>before['revision']
   assert not api_calls,api_calls;assert not errors,errors;assert not bad,bad
   print('PASS: static Pages subpath, portrait/assets, zero API requests, local save/reload, backup download/import into fresh browser, invalid file, copy import, quota failure, tabs and gameplay without network')
   browser.close()
 finally:server.terminate();server.wait(timeout=10)
