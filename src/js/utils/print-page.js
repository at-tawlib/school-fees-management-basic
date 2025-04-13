import { formatDateTime } from "./format-date.js";

export const printPage = (heading, table, footer = "") => {
  const printWindow = window.open("", "", "width=900,height=700");
  printWindow.document.write(`
      <html>
        <head>
          <title>Print Bill</title>
          <style>
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid black;
              padding: 8px;
              text-align: left;
            }
          </style>
        </head>
        <body>
          ${heading}
          <h3 style="text-align: center; margin-bottom: 10px;">(${formatDateTime(new Date().toISOString())})</h3>
          ${table}
          ${footer}
        </body>
      </html>
    `);
  printWindow.document.close();
  printWindow.print();
};
