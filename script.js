// Global variables for the DataTable instance and the full dataset
let table;
let fullData = [];

// Function to load and parse the CSV file
function loadCSV() {
    Papa.parse("data/Data-table.csv", {
        download: true,
        header: true,
        complete: function (results) {
            // Store the parsed data
            fullData = results.data;

            // Initialize the DataTable with the parsed data
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
                        // Render a button for notes if data exists
                        data: "Notes",
                        render: function (data, type, row) {
                            if (!data) return '';
                            return `
                            <button class="note-button" onclick="showNotePopup(this, \`${data.replace(/`/g, "\\`")}\`)">📝</button>
                          `;
                        },
                        orderable: false, // Disable sorting for this column
                        searchable: false // Exclude from search
                    },
                    {
                        // Hidden column for citations, searchable but not visible
                        data: "Citation",
                        visible: false,
                        searchable: true
                    }
                ],
                pageLength: 150, // Default number of rows per page
                lengthMenu: [[50, 150, -1], [50, 150, "All"]] // Page length options
            });

            // Customize the search input placeholder
            $('#data-table_filter input')
                .attr('placeholder', 'Author, Year, ...')
                .css('width', '250px');
        }
    });
}

// Function to apply a custom filter based on user input
function applyFilter() {
    const input = document.getElementById("filter-input").value.trim();
    const [atom, b] = input.split(',').map(x => x.trim());
    const filtered = fullData.filter(row => {
        if (!atom) return true; // No filter if input is empty
        if (b) return row.Atom === atom && row.B === b; // Match Atom and B
        return row.Atom === atom; // Match Atom only
    });
    table.clear().rows.add(filtered).draw(); // Update the table with filtered data
}

// Function to display a popup with note details
function showNotePopup(button, noteText) {
    // Remove any existing popup
    const existing = document.querySelector('.note-popup-floating');
    if (existing) existing.remove();

    // Create a new popup element
    const popup = document.createElement('div');
    popup.className = 'note-popup-floating';
    popup.textContent = noteText;

    // Position the popup near the button
    const rect = button.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(popup);

    // Close the popup on outside click
    document.addEventListener('click', function handler(e) {
        if (!popup.contains(e.target) && e.target !== button) {
            popup.remove();
            document.removeEventListener('click', handler);
        }
    });
}

// Function to copy the current table view as CSV to the clipboard
function copyCSV() {
    const filteredData = table.rows({ search: 'applied' }).data().toArray();

    if (filteredData.length === 0) {
        alert("No data to copy.");
        return;
    }

    // Define the fields to include in the export
    const fields = [
        "Atom", "A", "B", "Value", "Uncertainty",
        "Method", "Year", "Citation", "Notes"
    ];

    // Rebuild rows with all fields
    const rows = filteredData.map(row => {
        const output = {};
        fields.forEach(field => output[field] = row[field] || "");
        return output;
    });

    // Convert to CSV and copy to clipboard
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
                $('#theory-checkbox').prop('checked', true).trigger('change');
            } else {
                $('#experiment-checkbox').prop('checked', true).trigger('change');
            }
            return;
        }

        // Apply filtering logic based on checkbox states
        if (showExperiment && showTheory) {
            table.column(5).search('').draw(); // No filter
        } else if (!showExperiment && showTheory) {
            table.column(5).search('^(?!.*exp).*$', true, false).draw(); // Exclude 'exp'
        } else if (showExperiment && !showTheory) {
            table.column(5).search('exp', true, false).draw(); // Include only 'exp'
        } else {
            table.column(5).search('a^', true, false).draw(); // Match nothing
        }
    });
});

// Load the CSV data when the page is ready
loadCSV();
