import xml.etree.ElementTree as ET
import re
import subprocess
import os
import time

def run_cmd(args):
    result = subprocess.run(args, capture_output=True, text=True)
    return result.stdout

def force_stop_app():
    print("Force stopping app...")
    run_cmd(["adb", "shell", "am", "force-stop", "com.cimolet.cpnssoal"])
    time.sleep(1.0)

def wait_for_home_screen():
    print("Waiting for home screen (detecting btn_twk)...")
    for i in range(15):
        xml_str = dump_ui()
        if "btn_twk" in xml_str or "SOAL LATIHAN CPNS" in xml_str:
            print("Home screen detected!")
            return True
        print(f"Still waiting... ({i+1}/15)")
        time.sleep(2.0)
    print("WARNING: Home screen detection timed out.")
    return False

def launch_app():
    print("Launching app...")
    run_cmd(["adb", "shell", "monkey", "-p", "com.cimolet.cpnssoal", "-c", "android.intent.category.LAUNCHER", "1"])
    wait_for_home_screen()

def reset_app():
    force_stop_app()
    launch_app()

def dump_ui():
    run_cmd(["adb", "shell", "uiautomator", "dump", "/sdcard/window_dump.xml"])
    run_cmd(["adb", "pull", "/sdcard/window_dump.xml", "temp_dump.xml"])
    xml_str = ""
    if os.path.exists("temp_dump.xml"):
        with open("temp_dump.xml", "r", encoding="utf-8") as f:
            xml_str = f.read()
        os.remove("temp_dump.xml")
    return xml_str

def parse_bounds(bounds_str):
    match = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds_str)
    if match:
        return tuple(map(int, match.groups()))
    return None

def find_nodes(node, resource_id):
    results = []
    if node.attrib.get("resource-id") == resource_id:
        results.append(node)
    for child in node:
        results.extend(find_nodes(child, resource_id))
    return results

def find_first_child_with_id(node, resource_id):
    if node.attrib.get("resource-id") == resource_id:
        return node
    for child in node:
        res = find_first_child_with_id(child, resource_id)
        if res is not None:
            return res
    return None

def tap(x, y):
    run_cmd(["adb", "shell", "input", "tap", str(x), str(y)])

def swipe(x1, y1, x2, y2, duration=500):
    run_cmd(["adb", "shell", "input", "swipe", str(x1), str(y1), str(x2), str(y2), str(duration)])

def get_clickable_packets():
    xml_str = dump_ui()
    if not xml_str:
        return []
    
    try:
        root = ET.fromstring(xml_str.encode('utf-8'))
    except Exception as e:
        print("XML Parse Error in get_clickable_packets:", e)
        return []
        
    touch_nodes = find_nodes(root, "com.cimolet.cpnssoal:id/touch_me")
    packets = []
    for touch_node in touch_nodes:
        judul_node = find_first_child_with_id(touch_node, "com.cimolet.cpnssoal:id/tv_judul")
        if judul_node is not None:
            title = judul_node.attrib.get("text", "").strip()
            bounds_str = touch_node.attrib.get("bounds", "")
            bounds = parse_bounds(bounds_str)
            if bounds:
                x1, y1, x2, y2 = bounds
                mid_x = (x1 + x2) // 2
                mid_y = (y1 + y2) // 2
                packets.append({
                    "title": title,
                    "x": mid_x,
                    "y": mid_y,
                    "y1": y1,
                    "y2": y2
                })
    return packets

