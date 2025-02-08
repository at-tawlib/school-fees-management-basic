export async function setUpClassSelect(selectInput, allOption = false, selectedOption = null) {
  selectInput.innerHTML = "";
  const classList = await window.store.getStoreClasses();

  if (allOption) {
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.text = "All";
    selectInput.appendChild(allOpt);
  }

  classList.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.text = item.class_name;

    // Set the option as selected if it matches the selectedOption
    if (Number(selectedOption) && item.id === Number(selectedOption)) {
      option.selected = true;
    }

    selectInput.appendChild(option);
  });

  // If no selectedOption is provided, select the first option
  if (!selectedOption) {
    selectInput.selectedIndex = 0;
  }
}

export async function setUpAcademicYearsSelect(
  selectInput,
  allOption = false,
  selectedOption = null
) {
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

    // Set the option as selected if it matches the selectedOption
    if (Number(selectedOption) && item.id === Number(selectedOption)) {
      option.selected = true;
    }
    selectInput.appendChild(option);
  });

  // If no selectedOption is provided, select the first option
  if (!selectedOption) {
    selectInput.selectedIndex = 0;
  }
}

export async function setUpTermsSelect(selectInput, allOption = false, selectedOption = null) {
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

    // Set the option as selected if it matches the selectedOption
    if (Number(selectedOption) && item.id === Number(selectedOption)) {
      option.selected = true;
    }
    selectInput.appendChild(option);
  });

  // If no selectedOption is provided, select the first option
  if (!selectedOption) {
    selectInput.selectedIndex = 0;
  }
}
