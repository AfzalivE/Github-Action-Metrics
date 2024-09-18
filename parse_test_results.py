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

            # Determine if root is 'testsuite' or 'testsuites'
            if root.tag == 'testsuite':
                # Process the single testsuite
                testsuite = root
                result = parse_testsuite(testsuite)
                if result:
                    results.append(result)
            elif root.tag == 'testsuites':
                # Process multiple testsuites
                for testsuite in root.findall('testsuite'):
                    result = parse_testsuite(testsuite)
                    if result:
                        results.append(result)
    return results

def parse_testsuite(testsuite):
    try:
        tests = int(testsuite.get('tests', 0))
        failures = int(testsuite.get('failures', 0))
        errors = int(testsuite.get('errors', 0))
        skipped = int(testsuite.get('skipped', 0))
        time = float(testsuite.get('time', 0))
        timestamp = testsuite.get('timestamp', datetime.now().isoformat())

        passed = tests - failures - errors - skipped

        return {
            'timestamp': timestamp,
            'tests': tests,
            'passed': passed,
            'failures': failures,
            'errors': errors,
            'skipped': skipped,
            'time': time
        }
    except Exception as e:
        print(f"Error parsing testsuite: {e}")
        return None

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
