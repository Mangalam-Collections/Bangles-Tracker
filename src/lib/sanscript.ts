// Simplified ITRANS-to-Devanagari transliteration engine (offline, no dependencies)

const consonants: Record<string, string> = {
  kh: 'ख', gh: 'घ', ch: 'च', chh: 'छ', jh: 'झ',
  Th: 'ठ', Dh: 'ढ', th: 'थ', dh: 'ध', ph: 'फ', bh: 'भ',
  sh: 'श', Sh: 'ष',
  ng: 'ङ', nj: 'ञ',
  k: 'क', g: 'ग', c: 'च', j: 'ज',
  T: 'ट', D: 'ड', N: 'ण', t: 'त', d: 'द', n: 'न',
  p: 'प', b: 'ब', m: 'म',
  y: 'य', r: 'र', l: 'ल', v: 'व', w: 'व',
  s: 'स', h: 'ह',
  f: 'फ़', z: 'ज़', q: 'क़',
};

const vowelStandalone: Record<string, string> = {
  aa: 'आ', ai: 'ऐ', au: 'औ', ee: 'ई', oo: 'ऊ',
  a: 'अ', i: 'इ', u: 'उ', e: 'ए', o: 'ओ',
};

const vowelMatra: Record<string, string> = {
  aa: 'ा', ai: 'ै', au: 'ौ', ee: 'ी', oo: 'ू',
  a: '', i: 'ि', u: 'ु', e: 'े', o: 'ो',
};

const HALANT = '्';

// Sorted by length desc for greedy matching
const consonantKeys = Object.keys(consonants).sort((a, b) => b.length - a.length);
const vowelKeys = Object.keys(vowelStandalone).sort((a, b) => b.length - a.length);

export function transliterateToHindi(input: string): string {
  if (!input) return '';
  const text = input.toLowerCase();
  let result = '';
  let i = 0;
  let lastWasConsonant = false;

  while (i < text.length) {
    // Skip spaces/numbers/punctuation
    if (/[\s\d.,!?;:\-_()₹/\\@#$%^&*+=]/.test(text[i])) {
      if (lastWasConsonant) result += HALANT;
      result += text[i];
      lastWasConsonant = false;
      i++;
      continue;
    }

    // Try vowel match first
    let foundVowel = false;
    for (const vk of vowelKeys) {
      if (text.substring(i, i + vk.length) === vk) {
        if (lastWasConsonant) {
          result += vowelMatra[vk];
          lastWasConsonant = false;
        } else {
          result += vowelStandalone[vk];
        }
        i += vk.length;
        foundVowel = true;
        break;
      }
    }
    if (foundVowel) continue;

    // Try consonant match
    let foundConsonant = false;
    for (const ck of consonantKeys) {
      if (text.substring(i, i + ck.length) === ck) {
        if (lastWasConsonant) result += HALANT;
        result += consonants[ck];
        lastWasConsonant = true;
        i += ck.length;
        foundConsonant = true;
        break;
      }
    }
    if (foundConsonant) continue;

    // Unknown character — pass through
    if (lastWasConsonant) result += HALANT;
    result += text[i];
    lastWasConsonant = false;
    i++;
  }

  if (lastWasConsonant) result += HALANT;
  return result;
}
