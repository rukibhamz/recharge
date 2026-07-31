const LAST_TYPE_KEY = 'recharge-last-personality-type';

export function getLastPersonalityType() {
  try {
    const code = String(localStorage.getItem(LAST_TYPE_KEY) ?? '')
      .toUpperCase()
      .replace(/[^EISNTFJP]/g, '');
    return code.length === 4 ? code : null;
  } catch {
    return null;
  }
}

export function setLastPersonalityType(typeCode) {
  try {
    const code = String(typeCode ?? '')
      .toUpperCase()
      .replace(/[^EISNTFJP]/g, '');
    if (code.length === 4) {
      localStorage.setItem(LAST_TYPE_KEY, code);
    }
  } catch {
    // ignore storage errors
  }
}
