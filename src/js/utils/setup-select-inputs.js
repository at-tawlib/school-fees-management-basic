export async function setUpClassSelect(selectInput, allOption = false) {
  selectInput.innerHTML = "";
  const classList = await window.store.getStoreClasses();

  if (allOption) {
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.text = "All";
    selectInput.appendChild(allOption);
  }

  classList.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.text = item.class_name;
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

  academicYears.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.text = item.year;
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

  terms.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.text = item.term;
    selectInput.appendChild(option);
  });
}
