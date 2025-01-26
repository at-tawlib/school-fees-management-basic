export async function setUpClassSelect(selectInput, allOption = false) {
  selectInput.innerHTML = "";
  const classList = await window.store.getStoreClasses();

  if (allOption) {
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    selectInput.appendChild(allOption);
  }

  classList.forEach((className) => {
    const option = document.createElement("option");
    option.value = className;
    option.text = className;
    selectInput.appendChild(option);
  });
}

export async function setUpAcademicYearsSelect(selectInput, allOption = false) {
  selectInput.innerHTML = "";
  const academicYears = await window.store.getStoreAcademicYears();

  if (allOption) {
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    selectInput.appendChild(allOption);
  }

  academicYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
    selectInput.appendChild(option);
  });
}

export async function setUpTermsSelect(selectInput, allOption = false) {
  selectInput.innerHTML = "";
  const terms = await window.store.getStoreTerms();

  if (allOption) {
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    selectInput.appendChild(allOption);
  }

  terms.forEach((termName) => {
    const option = document.createElement("option");
    option.value = termName;
    option.text = termName;
    selectInput.appendChild(option);
  });
}
