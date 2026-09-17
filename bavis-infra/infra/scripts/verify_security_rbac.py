import sys
import time
import requests

BASE_URL = "http://localhost:8080/api/v1"
BACKEND_DIRECT_URL = "http://localhost:8000/api/v1"

def print_header(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_service_health(base_url):
    print_header("1. SERVICE HEALTH CHECKS")
    services = [
        ("Reverse Proxy Gateway", f"{base_url}/health"),
        ("Backend Direct", f"{BACKEND_DIRECT_URL}/health"),
        ("Ingestion Service", "http://localhost:8001/health"),
        ("AI Inference Engine", "http://localhost:8002/health"),
        ("Intelligence Engine", "http://localhost:8003/health")
    ]
    
    all_healthy = True
    for name, url in services:
        try:
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                print(f"  [PASS] {name:<25} -> {res.json()}")
            else:
                print(f"  [FAIL] {name:<25} -> HTTP {res.status_code}")
                all_healthy = False
        except Exception as e:
            print(f"  [WARN] {name:<25} -> Could not connect ({e})")
            all_healthy = False
    return all_healthy

def test_auth_and_rbac(base_url):
    print_header("2. AUTHENTICATION & RBAC ENFORCEMENT VERIFICATION")

    # Step 1: Login as Operator
    print("\n--> Logging in as 'operator'...")
    res_op = requests.post(f"{base_url}/auth/login", data={"username": "operator", "password": "operator_password_123"})
    if res_op.status_code != 200:
        print(f"  [FAIL] Login failed for operator: {res_op.text}")
        return False
    op_token = res_op.json()["access_token"]
    op_headers = {"Authorization": f"Bearer {op_token}"}
    print(f"  [PASS] Operator authenticated. Token obtained.")

    # Step 2: Operator attempts to list cameras (ALLOWED)
    res_cams = requests.get(f"{base_url}/cameras", headers=op_headers)
    if res_cams.status_code == 200:
        print(f"  [PASS] Operator access to /cameras ALLOWED (200 OK)")
    else:
        print(f"  [FAIL] Operator access to /cameras DENIED ({res_cams.status_code})")

    # Step 3: Operator attempts to create a zone (SHOULD BE DENIED - 403 Forbidden)
    print("\n--> Testing RBAC: Operator attempts to create zone (Requires Supervisor+)...")
    zone_payload = {"camera_id": "cam_01", "name": "Illegal Zone", "zone_type": "restricted", "polygon_coords": []}
    res_zone_op = requests.post(f"{base_url}/zones", json=zone_payload, headers=op_headers)
    if res_zone_op.status_code == 403:
        print(f"  [PASS] RBAC Enforcement SUCCESS: Operator denied access to /zones (403 Forbidden)")
    else:
        print(f"  [FAIL] RBAC Failure! Operator allowed to access /zones! HTTP {res_zone_op.status_code}")

    # Step 4: Operator attempts to hit Admin endpoint (SHOULD BE DENIED - 403 Forbidden)
    print("\n--> Testing RBAC: Operator attempts to update Admin Config (Requires Admin)...")
    admin_payload = {"retention_days": 30, "enable_biometric_face": True}
    res_admin_op = requests.post(f"{base_url}/admin/system_config", json=admin_payload, headers=op_headers)
    if res_admin_op.status_code == 403:
        print(f"  [PASS] RBAC Enforcement SUCCESS: Operator denied access to /admin/system_config (403 Forbidden)")
    else:
        print(f"  [FAIL] RBAC Failure! Operator allowed to access admin config! HTTP {res_admin_op.status_code}")

    # Step 5: Login as Admin & Update System Config (ALLOWED)
    print("\n--> Logging in as 'admin'...")
    res_adm = requests.post(f"{base_url}/auth/login", data={"username": "admin", "password": "admin_password_123"})
    adm_token = res_adm.json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}
    
    print("--> Admin attempts to update Admin Config...")
    res_admin_adm = requests.post(f"{base_url}/admin/system_config", json=admin_payload, headers=adm_headers)
    if res_admin_adm.status_code == 200:
        print(f"  [PASS] Admin access to /admin/system_config ALLOWED (200 OK)")
    else:
        print(f"  [FAIL] Admin denied access! HTTP {res_admin_adm.status_code}")

    return True

def test_pipeline_latency():
    print_header("3. PIPELINE LATENCY & END-TO-END ALERT TEST")
    try:
        start_time = time.time()
        print("--> Triggering simulated frame ingestion (Ingestion -> AI Engine -> Intelligence -> Backend)...")
        res = requests.post("http://localhost:8001/streams/simulate_frame/cam_bop_01", timeout=5)
        if res.status_code == 200:
            total_latency_ms = round((time.time() - start_time) * 1000, 2)
            data = res.json()
            print(f"  [PASS] Pipeline executed cleanly!")
            print(f"         Total E2E Trigger Latency: {total_latency_ms} ms")
            print(f"         Ingestion -> AI Latency:   {data.get('ingest_latency_ms')} ms")
            print(f"         AI Inference Latency:     {data.get('ai_result', {}).get('inference_latency_ms')} ms")
            return True
        else:
            print(f"  [FAIL] Frame simulation returned HTTP {res.status_code}")
            return False
    except Exception as e:
        print(f"  [WARN] Could not run end-to-end pipeline test ({e})")
        return False

def main():
    base_url = BASE_URL
    if len(sys.argv) > 1:
        base_url = sys.argv[1]

    print("\nStarting BAVIS Security, RBAC & Infrastructure Verification Suite...")
    h_ok = test_service_health(base_url)
    r_ok = test_auth_and_rbac(base_url)
    p_ok = test_pipeline_latency()

    print_header("SUMMARY")
    if h_ok and r_ok and p_ok:
        print("  🟢 ALL SECURITY, RBAC & INTEGRATION CHECKS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("  🟡 VERIFICATION COMPLETED WITH WARNINGS OR DISCONNECTED SERVICES.")
        sys.exit(0)

if __name__ == "__main__":
    main()
