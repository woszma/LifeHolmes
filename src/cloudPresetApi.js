const API_URL = "https://script.google.com/macros/s/AKfycbyOJKcFbEUeexGpR0B4F2Pumr5FkAKKgh-ehs2TMv-uProoLkAdae02cvdyEhilDyA5/exec";

export async function savePreset(presetId, data) {
  const body = `action=save&presetId=${encodeURIComponent(presetId)}&data=${encodeURIComponent(JSON.stringify(data))}`;
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  return await res.json();
}

export async function loadPreset(presetId) {
  const res = await fetch(`${API_URL}?action=load&presetId=${encodeURIComponent(presetId)}`);
  return await res.json();
}

export async function listPresets() {
  const res = await fetch(`${API_URL}?action=list`);
  return await res.json();
} 