import React, { useState, useEffect, useCallback } from "react";
import {
  XCircle,
  Copy,
  RefreshCcw,
  Calendar,
  Search,
  Loader2
} from "lucide-react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  useTheme,
  alpha
} from "@mui/material";
import DashboardLayout from "@/layout/DashboardLayout";
import gatewayApi from "@/api/gatewayApi";

const FullLogView = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Hàm lấy dữ liệu từ API
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getMessageLog();
      setLogs(response?.content || []);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch logs',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Lọc dữ liệu
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Tìm kiếm trên các field có sẵn
    return (
      log.amqpMessageId?.toLowerCase().includes(searchLower) ||
      log.ipmId?.toLowerCase().includes(searchLower) ||
      log.mtsId?.toLowerCase().includes(searchLower) ||
      log.content?.toLowerCase().includes(searchLower) ||
      log.raw_content?.toLowerCase().includes(searchLower) ||
      log.subject?.toLowerCase().includes(searchLower) ||
      log.type?.toLowerCase().includes(searchLower) ||
      log.status?.toLowerCase().includes(searchLower) ||
      log.origin?.toLowerCase().includes(searchLower) ||
      log.recipients?.toLowerCase().includes(searchLower) ||
      log.referenceId?.toString().includes(searchLower) ||
      log.id?.toString().includes(searchLower)
    );
  });

  const handleCopy = () => {
    if (selectedLog) {
      navigator.clipboard.writeText(
        `${selectedLog.createdAt} [${selectedLog.status}] ${selectedLog.payload || selectedLog.messageId}`
      );
      setSnackbar({
        open: true,
        message: 'Copied to clipboard!',
        severity: 'success'
      });
    }
  };

  const handleClear = () => {
    setLogs([]);
    setSnackbar({
      open: true,
      message: 'Logs cleared',
      severity: 'info'
    });
  };

  const getStatusColor = (status, isSelected = false) => {
    if (isSelected) return 'white';
    
    const colors = {
      'SUCCESS': '#4ade80',
      'ACK_RECEIVED': '#4ade80',
      'WAITING_ACK': '#60a5fa',
      'SENDING': '#60a5fa',
      'VALIDATING': '#60a5fa',
      'ROUTING': '#60a5fa',
      'TRANSFORMING': '#60a5fa',
      'ROUTING_FAILED': '#fbbf24',
      'VALIDATION_FAILED': '#f87171',
      'TRANSFORMATION_FAILED': '#f87171',
      'SEND_FAILED': '#f87171',
      'ACK_TIMEOUT': '#f87171',
      'FAILED': '#f87171',
    };
    return colors[status] || '#9ca3af';
  };

  const getPriorityColor = (priority) => {
    if (!priority) return '#9ca3af';
    if (priority.startsWith('SS')) return '#ef4444';
    if (priority.startsWith('DD')) return '#fb923c';
    if (priority.startsWith('FF')) return '#facc15';
    if (priority.startsWith('GG')) return '#22d3ee';
    if (priority.startsWith('KK')) return '#9ca3af';
    return '#ffffff';
  };

  const getDirectionColor = (dir) => {
    switch (dir) {
      case 'OUT': return '#60a5fa';
      case 'IN': return '#a78bfa';
      default: return '#9ca3af';
    }
  };

  const isErrorStatus = (status) => {
    return [
      'FAILED',
      'VALIDATION_FAILED',
      'ROUTING_FAILED',
      'TRANSFORMATION_FAILED',
      'SEND_FAILED',
      'ACK_TIMEOUT'
    ].includes(status);
  };

  const getRowBackground = (status, isSelected) => {
    if (isSelected && isErrorStatus(status)) {
      return alpha('#ef4444', 0.6);
    }
    if (isSelected) {
      return alpha('#3b82f6', 0.6);
    }
    if (isErrorStatus(status)) {
      return alpha('#ef4444', 0.05);
    }
    return 'transparent';
  };

  return (
    <DashboardLayout>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        bgcolor: '#f1f5f9'
      }}>
        {/* TOOLBAR */}
        <Box sx={{ 
          bgcolor: '#F1F5F9', 
          p: 2, 
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Clear logs">
              <IconButton 
                onClick={handleClear}
                sx={{ 
                  color: '#6b7077',
                  '&:hover': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.1) }
                }}
              >
                <XCircle size={18} />
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 1, height: 24, bgcolor: '#1e293b', mx: 2 }} />

            <Tooltip title="Copy selected log">
              <IconButton 
                onClick={handleCopy}
                // disabled={!selectedLog}
                sx={{ 
                  color: '#6b7077',
                  '&:hover': { color: '#60a5fa', bgcolor: alpha('#3b82f6', 0.1) },
                  '&.Mui-disabled': { opacity: 0.2 }
                }}
              >
                <Copy size={18} />
              </IconButton>
            </Tooltip>

            <Box sx={{ width: 1, height: 24, bgcolor: '#1e293b', mx: 2 }} />

            <Tooltip title="Today's logs">
              <IconButton sx={{ color: '#6b7077', '&:hover': { color: '#60a5fa' } }}>
                <Calendar size={18} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Refresh logs">
              <IconButton 
                onClick={fetchLogs}
                disabled={loading}
                sx={{ 
                  color: '#6b7077',
                  '&:hover': { color: '#60a5fa' },
                  '&.Mui-disabled': { opacity: 0.5 }
                }}
              >
                {loading ? (
                  <CircularProgress size={18} sx={{ color: '#60a5fa' }} />
                ) : (
                  <RefreshCcw size={18} />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search Message ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: alpha('#c4c9d0', 0.3),
                  color: '#000000',
                  borderRadius: 1,
                  '& fieldset': { borderColor: '#1e293b' },
                  '&:hover fieldset': { borderColor: '#334155' },
                  '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                },
                '& .MuiInputBase-input': {
                  fontSize: '0.75rem',
                  py: 0.75,
                  width: '8rem',
                  '&:focus': { width: '12rem' }
                }
              }}
              InputProps={{
                startAdornment: <Search size={14} style={{ color: '#64748b', marginRight: 8 }} />
              }}
            />
          </Box>
        </Box>

        {/* TABLE */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f1f5f9', position: 'relative' }}>
          <TableContainer component={Paper} sx={{ 
            maxHeight: '100%', 
            bgcolor: 'transparent',
            boxShadow: 'none'
          }}>
            <Table stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>#</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>TIME</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>DIR</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>MTS ID</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>IPM ID</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>TYPE</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>PRIO</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>MESSAGE</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ORIGIN</TableCell>
                  <TableCell sx={{ bgcolor: 'white', fontWeight: 600, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>STATUS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => {
                  const isSelected = selectedLog?.id === log.id;
                  const bgColor = getRowBackground(log.processingStatus, isSelected);
                  const textColor = isSelected ? 'white' : 'inherit';
                  
                  return (
                    <TableRow
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      hover
                      sx={{
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0',
                        bgcolor: bgColor,
                        '&:hover': {
                          bgcolor: isSelected ? bgColor : alpha('#cbd5e1', 0.5)
                        },
                        '& td': {
                          color: textColor,
                          fontSize: '0.6875rem'
                        }
                      }}
                    >
                      <TableCell>{log.id}</TableCell>
                      <TableCell>{new Date(log?.createdTime).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: getDirectionColor(log.direction), fontWeight: 600 }}>
                        {log.direction}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{log.mtsId}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{log.ipmId}</TableCell>
                      <TableCell>{log.type}</TableCell>
                      <TableCell>
                        <Typography sx={{ 
                          color: getPriorityColor(log.amhs_priority),
                          fontWeight: 'bold'
                        }}>
                          {`${log.amhs_priority || '-'} (${log.swim_priority ?? '-'})`}
                        </Typography>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          maxWidth: 250, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={log.errorMessage}
                      >
                        {log.raw_content}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          maxWidth: 220, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={log.origin}
                      >
                        {log.origin || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          size="small"
                          sx={{
                            bgcolor: alpha(getStatusColor(log.status, isSelected), 0.15),
                            color: getStatusColor(log.status, isSelected),
                            fontWeight: 'bold',
                            fontSize: '0.625rem',
                            height: 20,
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Typography color="textSecondary">
                        {loading ? 'Loading logs...' : 'No logs found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* PREVIEW PANEL */}
        {selectedLog && (
          <Box sx={{ 
            bgcolor: '#0f172a', 
            borderTop: '2px solid #3b82f6',
            p: 2,
            maxHeight: 200,
            overflow: 'auto'
          }}>
            <Typography sx={{ 
              fontSize: '0.625rem', 
              fontWeight: 'bold', 
              color: '#60a5fa',
              textTransform: 'uppercase',
              mb: 1
            }}>
              Log Detail
            </Typography>
            <Box sx={{ 
              bgcolor: alpha('#000000', 0.4),
              p: 1.5,
              borderRadius: 1,
              border: '1px solid #1e293b'
            }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                <strong>Message ID:</strong> {selectedLog.messageId}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#cbd5e1', mt: 0.5 }}>
                <strong>Payload:</strong> {selectedLog.payload}
              </Typography>
              {selectedLog.errorMessage && (
                <Typography sx={{ fontSize: '0.75rem', color: '#f87171', mt: 0.5 }}>
                  <strong>Error:</strong> {selectedLog.errorMessage}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {/* SNACKBAR NOTIFICATION */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </DashboardLayout>
  );
};

export default FullLogView;