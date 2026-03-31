"""Run once to generate VAPID keys for Web Push.
Usage inside the container:
  docker-compose exec backend python generate_vapid.py
Then copy the output into your .env file.
"""
import base64
from py_vapid import Vapid
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

v = Vapid()
v.generate_keys()

private_pem = v.private_pem().decode().strip().replace("\n", "\\n")
public_bytes = v.public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
public_key = base64.urlsafe_b64encode(public_bytes).rstrip(b"=").decode()

print(f"VAPID_PRIVATE_KEY={private_pem}")
print(f"VAPID_PUBLIC_KEY={public_key}")
