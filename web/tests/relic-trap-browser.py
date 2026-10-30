"""Offline phone interaction checks for weapon relic controls, break alerts and traps."""
import json, os, pathlib, shutil, subprocess, tempfile, time
from playwright.sync_api import sync_playwright, expect

root = pathlib.Path(__file__).resolve().parents[1]
fixtures = json.loads(subprocess.check_output(["node", "--import", "tsx", "tests/mobile-fixtures.ts"], cwd=root, text=True))
bundle = tempfile.TemporaryDirectory(prefix="dungeon-relic-phone-")
shutil.copytree(root / "dist/android", bundle.name, dirs_exist_ok=True)
server = subprocess.Popen(["python3", "-m", "http.server", "3196", "--bind", "127.0.0.1", "--directory", bundle.name], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def saved(page):
    return page.evaluate('''()=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));return JSON.parse(localStorage.getItem(k)).games[localStorage.getItem('dungeon-key')];}''')

def load(page, name):
    page.evaluate('''game=>{const k=Object.keys(localStorage).find(k=>k.endsWith('dungeon.android.saves.v1'));const all=JSON.parse(localStorage.getItem(k));all.games[localStorage.getItem('dungeon-key')]=game;localStorage.setItem(k,JSON.stringify(all));}''', fixtures[name])
    page.reload()
    page.wait_for_selector("[data-testid=death-screen]" if name == "dead" else "canvas")

try:
    for _ in range(40):
        try:
            import urllib.request
            urllib.request.urlopen("http://127.0.0.1:3196", timeout=1)
            break
        except Exception:
            time.sleep(.1)
    with sync_playwright() as p:
        exe = os.environ.get("CHROMIUM_PATH") or ("/usr/bin/chromium" if pathlib.Path("/usr/bin/chromium").exists() else None)
        browser = p.chromium.launch(executable_path=exe, headless=True, args=["--no-sandbox", "--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width": 390, "height": 760}, is_mobile=True, has_touch=True)
        page.goto("http://127.0.0.1:3196")
        page.get_by_placeholder("Adventurer").fill("Relic tester")
        page.get_by_role("button", name="Warrior", exact=False).tap()
        page.get_by_role("button", name="Enter the dungeon").tap()
        page.wait_for_selector("canvas")

        load(page, "relicUi")
        page.get_by_role("button", name="Item: Anvil").tap()
        expect(page.get_by_role("button", name="Upgrade Fragile Sword → Iron Sword", exact=False)).to_be_visible()
        page.get_by_role("button", name="Upgrade Fragile Sword → Iron Sword", exact=False).tap()
        expect(page.get_by_role("button", name="Item: Iron Sword")).to_be_visible()
        load(page, "relicUi")
        page.get_by_role("button", name="Item: Blade Shard").tap()
        page.get_by_role("button", name="Restore Fragile Sword", exact=False).tap()
        assert saved(page)["inventory"][0]["uses"] == saved(page)["inventory"][0]["maxUses"]

        load(page, "breakUi")
        page.get_by_role("button", name="Attack", exact=True).tap()
        expect(page.locator(".break-notice")).to_contain_text("Fragile Sword broke")
        assert saved(page)["player"]["weapons"] == []

        load(page, "shieldUi")
        expect(page.locator(".weapon-uses").first).to_contain_text("Shield +10 armor")

        load(page, "trapUi")
        before = saved(page)["player"]["gold"]
        box = page.locator("canvas").bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        page.mouse.move(x, y); page.mouse.down(); page.mouse.move(x + 65, y, steps=6); page.mouse.up()
        expect(page.locator(".play-toast")).to_contain_text("TRAP:")
        expect(page.get_by_test_id("trap-alert")).to_contain_text("TRAP!")
        expect(page.get_by_test_id("trap-alert")).to_contain_text("fairy stole")
        page.wait_for_function("()=>Number(getComputedStyle(document.querySelector('.trap-alert-flash')).opacity)>0", timeout=1000)
        assert saved(page)["traps"][0]["revealed"]
        assert saved(page)["player"]["gold"] < before

        load(page, "harnessUi")
        page.get_by_role("button", name="Item: Energy Harness").tap()
        expect(page.get_by_role("button", name="Convert adjacent small energy pod", exact=False)).to_be_visible()
        expect(page.get_by_role("button", name="Convert adjacent large energy pod", exact=False)).to_have_count(0)
        page.get_by_role("button", name="Convert adjacent small energy pod", exact=False).tap()
        assert len(saved(page)["pods"]) == 1
        assert saved(page)["pods"][0]["x"] == 17

        load(page, "fullEnergyPod")
        page.keyboard.press("ArrowRight")
        expect(page.get_by_test_id("energy-full-notice")).to_contain_text("ENERGY FULL")
        expect(page.get_by_test_id("energy-full-notice")).to_contain_text("remains here")
        assert len(saved(page)["pods"]) == 1
        expect(page.get_by_test_id("energy-full-notice")).to_have_count(0, timeout=2500)

        load(page, "dead")
        expect(page.get_by_test_id("death-screen")).to_be_visible()
        expect(page.get_by_role("heading", name="You Died")).to_be_visible()
        expect(page.locator(".death-score")).to_contain_text(str(fixtures["dead"]["score"]))
        expect(page.get_by_role("button", name="Begin a new journey")).to_be_visible()
        browser.close()
    print("PASS: relic controls, shield HUD, trap alert, full energy notice and death screen")
finally:
    server.terminate()
    server.wait(timeout=5)
    bundle.cleanup()
