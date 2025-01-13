const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  insertStudent: (student) => ipcRenderer.invoke("insert-student", student),
});
