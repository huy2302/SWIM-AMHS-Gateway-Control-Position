import React, { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DashboardLayout from "../layout/DashboardLayout";
import gatewayApi from "../api/gatewayApi";

const severityColor = {
  INFO: "success",
  WARN: "warning",
  ERROR: "error",
};

const SystemEvents = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [rowCount, setRowCount] = useState(0);

  const [selected, setSelected] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await gatewayApi.getSystemEvents({
        page,
        size: pageSize,
      });

      setRows(response.content);
      setRowCount(response.totalElements);
    } catch (error) {
      console.error("Load system events failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [page, pageSize]);

  const columns = [
    {
      field: "eventTime",
      headerName: "Time",
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleString() : "",
    },
    {
      field: "severity",
      headerName: "Severity",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={severityColor[params.value] || "default"}
        />
      ),
    },

    {
      field: "eventType",
      headerName: "Type",
      width: 180,
    },
    {
      field: "title",
      headerName: "Message",
      flex: 2,
      minWidth: 250,
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 150,
    },
  ];

  return (
    <DashboardLayout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          System Events
        </Typography>

        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          pageSizeOptions={[10, 20, 50, 100]}
          paginationModel={{
            page,
            pageSize,
          }}
          onPaginationModelChange={(model) => {
            setPage(model.page);
            setPageSize(model.pageSize);
          }}
          onRowDoubleClick={(params) => setSelected(params.row)}
          autoHeight
        />

        <Dialog
          open={!!selected}
          onClose={() => setSelected(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Event Detail</DialogTitle>

          <DialogContent>
            {selected && (
              <Box>
                <Typography>
                  <strong>Time:</strong>{" "}
                  {new Date(selected.eventTime).toLocaleString()}
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Severity:</strong> {selected.severity}
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Type:</strong> {selected.eventType}
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Title:</strong> {selected.title}
                </Typography>

                <Typography sx={{ mt: 2 }}>
                  <strong>Description:</strong>
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selected.description || "No description"}
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default SystemEvents;
