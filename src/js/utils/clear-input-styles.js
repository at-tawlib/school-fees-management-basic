// Function to clear the styles of the inputs (background and color)
export function clearInputsStyles(inputs) {
  inputs.forEach((input) => {
    input.style.backgroundColor = "";
    input.style.color = "";
  });
}
