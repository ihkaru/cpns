import xml.etree.ElementTree as ET
import re
import subprocess
import os

def run_cmd(args):
    result = subprocess.run(args, capture_output=True, text=True)
    return result.stdout

def dump_ui():
    run_cmd(["adb", "shell", "uiautomator", "dump", "/sdcard/window_dump.xml"])
    # Pull the XML file to be safe
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

def get_clickable_packets():
    xml_str = dump_ui()
    if not xml_str:
        return []
    
    try:
        root = ET.fromstring(xml_str.encode('utf-8'))
    except Exception as e:
        print("XML Parse Error:", e)
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

# Click TWK first to test
print("Tapping TWK to enter packet list...")
run_cmd(["adb", "shell", "input", "tap", "194", "539"])
time_sleep = 4
import time
print(f"Waiting {time_sleep}s...")
time.sleep(time_sleep)

packets = get_clickable_packets()
print(f"Found {len(packets)} packets:")
for p in packets:
    print(f" - {p['title']} @ ({p['x']}, {p['y']}) [y1={p['y1']}, y2={p['y2']}]")

# Go back to home screen
print("Going back to home...")
run_cmd(["adb", "shell", "input", "keyevent", "4"])
