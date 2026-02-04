import { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

function TableTest() {
    const [selectedRows, setSelectedRows] = useState({
        type: 'include',
        ids: new Set(['row2'])
    });

    const rows = [
        { id: 'row1', name: 'First Row', value: 100 },
        { id: 'row2', name: 'Second Row', value: 200 },
        { id: 'row3', name: 'Third Row', value: 300 },
    ];

    const columns = [
        { field: 'id', headerName: 'ID', width: 150 },
        { field: 'name', headerName: 'Name', width: 200 },
        { field: 'value', headerName: 'Value', width: 150 },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Table Selection Test</h1>
            <p>The second row should be automatically selected</p>
            <p>Selected: {JSON.stringify({ type: selectedRows.type, ids: Array.from(selectedRows.ids) })}</p>

            <Box sx={{ height: 400, width: '100%', marginTop: '20px' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    checkboxSelection
                    disableMultipleRowSelection
                    rowSelectionModel={selectedRows}
                    onRowSelectionModelChange={(newSelection) => {
                        console.log('Selection changed:', newSelection);
                        console.log('Type:', typeof newSelection);
                        console.log('Is array:', Array.isArray(newSelection));
                        setSelectedRows(newSelection);
                    }}
                />
            </Box>
        </div>
    );
}

export default TableTest;
