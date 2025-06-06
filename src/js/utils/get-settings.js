import { ACADEMIC_YEAR, TERM } from "../constants/constants.js";

export async function getDefaultYearSetting() {
  const settings = await window.store.getStoreSettings();

  if (!settings) {
    return;
  }

  const academicYearSetting = settings.find((item) => item.setting_key === ACADEMIC_YEAR);
  return academicYearSetting;
}

export async function getDefaultTermSetting() {
  const settings = await window.store.getStoreSettings();
  if (!settings) {
    return;
  }
  const termSetting = settings.find((item) => item.setting_key === TERM);
  return termSetting;
}
