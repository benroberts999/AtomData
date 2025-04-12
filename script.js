let table;
let fullData = [];

function loadCSV() {
    Papa.parse("data/Data-table.csv", {
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
                pageLength: 150,
                lengthMenu: [[50, 150, -1], [50, 150, "All"]]
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

$(document).ready(function () {
    // Add event listeners for the Experiment and Theory checkboxes
    $('#experiment-checkbox, #theory-checkbox').on('change', function () {
        const showExperiment = $('#experiment-checkbox').is(':checked');
        const showTheory = $('#theory-checkbox').is(':checked');

        // Ensure at least one checkbox is always checked
        if (!showExperiment && !showTheory) {
            // Automatically re-check the other checkbox
            if ($(this).attr('id') === 'experiment-checkbox') {
                $('#theory-checkbox').prop('checked', true).trigger('change'); // Re-call the function
            } else {
                $('#experiment-checkbox').prop('checked', true).trigger('change'); // Re-call the function
            }
            return; // Exit to avoid duplicate logic execution
        }

        // Determine the filter logic based on the checkbox states
        if (showExperiment && showTheory) {
            // Default behavior: no extra filter
            table.column(5).search('').draw();
        } else if (!showExperiment && showTheory) {
            // Hide rows with 'exp' in the "Method" column
            table.column(5).search('^(?!.*exp).*$', true, false).draw();
        } else if (showExperiment && !showTheory) {
            // Hide rows without 'exp' in the "Method" column
            table.column(5).search('exp', true, false).draw();
        } else {
            // Both unchecked: hide all rows (should not happen due to the above logic)
            table.column(5).search('a^', true, false).draw(); // Regex that matches nothing
        }
    });
});

loadCSV();
