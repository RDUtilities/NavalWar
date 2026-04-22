import numpy as np
from scipy.io.wavfile import write

# Settings
sample_rate = 44100
duration = 1.5
t = np.linspace(0, duration, int(sample_rate * duration), False)

# Explosion (low freq thump)
explosion = np.sin(2 * np.pi * 60 * t) * np.exp(-5 * t)

# Splash noise (white noise burst)
noise = np.random.normal(0, 1, t.shape)
splash = noise * np.exp(-3 * (t - 0.1))
splash[t < 0.05] = 0  # slight delay after impact

# Low rumble tail
rumble = np.sin(2 * np.pi * 30 * t) * np.exp(-1.5 * t)

# Combine layers
audio = explosion + 0.6 * splash + 0.5 * rumble

# Normalize
audio = audio / np.max(np.abs(audio))

# Convert to 16-bit PCM
audio_int16 = np.int16(audio * 32767)

# Save
write("naval_salvo_hit.wav", sample_rate, audio_int16)

print("Created naval_salvo_hit.wav")
