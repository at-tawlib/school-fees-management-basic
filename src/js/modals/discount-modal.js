import { displayClassStudentsTable } from "../student-class.js";
import { fCurrency } from "../utils/format-currency.js";

document
  .getElementById("discountModalCloseXBtn")
  .addEventListener("click", () => closeApplyDiscountModal());

document
  .getElementById("cancelDiscountModalBtn")
  .addEventListener("click", () => closeApplyDiscountModal());

document.getElementById("submitDiscountModalBtn").addEventListener("click", async () => {
  const discountAmount = document.getElementById("discountAmountInput").value;
  const billId = document.getElementById("modalDiscountBillId").value;
  const feesAmount = document.getElementById("discountModalHiddenFeeAmount").value;

  if (!discountAmount || isNaN(discountAmount)) {
    showToast("Please enter a discount amount", "error");
    return;
  }

  if (discountAmount > feesAmount) {
    showToast("Discount amount cannot be greater than the fee amount", "error");
    return;
  }

  const response = await window.api.applyDiscount({ billId, discountAmount });

  if (!response.success) {
    showToast(response.message || "An error occurred", "error");
    return;
  }

  showToast(response.message || "Discount applied successfully", "success");
  closeApplyDiscountModal();
  await displayClassStudentsTable();
});

document.getElementById("editDiscountBtn").addEventListener("click", () => {
  document.getElementById("applyDiscountForm").style.display = "";
});

export async function openApplyDiscountModal(item, currentClass, classTerm) {
  if (!item || !currentClass || !classTerm) {
    showToast("An error occurred. Please try again", "error");
    return;
  }

  document.getElementById("discountModalHiddenFeeAmount").value = item.fee_amount;
  document.getElementById("modalDiscountBillId").value = item.bill_id;
  document.getElementById("applyDiscountStudentName").textContent = item.student_name;
  document.getElementById(
    "modalDiscountClass"
  ).textContent = `${currentClass.className} - ${classTerm.text} Term, ${currentClass.academicYear}`;
  document.getElementById("applyDiscountModalFees").textContent = fCurrency(item.fee_amount);
  document.getElementById("applyDiscountModalPaid").textContent = fCurrency(item.total_payments);
  document.getElementById("applyDiscountModalArrears").textContent = fCurrency(item.balance);
  document.getElementById("discountAmountInput").value = "";

  if (item.discount_amount > 0) {
    document.getElementById("applyDiscountForm").style.display = "none";
    document.getElementById("alreadyDiscountContainer").style.display = "";
    document.getElementById(
      "alreadyDiscountText"
    ).textContent = `Student already has a discount of ${fCurrency(item.discount_amount)}`;
    document.getElementById("discountAmountInput").value = item.discount_amount;
  } else {
    document.getElementById("applyDiscountForm").style.display = "";
    document.getElementById("alreadyDiscountContainer").style.display = "none";
  }

  showApplyDiscountModal();
}

const showApplyDiscountModal = () => {
  applyDiscountModal.classList.add("active");
  document.body.style.overflow = "hidden";
};

const closeApplyDiscountModal = () => {
  applyDiscountModal.classList.remove("active");
  document.body.style.overflow = "auto";
};
