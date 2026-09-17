import os
import subprocess
import sys

def generate_certs():
    ssl_dir = os.path.join(os.path.dirname(__file__), "../nginx/ssl")
    os.makedirs(ssl_dir, exist_ok=True)
    
    cert_path = os.path.join(ssl_dir, "bavis.crt")
    key_path = os.path.join(ssl_dir, "bavis.key")
    
    if os.path.exists(cert_path) and os.path.exists(key_path):
        print(f"[SSL Generator] Certificates already exist at {ssl_dir}")
        return

    print("[SSL Generator] Generating self-signed TLS certificate for local dev/demo...")
    cmd = [
        "openssl", "req", "-x509", "-nodes", "-days", "365",
        "-newkey", "rsa:2048",
        "-keyout", key_path,
        "-out", cert_path,
        "-subj", "/C=IN/ST=Delhi/L=NewDelhi/O=SSB/OU=BAVIS/CN=localhost"
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"[SSL Generator] SSL Certificate generated: {cert_path}")
    except Exception as e:
        print(f"[SSL Generator] Note: openssl not available locally ({e}). Certificate generation can run inside container.")

if __name__ == "__main__":
    generate_certs()
