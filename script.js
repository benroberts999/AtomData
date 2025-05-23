// Global variables for the DataTable instance and the full dataset
let table;
let fullData = [];
let currentFile = "E1-data.csv"; // Default file

// Function to load and parse the CSV file
function loadCSV(fileName = currentFile) {
    const basePath = window.location.pathname.includes("/AtomData/")
        ? "/AtomData/"
        : "/";

    Papa.parse(`${basePath}data/${fileName}`, {
        download: true,
        header: true,
        complete: function (results) {
            // Store the parsed data
            fullData = results.data;

            // Log the parsed data for debugging
            console.log("Parsed Data:", fullData);

            // Log unique atoms
            getUniqueAtoms();

            // Initialize or update the DataTable with the parsed data
            if (table) {
                table.clear().rows.add(fullData).draw(); // Update existing table
            } else {
                table = $('#data-table').DataTable({
                    data: fullData,
                    columns: [
                        { data: "Atom" },
                        { data: "A" },
                        { data: "B" },
                        { data: "Value" },
                        { data: "Uncertainty" },
                        { data: "Method" },
                        {
                            data: "Reference",
                            render: function (data, type, row) {
                                if (!row.Citation) return '';
                                let citation = row.Citation;

                                let surname = citation.split(',')[0].trim();
                                if (!citation.includes(',')) {
                                    surname = citation.split('and')[0].trim();
                                }

                                const words = surname.split(' ').filter(word => word.length > 1 || !word.endsWith('.'));
                                surname = words.length > 0 ? words[words.length - 1] : '';

                                return `
                                    <div class="reference-wrapper">
                                        <span class="reference-text">${surname} <i>et al.</i></span>
                                        <button class="reference-button" onclick="toggleReferencePopup(this, \`${citation.replace(/`/g, "\\`")}\`)">📖</button>
                                    </div>
                                `;
                            }
                        },
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
                            searchable: true // Ensure Notes is searchable
                        },
                        {
                            data: "Citation",
                            visible: false,
                            searchable: true
                        }
                    ],
                    pageLength: 200,
                    lengthMenu: [[50, 200, -1], [50, 200, "All"]],
                    search: {
                        smart: true // Enable smart search for all columns
                    }
                });

                $('#data-table_filter input')
                    .attr('placeholder', 'All fields (Author, Year, State, ...)')
                    .css('width', '250px');
            }
        }
    });
}

// Function to get a list of unique elements in the "Atom" column
function getUniqueAtoms() {
    const uniqueAtoms = [...new Set(fullData.map(row => row.Atom))];
    console.log("Unique Atoms:", uniqueAtoms);
    return uniqueAtoms;
}

