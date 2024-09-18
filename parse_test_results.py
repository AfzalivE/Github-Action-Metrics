import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime

def parse_xml_files():
    results = []
    for filename in os.listdir('test-results'):
        if filename.startswith('TEST-') and filename.endswith('.xml'):
            tree = ET.parse(os.path.join('test-results', filename))
            root = tree.getroot()
            for testsuite in root.findall('testsuite'):
                tests = int(testsuite.get('tests', 0))
                failures = int(testsuite.get('failures', 0))
                errors = int(testsuite.get('errors', 0))
                skipped = int(testsuite.get('skipped', 0))
                time = float(testsuite.get('time', 0))
                timestamp = testsuite.get('timestamp', datetime.now().isoformat())

                passed = tests - failures - errors - skipped

                results.append({
                    'timestamp': timestamp,
                    'tests': tests,
                    'passed': passed,
                    'failures': failures,
                    'errors': errors,
                    'skipped': skipped,
                    'time': time
                })
    return results

def update_data_file(results):
    data_file = 'test_data.json'
    if os.path.exists(data_file):
        with open(data_file, 'r') as f:
            data = json.load(f)
    else:
        data = []

    data.extend(results)

    with open(data_file, 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    results = parse_xml_files()
    update_data_file(results)
