document.getElementById("studentsNav").addEventListener("click", function () {
  document.getElementById("studentsView").style.display = "block";
  document.getElementById("classesView").style.display = "none";
}); 

document.getElementById("feesNav").addEventListener("click", function () {
    document.getElementById("studentsView").style.display = "none";
    document.getElementById("classesView").style.display = "flex";
  }); 