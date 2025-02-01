import { ACADEMIC_YEAR, TERM } from "../constants/constants.js";

export async function getDefaultYearSetting() {
  const settings = await window.store.getStoreSettings();

  const academicYearSetting = settings.find((item) => item.setting_key === ACADEMIC_YEAR);
  return academicYearSetting;
}

export async function getDefaultTermSetting() {
  const settings = await window.store.getStoreSettings();

  const termSetting = settings.find((item) => item.setting_key === TERM);
  return termSetting;
}