def click_packet_and_capture(title, x, y):
    print(f"[{title}] Tapping to open...")
    tap(x, y)
    time.sleep(3.0) # Wait for rules screen
    
    # Verify we are on Rules screen
    xml_str = dump_ui()
    if not xml_str:
        print(f"[{title}] Failed to dump UI on rules screen, resetting.")
        reset_app()
        return False
        
    try:
        root = ET.fromstring(xml_str.encode('utf-8'))
    except Exception:
        print(f"[{title}] Failed to parse UI on rules screen, resetting.")
        reset_app()
        return False
        
    btn_selanjutnya = find_first_child_with_id(root, "com.cimolet.cpnssoal:id/btn_selanjutnya")
    if btn_selanjutnya is None:
        print(f"[{title}] 'MULAI UJIAN' button not found, resetting.")
        reset_app()
        return False
        
    bounds = parse_bounds(btn_selanjutnya.attrib.get("bounds", ""))
    if not bounds:
        print(f"[{title}] Could not parse button bounds, resetting.")
        reset_app()
        return False
        
    bx1, by1, bx2, by2 = bounds
    bmx = (bx1 + bx2) // 2
    bmy = (by1 + by2) // 2
    
    print(f"[{title}] Tapping 'MULAI UJIAN'...")
    tap(bmx, bmy)
    time.sleep(4.5) # Wait for network capture to finish completely
    
    print(f"[{title}] Resetting app after capture...")
    reset_app()
    return True

def crawl_category(category_name, tap_coords):
    print(f"\n======================================")
    print(f" CRAWLING CATEGORY: {category_name}")
    print(f"======================================")
    
    print(f"Entering category {category_name}...")
    tap(tap_coords[0], tap_coords[1])
    time.sleep(5.0) # wait for list of packets to load
    
    visited = set()
    no_new_count = 0
    scroll_count = 0
    
    while True:
        packets = get_clickable_packets()
        if not packets:
            print("No packets found or failed to load. Resetting and re-entering...")
            reset_app()
            print(f"Re-entering category {category_name}...")
            tap(tap_coords[0], tap_coords[1])
            time.sleep(5.0)
            packets = get_clickable_packets()
            if not packets:
                print("Still no packets. Skipping category.")
                break
            
        unvisited_packets = []
        for p in packets:
            # Avoid the bottom ad/menu bar (y >= 1640) and top bar (y <= 200)
            if p["title"] not in visited and p["y1"] >= 200 and p["y2"] <= 1640:
                unvisited_packets.append(p)
                
        if not unvisited_packets:
            # All visible packets are visited, scroll down
            print("No unvisited packets visible. Scrolling down...")
            prev_titles = {p["title"] for p in packets}
            swipe(540, 1300, 540, 400, 800)
            time.sleep(2.5)
            
            scroll_count += 1
            if scroll_count >= 3:
                print("Reached scroll limit (3 swipes without clicking). Done with this category.")
                break
                
            # Check if the list changed
            post_scroll_packets = get_clickable_packets()
            post_titles = {p["title"] for p in post_scroll_packets}
            if post_titles == prev_titles or not post_titles:
                no_new_count += 1
                if no_new_count >= 2:
                    print("Reached the bottom of the list. Done with this category.")
                    break
            else:
                no_new_count = 0
            continue
            
        # Process the first unvisited packet
        p = unvisited_packets[0]
        success = click_packet_and_capture(p["title"], p["x"], p["y"])
        scroll_count = 0 # Reset scroll count when we click something
        if success:
            visited.add(p["title"])
            print(f"Successfully processed: {p['title']}")
        else:
            visited.add(p["title"])
            print(f"Skipping failed packet: {p['title']}")
            
        time.sleep(1.5)
        # Re-enter the category since click_packet_and_capture does reset_app()
        print(f"Re-entering category {category_name} for next packet...")
        tap(tap_coords[0], tap_coords[1])
        time.sleep(5.0)
        
    print(f"Finished category: {category_name}. Resetting app to clear state.")
    reset_app()

def main():
    categories = [
        {"name": "TIU", "tap": (540, 539)},
    ]
    
    # Start with a clean slate
    print("Initializing app reset...")
    reset_app()
    
    for cat in categories:
        crawl_category(cat["name"], cat["tap"])
        
    print("\n======================================")
    print(" ALL CATEGORIES CRAWLED SUCCESSFULLY!")
    print("======================================")

if __name__ == "__main__":
    main()
