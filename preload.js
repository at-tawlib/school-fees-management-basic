const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getAllStudents: () => ipcRenderer.invoke("get-all-students"),
  insertStudent: (student) => ipcRenderer.invoke("insert-student", student),
  updateStudent: (student) => ipcRenderer.invoke("update-student", student),
  addStudentToClass: (data) => ipcRenderer.invoke("add-student-to-class", data),
  checkClassExists: (data) => ipcRenderer.invoke("check-class-exists", data),
  getAllClassesStudents: () => ipcRenderer.invoke("get-all-classes-students"),
  addFees: (data) => ipcRenderer.invoke("add-fees", data),
  getAllFees: (data) => ipcRenderer.invoke("get-all-fees", data),
  billStudent: (data) => ipcRenderer.invoke("bill-student", data),
  filterAllClassesStudents: (data) => ipcRenderer.invoke("filter-all-classes-students", data)
});
