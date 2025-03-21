import { getDefaultTermSetting, getDefaultYearSetting } from "./utils/get-settings.js";
import { showToast } from "./utils/toast.js";

let academicYearSetting;
let termSetting;

export const initHomeSection = async () => {
  academicYearSetting = await getDefaultYearSetting();
  termSetting = await getDefaultTermSetting();

  if (!academicYearSetting || !termSetting) {
    showToast("Set up the current term and academic year.", "error");
    return;
  }

  document.getElementById(
    "navAcademicYear"
  ).textContent = `${academicYearSetting.setting_text} Academic year`;
  document.getElementById("navTerm").textContent = `${termSetting.setting_text} Term`;
};
