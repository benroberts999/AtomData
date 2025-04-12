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
                    { data: "Value" }
                ]
            });
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

loadCSV();
