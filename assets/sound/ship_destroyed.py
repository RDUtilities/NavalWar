import numpy as np
from scipy.io.wavfile import write

sample_rate = 44100
duration = 2.5
t = np.linspace(0, duration, int(sample_rate * duration), False)

# BIG explosion (low + mid frequencies)
explosion = (
    0.8 * np.sin(2 * np.pi * 55 * t) +
    0.5 * np.sin(2 * np.pi * 90 * t)
) * np.exp(-6 * t)

# Impact crack (sharp transient)
crack_noise = np.random.normal(0, 1, t.shape)
crack = crack_noise * np.exp(-25 * t)

# Water churn (kicks in right after explosion)
water_noise = np.random.normal(0, 1, t.shape)
water = water_noise * np.exp(-1.8 * (t - 0.1))
water[t < 0.05] = 0

# Bubble / foam effect (higher frequency fizz)
bubble = (
    0.2 * np.sin(2 * np.pi * 200 * t) +
    0.15 * np.sin(2 * np.pi * 260 * t)
)
bubble *= np.exp(-2.5 * (t - 0.2))
bubble[t < 0.2] = 0

# Low-end rumble tail
rumble = np.sin(2 * np.pi * 35 * t) * np.exp(-1.5 * t)

# Combine layers
audio = (
    explosion +
    0.6 * crack +
    0.7 * water +
    0.3 * bubble +
    0.5 * rumble
)

# Normalize
audio = audio / np.max(np.abs(audio))
audio_int16 = np.int16(audio * 32767)

# Save
write("ship_destroyed.wav", sample_rate, audio_int16)

print("Created ship_destroyed.wav")
