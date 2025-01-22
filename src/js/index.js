import { displayPaymentsTable } from "./payments.js";

document.getElementById("navStudents").addEventListener("click", function () {
  document.getElementById("studentsView").style.display = "block";
  document.getElementById("classesView").style.display = "none";
  document.getElementById("paymentsView").style.display = "none";
});

document.getElementById("feesNav").addEventListener("click", function () {
  document.getElementById("studentsView").style.display = "none";
  document.getElementById("classesView").style.display = "flex";
  document.getElementById("paymentsView").style.display = "none";
});

document.getElementById("paymentsNav").addEventListener("click", async function () {
  document.getElementById("studentsView").style.display = "none";
  document.getElementById("classesView").style.display = "none";
  document.getElementById("paymentsView").style.display = "block";

  const response = await window.api.getAllPayments();
  displayPaymentsTable(response.data);
});
