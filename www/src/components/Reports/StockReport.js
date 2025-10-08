// Database'den stok raporu verisini çek
async function fetchStockReport() {
  const loadingDiv = document.getElementById('loading');
  const errorDiv = document.getElementById('error-message');
  
  try {
    // Loading göster
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (errorDiv) errorDiv.style.display = 'none';

    const response = await fetch('/api/stock-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        year: 2025,
        months: [1,2,3,4,5,6,7,8,9,10,11,12]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Veri çekilirken hata oluştu');
    }

    if (result.success) {
      // Veriyi tabloya dönüştür
      displayDataAsTable(result.data, result.columns);
      
      // CSV input alanını da doldur (isteğe bağlı)
      const csvData = convertToCSV(result.data, result.columns);
      document.getElementById('csv-input').value = csvData;
      
      console.log(`${result.count} kayıt başarıyla yüklendi.`);
    } else {
      throw new Error(result.message || 'Beklenmeyen hata');
    }
    
  } catch (error) {
    console.error('Stok raporu yüklenirken hata:', error);
    if (errorDiv) {
      errorDiv.textContent = `Hata: ${error.message}`;
      errorDiv.style.display = 'block';
    } else {
      alert('Stok raporu yüklenirken hata oluştu: ' + error.message);
    }
  } finally {
    // Loading gizle
    if (loadingDiv) loadingDiv.style.display = 'none';
  }
}

// Veriyi tablo olarak göster
function displayDataAsTable(data, columns) {
  if (!data || data.length === 0) {
    document.getElementById('table-container').innerHTML = '<p>Veri bulunamadı.</p>';
    return;
  }

  let html = '<table><thead><tr>';
  columns.forEach(col => {
    html += `<th>${col}</th>`;
  });
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    columns.forEach(col => {
      const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
      html += `<td contenteditable="true">${value}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  document.getElementById('table-container').innerHTML = html;
}

// JSON verisini CSV formatına çevir
function convertToCSV(data, columns) {
  if (!data || data.length === 0) return '';
  
  let csv = columns.map(col => `"${col}"`).join(';') + '\n';
  
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col] !== null && row[col] !== undefined ? row[col] : '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csv += values.join(';') + '\n';
  });
  
  return csv;
}

function csvToTable() {
        const csv = document.getElementById("csv-input").value.trim();
        if (!csv) return;
        const rows = csv
          .split("\n")
          .map((row) =>
            row.split(";").map((cell) => cell.replace(/^"|"$/g, ""))
          );
        let html = "<table><thead><tr>";
        rows[0].forEach((h) => (html += `<th>${h}</th>`));
        html += "</tr></thead><tbody>";
        for (let i = 1; i < rows.length; i++) {
          html += "<tr>";
          rows[i].forEach(
            (cell) => (html += `<td contenteditable="true">${cell}</td>`)
          );
          html += "</tr>";
        }
        html += "</tbody></table>";
        document.getElementById("table-container").innerHTML = html;
      }

      function exportTableToExcel() {
        const table = document.querySelector("#table-container table");
        if (!table) return;
        let csv = "";
        for (let row of table.rows) {
          let rowData = [];
          for (let cell of row.cells) {
            let text = cell.innerText.replace(/"/g, '""');
            rowData.push('"' + text + '"');
          }
          csv += rowData.join(";") + "\n";
        }
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "stok-raporu.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }