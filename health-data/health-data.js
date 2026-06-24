(function () {
    const tabsEl = document.getElementById('sheet-tabs');
    const tableEl = document.getElementById('sheet-grid');
    const gridWrapEl = document.getElementById('grid-wrap');
    const statusEl = document.getElementById('status');
    const metaEl = document.getElementById('workbook-meta');
    const searchEl = document.getElementById('sheet-search');
    const renderLimit = 5000;

    const state = {
        workbook: null,
        activeSheetIndex: 0,
        query: '',
    };

    function columnName(index) {
        let n = index + 1;
        let name = '';
        while (n > 0) {
            const remainder = (n - 1) % 26;
            name = String.fromCharCode(65 + remainder) + name;
            n = Math.floor((n - 1) / 26);
        }
        return name;
    }

    function formatBytes(bytes) {
        if (!Number.isFinite(bytes)) {
            return '';
        }
        if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
        return `${Math.round(bytes / 1024)} KB`;
    }

    function formatCell(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'number') {
            return Number.isInteger(value)
                ? value.toLocaleString('en-US')
                : value.toLocaleString('en-US', { maximumFractionDigits: 2 });
        }
        return String(value);
    }

    function matchesQuery(row, query) {
        if (!query) {
            return true;
        }
        return row.some((cell) => formatCell(cell).toLowerCase().includes(query));
    }

    function setStatus(message, isError) {
        statusEl.textContent = message;
        statusEl.classList.toggle('error', Boolean(isError));
        statusEl.hidden = false;
        gridWrapEl.hidden = true;
    }

    function clearNode(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }

    function renderTabs() {
        clearNode(tabsEl);
        state.workbook.sheets.forEach((sheet, index) => {
            const button = document.createElement('button');
            button.className = 'sheet-tab';
            button.type = 'button';
            button.role = 'tab';
            button.textContent = sheet.name;
            button.setAttribute('aria-selected', index === state.activeSheetIndex ? 'true' : 'false');
            button.addEventListener('click', () => {
                state.activeSheetIndex = index;
                state.query = '';
                searchEl.value = '';
                renderTabs();
                renderSheet();
            });
            tabsEl.appendChild(button);
        });
    }

    function renderSheet() {
        const sheet = state.workbook.sheets[state.activeSheetIndex];
        const query = state.query.trim().toLowerCase();
        const matchedRows = sheet.rows
            .map((row, index) => ({ row, index }))
            .filter(({ row }) => matchesQuery(row, query));
        const visibleRows = matchedRows.slice(0, renderLimit);
        const columnCount = Math.max(sheet.columnCount || 0, ...visibleRows.map(({ row }) => row.length));

        clearNode(tableEl);

        if (!visibleRows.length) {
            setStatus(`No rows found in ${sheet.name}.`, false);
            return;
        }

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th'));
        for (let i = 0; i < columnCount; i += 1) {
            const th = document.createElement('th');
            th.textContent = columnName(i);
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');
        visibleRows.forEach(({ row, index }) => {
            const tr = document.createElement('tr');
            const rowHeader = document.createElement('th');
            rowHeader.textContent = String(index + 1);
            tr.appendChild(rowHeader);

            for (let i = 0; i < columnCount; i += 1) {
                const value = row[i];
                const td = document.createElement('td');
                td.textContent = formatCell(value);
                if (typeof value === 'number') {
                    td.classList.add('numeric');
                }
                if (value === null || value === undefined || value === '') {
                    td.classList.add('empty');
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });

        tableEl.appendChild(thead);
        tableEl.appendChild(tbody);
        statusEl.hidden = true;
        gridWrapEl.hidden = false;

        const limited = matchedRows.length > renderLimit
            ? ` Showing first ${renderLimit.toLocaleString('en-US')} matches.`
            : '';
        metaEl.textContent = `${sheet.name}: ${sheet.rowCount.toLocaleString('en-US')} rows, ${sheet.columnCount.toLocaleString('en-US')} columns.${limited}`;
    }

    searchEl.addEventListener('input', () => {
        state.query = searchEl.value;
        renderSheet();
    });

    fetch('workbook-data.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then((workbook) => {
            state.workbook = workbook;
            const sheetCount = workbook.sheets.length;
            metaEl.textContent = `${sheetCount} sheets from ${workbook.sourceWorkbook} (${formatBytes(workbook.sourceWorkbookBytes)}).`;
            searchEl.disabled = false;
            renderTabs();
            renderSheet();
        })
        .catch((error) => {
            setStatus(`Could not load workbook preview: ${error.message}`, true);
            metaEl.textContent = 'Workbook preview unavailable.';
        });
})();
