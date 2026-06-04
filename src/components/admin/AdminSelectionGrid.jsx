import React from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { grey } from '@mui/material/colors';

const AdminSelectionGrid = ({
    rows,
    columns,
    getRowId,
    selectedRowId,
    onSelectRow
}) => {
    const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 5 });

    const resolveRowId = React.useCallback((row) => {
        if (typeof getRowId === 'function') {
            return getRowId(row);
        }
        return row.id;
    }, [getRowId]);

    const selectedRowExists = React.useMemo(() => {
        if (selectedRowId === null || selectedRowId === undefined) {
            return false;
        }
        return rows.some((row) => String(resolveRowId(row)) === String(selectedRowId));
    }, [rows, resolveRowId, selectedRowId]);

    const rowSelectionModel = React.useMemo(() => ({
        type: 'include',
        ids: selectedRowExists ? new Set([selectedRowId]) : new Set()
    }), [selectedRowExists, selectedRowId]);

    const handleRowSelectionModelChange = React.useCallback((selectionModel) => {
        if (!selectionModel?.ids || selectionModel.ids.size === 0) {
            return;
        }
        const selectedId = Array.from(selectionModel.ids)[0];
        const selectedRow = rows.find((row) => String(resolveRowId(row)) === String(selectedId));
        if (selectedRow) {
            onSelectRow(selectedRow);
        }
    }, [onSelectRow, resolveRowId, rows]);

    return (
        <Box sx={{ height: 400, width: '100%', marginTop: '10px' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                checkboxSelection
                disableMultipleRowSelection
                getRowId={resolveRowId}
                rowSelectionModel={rowSelectionModel}
                pageSizeOptions={[5, 10, 20]}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                onRowSelectionModelChange={handleRowSelectionModelChange}
                getRowSpacing={(params) => ({
                    top: params.isFirstVisible ? 0 : 5,
                    bottom: params.isLastVisible ? 0 : 5,
                })}
                getRowClassName={(params) => ((params.row.active ?? 1) === 0 ? 'admin-selection-grid-row-archived' : '')}
                sx={{
                    '& .MuiDataGrid-row': {
                        bgcolor: (theme) => theme.palette.mode === 'light' ? grey[200] : grey[900],
                    },
                    '& .admin-selection-grid-row-archived': {
                        bgcolor: (theme) => theme.palette.mode === 'light' ? '#eceff3' : '#30363d',
                        color: '#6b7280',
                    },
                    '& .admin-selection-grid-row-archived.Mui-selected': {
                        bgcolor: (theme) => theme.palette.mode === 'light' ? '#dde4f2' : '#39424d',
                        color: '#374151',
                    }
                }}
            />
        </Box>
    );
};

export default AdminSelectionGrid;
