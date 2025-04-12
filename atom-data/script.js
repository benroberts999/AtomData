let table;
let fullData = [];

function loadCSV() {
    Papa.parse("Data-table.csv", {
        download: true,
        header: true,
        complete: function (results) {
            fullData = results.data;
            table = $('#data-table').DataTable({
                data: fullData,
                columns: [
                    { data: "Atom" },
                    { data: "A" },
                    { data: "B" },
                    { data: "Value" },
                    { data: "Uncertainty" },
                    { data: "Method" },
                    { data: "Year" },
                    {
                        data: "Notes",
                        render: function (data, type, row) {
                            if (!data) return '';
                            return `
                            <button class="note-button" onclick="showNotePopup(this, \`${data.replace(/`/g, "\\`")}\`)">📝</button>
                          `;
                        },
                        orderable: false,
                        searchable: false
                    },
                    {
                        data: "Citation",
                        visible: false,     // hidden from view
                        searchable: true    // included in search
                    }
                ],
                pageLength: 50,
                lengthMenu: [[25, 50, 200, -1], [25, 50, 200, "All"]]
            });
            $('#data-table_filter input')
                .attr('placeholder', 'Author, Year, ...')
                .css('width', '250px');

        }
    });
}

function applyFilter() {
    const input = document.getElementById("filter-input").value.trim();
    const [atom, b] = input.split(',').map(x => x.trim());
    const filtered = fullData.filter(row => {
        if (!atom) return true;
        if (b) return row.Atom === atom && row.B === b;
        return row.Atom === atom;
    });
    table.clear().rows.add(filtered).draw();
}

function showNotePopup(button, noteText) {
    // Remove any existing popup
    const existing = document.querySelector('.note-popup-floating');
    if (existing) existing.remove();

    // Create new popup
    const popup = document.createElement('div');
    popup.className = 'note-popup-floating';
    popup.textContent = noteText;

    // Position it near the button
    const rect = button.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(popup);

    // Close on outside click
    document.addEventListener('click', function handler(e) {
        if (!popup.contains(e.target) && e.target !== button) {
            popup.remove();
            document.removeEventListener('click', handler);
        }
    });
}
function copyCSV() {
    // Get full data objects from currently filtered rows
    const filteredData = table.rows({ search: 'applied' }).data().toArray();

    if (filteredData.length === 0) {
        alert("No data to copy.");
        return;
    }

    // Define all fields you want in the export
    const fields = [
        "Atom", "A", "B", "Value", "Uncertainty",
        "Method", "Year", "Citation", "Notes"
    ];

    // Rebuild rows with full fields
    const rows = filteredData.map(row => {
        const output = {};
        fields.forEach(field => output[field] = row[field] || "");
        return output;
    });

    // Convert to CSV and copy
    const csv = Papa.unparse(rows);
    navigator.clipboard.writeText(csv).then(() => {
        alert("Copied full table view (including hidden fields) to clipboard!");
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
        alert("Failed to copy.");
    });
}



loadCSV();
