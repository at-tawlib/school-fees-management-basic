const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getAllStudents: () => ipcRenderer.invoke("get-all-students"),
  insertStudent: (student) => ipcRenderer.invoke("insert-student", student),
  updateStudent: (student) => ipcRenderer.invoke("update-student", student),
  addStudentToClass: (data) => ipcRenderer.invoke("add-student-to-class", data),
  checkClassExists: (data) => ipcRenderer.invoke("check-class-exists", data),
});
