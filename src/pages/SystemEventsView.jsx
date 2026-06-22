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
import { Check } from "lucide-react";

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
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getSystemEventsByUser({
        page,
        size: pageSize,
        userId: user?.userId || 1
      }); // Use the actual user ID from the auth context

      setRows(response?.histories?.content);
      setRowCount(response?.histories?.totalElements);
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

  const postReadNoti = async (userId, historyId) => {
    try {
      const response = await gatewayApi.postReadNotify(userId, historyId);
      
      return response;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  };

  const postReadAllNoti = async (userId) => {
    try {
      const response = await gatewayApi.postReadAllNotify(userId);
      
      return response;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  const handleMarkAsRead = async (params) => {
    // params: id, row
    if (params.row.isRead) {
      return;
    }    
    
    const previousRows = [...rows];
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === params.id ? { ...row, isRead: true } : row
      )
    );

    try {
      await postReadNoti(user?.userId || null, params.row.id);
    } catch (error) {
      setRows(previousRows);
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const hasUnread = rows.some(row => !row.isRead);
    if (!hasUnread) return;

    const previousRows = [...rows];

    setRows(prevRows =>
      prevRows.map(row => (row.isRead ? row : { ...row, isRead: true }))
    );

    try {
      await postReadAllNoti(user?.userId || null); 
      
      console.log('Marked all as read successfully');
    } catch (error) {
      // 5. Nếu API lỗi, rollback (hoàn tác) lại danh sách cũ ban đầu
      setRows(previousRows);
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          System Events
        </Typography>

        <button 
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-200 hover:bg-gray-50 hover:text-blue-600 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/20 mb-[10px]"
          >
          <Check size={18}/>
          Mark all read
        </button>

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
          onRowClick={handleMarkAsRead}
          autoHeight
          getRowClassName={(params) => {
            return !params.row.isRead ? 'unread-row' : '';
          }}
          sx={{
            '& .unread-row': {
              backgroundColor: '#f0f9ff !important',
              '&:hover': {
                backgroundColor: '#e0f2fe !important',
              },
              '& .MuiDataGrid-cell': {
                fontWeight: 'bold !important',
              },
            },
            // QUAN TRỌNG: Override style khi row được chọn
            '& .unread-row.Mui-selected': {
              backgroundColor: '#f0f9ff !important', // Giữ màu xanh khi chọn
              '&:hover': {
                backgroundColor: '#e0f2fe !important',
              },
              '& .MuiDataGrid-cell': {
                fontWeight: 'bold !important', // Giữ chữ đậm
              },
            },
            // Khi đã đọc và được chọn
            '& .Mui-selected': {
              backgroundColor: '#ffffff !important', // Màu trắng khi chọn dòng đã đọc
            },
          }}
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