// Function to apply a custom filter based on user input
function applyFilter() {
    const input = document.getElementById("filter-input").value.trim().toLowerCase();
    const [atom, b] = input.split(',').map(x => x.trim());
    const filtered = fullData.filter(row => {
        if (!atom) return true; // No filter if input is empty
        const atomMatches = row.Atom.toLowerCase().includes(atom); // Partial match for Atom
        if (b) return atomMatches && row.B === b; // Match Atom and B
        return atomMatches; // Match Atom only
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

// Function to toggle the reference popup
function toggleReferencePopup(button, referenceText) {
    // Remove any existing popup
    const existing = document.querySelector('.reference-popup');
    if (existing) existing.remove();

    // Get the row data from the DataTable
    const rowData = table.row($(button).closest('tr')).data();
    const linksField = rowData.Links || ''; // Get the Links field

    // Create a new popup element
    const popup = document.createElement('div');
    popup.className = 'reference-popup';

    // Split multiple references by ';' and format them
    const references = referenceText.split(';').map(ref => `<div>${ref.trim()}</div>`).join('');

    // Format the links from the Links field
    const links = linksField.split(';').map(link => {
        const trimmedLink = link.trim();
        return `<a href="${trimmedLink}" target="_blank" rel="noopener noreferrer">${trimmedLink}</a>`;
    }).join('<br>');

    // Add the references and links to the popup
    popup.innerHTML = `
        <div>${references}</div>
        ${links ? `<div style="margin-top: 10px;">${links}</div>` : ''}
    `;

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

// Add an event listener to close popups on 'Escape' key press
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.note-popup-floating, .reference-popup').forEach(popup => popup.remove());
    }
});

// Function to hide the popup
function hideNotePopup() {
    const popup = document.querySelector('.note-popup-floating');
    if (popup) popup.remove();
}

// Function to copy the current table view as CSV to the clipboard
function copyCSV() {
    const filteredData = table.rows({ search: 'applied' }).data().toArray();

    if (filteredData.length === 0) {
        alert("No data to copy.");
        return;
    }

    // Dynamically get all fields from the first row of the dataset
    const fields = Object.keys(fullData[0] || {});

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

// Function to create and display a dropdown with matching atoms
function showAtomDropdown(inputValue = "") {
    const dropdown = document.getElementById("atom-dropdown");
    dropdown.innerHTML = ""; // Clear previous suggestions

    // If the input is empty, show all atoms
    const atomsToShow = inputValue.trim()
        ? getUniqueAtoms().filter(atom =>
            atom.toLowerCase().includes(inputValue.toLowerCase())
        )
        : getUniqueAtoms();

    // If no matches are found, hide the dropdown
    if (atomsToShow.length === 0) {
        dropdown.style.display = "none";
        return;
    }

    // Create a dropdown item for each atom
    atomsToShow.forEach(atom => {
        const option = document.createElement("div");
        option.className = "dropdown-item"; // Ensure the class is applied
        option.textContent = atom; // Set the text to the atom name
        option.onclick = () => {
            // When an item is clicked, set the input value
            document.getElementById("filter-input").value = atom;

            // Apply the filter immediately
            applyFilter();

            // Hide the dropdown
            dropdown.style.display = "none";
        };
        dropdown.appendChild(option); // Add the item to the dropdown
    });

    // Show the dropdown after populating it
    dropdown.style.display = "block";
}

// Function to handle dataset switching
function switchDataset(fileName) {
    currentFile = fileName;
    loadCSV(fileName);
}

$(document).ready(function () {
    // Populate the dropdown with dataset options
    const datasetDropdown = $('#dataset-dropdown');
    const datasets = [
        { name: "E1", file: "E1-data.csv" },
        { name: "E2", file: "E2-data.csv" },
        { name: "M1", file: "M1-data.csv" },
        { name: "Lifetimes (ns)", file: "Lifetimes-data.csv" },
        { name: "Polarisabilities", file: "Polarisability-data.csv" }
    ];

    datasets.forEach(dataset => {
        const option = `<option value="${dataset.file}">${dataset.name}</option>`;
        datasetDropdown.append(option);
    });

    // Add event listener for dataset selection
    datasetDropdown.on('change', function () {
        const selectedFile = $(this).val();
        switchDataset(selectedFile);
    });

    // Load the default dataset
    loadCSV();

    // Add event listeners for the Experiment, Theory, and Both radio buttons
    $('input[name="method-filter"]').on('change', function () {
        const selectedValue = $('input[name="method-filter"]:checked').val();

        // Apply filtering logic based on the selected radio button
        if (selectedValue === 'both') {
            table.column(5).search('').draw(); // No filter
        } else if (selectedValue === 'theory') {
            table.column(5).search('^(?!.*exp).*$', true, false).draw(); // Exclude 'exp'
        } else if (selectedValue === 'experiment') {
            table.column(5).search('exp', true, false).draw(); // Include only 'exp'
        }
    });

    // Trigger filter on Enter key press in the filter input field
    $('#filter-input').on('keypress', function (e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });

    // Add input event listener to the filter textbox
    $('#filter-input').on('input', function () {
        const inputValue = $(this).val(); // Get the current input value
        showAtomDropdown(inputValue); // Show the dropdown with matching atoms
    });

    // Add focus event listener to show all atoms when the filter box is clicked
    $('#filter-input').on('focus', function () {
        showAtomDropdown(); // Show all atoms when the input is focused
    });

    // Hide the dropdown when clicking outside of the input or dropdown
    $(document).on('click', function (e) {
        if (!$(e.target).closest('#filter-input, #atom-dropdown').length) {
            $('#atom-dropdown').hide();
        }
    });
});

// Load the CSV data when the page is ready
loadCSV();
