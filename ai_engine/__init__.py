import os

# Isolate Ultralytics YOLO configuration locally to BAVIS project
# Prevents conflicts with global settings or other projects like Eagle-Eye
_bavis_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_yolo_dir = os.path.join(_bavis_root, ".ultralytics")
os.makedirs(_yolo_dir, exist_ok=True)
os.environ["YOLO_CONFIG_DIR"] = _yolo_dir
os.environ["ULTRALYTICS_CONFIG_DIR"] = _yolo_dir

__version__ = "1.0.0"
