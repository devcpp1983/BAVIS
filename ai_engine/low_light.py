"""
BAVIS AI / CV - Low-Light & Night Analytics Preprocessor
Provides adaptive CLAHE, gamma correction, and illumination normalization
"""

import cv2
import numpy as np


class LowLightEnhancer:
    """
    Analyzes frame illumination and dynamically applies contrast and
    brightness enhancements to boost object detection in poor border lighting.
    """

    def __init__(
        self,
        brightness_threshold: float = 65.0,
        clahe_clip_limit: float = 3.0,
        clahe_tile_grid: tuple[int, int] = (8, 8)
    ):
        self.brightness_threshold = brightness_threshold
        self.clahe = cv2.createCLAHE(
            clipLimit=clahe_clip_limit, 
            tileGridSize=clahe_tile_grid
        )

    def calculate_brightness(self, frame_bgr: np.ndarray) -> float:
        """Calculate mean brightness using perceptual luminance (Y channel in YCrCb or Grayscale)."""
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        return float(np.mean(gray))

    def is_low_light(self, frame_bgr: np.ndarray) -> bool:
        """Determine if a frame falls below the acceptable ambient light threshold."""
        return self.calculate_brightness(frame_bgr) < self.brightness_threshold

    def enhance(self, frame_bgr: np.ndarray, gamma: float = 1.4) -> np.ndarray:
        """
        Enhance low-light frame using:
        1. LAB / YCrCb color space conversion to isolate luminance channel.
        2. CLAHE (Contrast Limited Adaptive Histogram Equalization) on L-channel.
        3. Dynamic Gamma correction for shadow boost without saturation.
        """
        # Convert BGR to LAB color space
        lab = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        # Apply CLAHE to L-channel
        cl = self.clahe.apply(l_channel)

        # Merge back and convert to BGR
        merged_lab = cv2.merge((cl, a_channel, b_channel))
        enhanced_bgr = cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)

        # Gamma correction lookup table
        if gamma != 1.0:
            inv_gamma = 1.0 / gamma
            table = np.array([
                ((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)
            ]).astype("uint8")
            enhanced_bgr = cv2.LUT(enhanced_bgr, table)

        return enhanced_bgr

    def process(self, frame_bgr: np.ndarray, force_mode: bool | None = None) -> tuple[np.ndarray, bool]:
        """
        Process frame and return (processed_frame, was_enhanced_boolean).
        """
        if force_mode is True:
            return self.enhance(frame_bgr), True
        elif force_mode is False:
            return frame_bgr, False
        else:
            # Auto-detect mode
            if self.is_low_light(frame_bgr):
                return self.enhance(frame_bgr), True
            return frame_bgr, False
