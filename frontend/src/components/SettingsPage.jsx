import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
  Snackbar,
  Alert,
  Grid
} from "@mui/material";

const SettingsPage = ({ onUrlChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem("backendUrl") || "http://localhost:3000";
  });
  const [apiList, setApiList] = useState(() => {
    const savedList = localStorage.getItem("apiList");
    return savedList ? JSON.parse(savedList) : ["http://localhost:3000"];
  });
  const [newApi, setNewApi] = useState("");
  // 新增JSON编辑器状态
  const [jsonInput, setJsonInput] = useState(() => {
    const savedJson = localStorage.getItem("jsonData");
    return savedJson || "";
  });
  const [jsonError, setJsonError] = useState("");
  const [formattedJson, setFormattedJson] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [severity, setSeverity] = useState("success");

  useEffect(() => {
    onUrlChange && onUrlChange(backendUrl);
  }, [backendUrl, onUrlChange]);

  useEffect(() => {
    localStorage.setItem("backendUrl", backendUrl);
  }, [backendUrl]);

  useEffect(() => {
    localStorage.setItem("apiList", JSON.stringify(apiList));
  }, [apiList]);

  const handleAddApi = () => {
    if (newApi && !apiList.includes(newApi)) {
      const updatedList = [...apiList, newApi];
      setApiList(updatedList);
      setNewApi("");

      if (updatedList.length === 1) {
        setBackendUrl(newApi);
      }
    }
  };

  const handleRemoveApi = (url) => {
    const updatedList = apiList.filter((api) => api !== url);
    setApiList(updatedList);

    if (backendUrl === url) {
      const newUrl = updatedList.length > 0 ? updatedList[0] : "";
      setBackendUrl(newUrl);
    }
  };

  // 新增JSON处理函数
  const handleJsonChange = (e) => {
    const value = e.target.value;
    setJsonInput(value);
    try {
      if (value) {
        JSON.parse(value);
      }
      setJsonError("");
    } catch (error) {
      setJsonError("无效的JSON格式");
    }
    formatJson(value);
  };

  const handleFormatJson = () => {
    try {
      if (!jsonInput.trim()) {
        setJsonInput("");
        setJsonError("");
        setFormattedJson("");
        return;
      }
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      setJsonError("");
      setFormattedJson(formatted);
      setSnackbarMessage("JSON 格式化成功");
      setSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      setJsonError("格式化失败: " + error.message);
      setFormattedJson("");
      setSnackbarMessage("JSON 格式无效");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleSave = () => {
    try {
      new URL(backendUrl);
      localStorage.setItem("backendUrl", backendUrl);
      setSnackbarMessage("设置已保存");
      setSeverity("success");
      setOpenSnackbar(true);
    } catch (err) {
      setSnackbarMessage("请输入有效的 URL");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleReset = () => {
    const defaultUrl = "http://localhost:3000";
    setBackendUrl(defaultUrl);
    localStorage.setItem("backendUrl", defaultUrl);
    setSnackbarMessage("已重置为默认设置");
    setSeverity("info");
    setOpenSnackbar(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setSnackbarMessage("已复制到剪贴板");
    setSeverity("success");
    setOpenSnackbar(true);
  };

  const handleClear = () => {
    setJsonInput("");
    setFormattedJson("");
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // 当切换到 JSON 编辑器标签时（索引为1），自动格式化内容
    if (newValue === 1 && jsonInput) {
      handleFormatJson();
    }
  };

  // 处理 JSON 格式化
  const formatJson = (content) => {
    try {
      if (!content.trim()) {
        setFormattedJson("");
        return;
      }
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setFormattedJson(formatted);
      setSnackbarMessage("JSON 格式化成功");
      setSeverity("success");
    } catch (err) {
      setFormattedJson("");
      setSnackbarMessage("JSON 格式无效");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 添加发送 JSON 到后端的函数
  const handleSendToBackend = async () => {
    try {
      if (!jsonInput.trim()) {
        setSnackbarMessage("请先输入 JSON 内容");
        setSeverity("warning");
        setOpenSnackbar(true);
        return;
      }

      const parsed = JSON.parse(jsonInput); // 验证 JSON 格式
      
      const response = await fetch(`${backendUrl}/config-onedrive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '发送失败');
      }

      // 显示后端返回的成功消息
      setSnackbarMessage(data.message || "配置已成功保存");
      setSeverity("success");
      setOpenSnackbar(true);

      // 可以选择显示保存的时间
      if (data.config?.timestamp) {
        const saveTime = new Date(data.config.timestamp).toLocaleString();
        console.log(`配置保存时间: ${saveTime}`);
      }
    } catch (error) {
      setSnackbarMessage(`发送失败: ${error.message}`);
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* 左侧 Tab 导航栏 */}
      <Paper
        sx={{
          width: 200,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <Tabs
          orientation="vertical"
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            flex: 1,
            "& .MuiTabs-indicator": {
              left: 0,
              right: "auto",
            },
          }}
        >
          <Tab label="API 设置" sx={{ alignItems: "flex-start" }} />
          <Tab label="JSON 编辑器" sx={{ alignItems: "flex-start" }} />
        </Tabs>
      </Paper>

      {/* 右侧内容区域 */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {activeTab === 0 && (
          <Box sx={{ maxWidth: "68%", mx: "auto" }}>
            <Typography variant="h6">API 设置</Typography>

            <Typography variant="body2" sx={{ mt: 2 }}>
              当前 API 地址：
            </Typography>
            <Select
              fullWidth
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              sx={{ mt: 1 }}
            >
              {apiList.map((api, index) => (
                <MenuItem key={index} value={api}>
                  {api}
                </MenuItem>
              ))}
            </Select>

            <Typography variant="body2" sx={{ mt: 2 }}>
              添加 API 地址：
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={newApi}
              onChange={(e) => setNewApi(e.target.value)}
              placeholder="输入 API 地址"
              sx={{ mt: 1 }}
            />
            <Button variant="contained" sx={{ mt: 1 }} onClick={handleAddApi}>
              添加 API
            </Button>

            <Typography variant="body2" sx={{ mt: 2 }}>
              API 地址列表：
            </Typography>
            {apiList.map((api, index) => (
              <Box
                key={index}
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="body2">{api}</Typography>
                <Button
                  color="error"
                  size="small"
                  onClick={() => handleRemoveApi(api)}
                >
                  删除
                </Button>
              </Box>
            ))}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ maxWidth: "68%", mx: "auto" }}>
            <Typography variant="h6">JSON 编辑器</Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              在此编辑JSON数据，点击保存按钮手动保存
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={10}
              maxRows={20}
              variant="outlined"
              value={jsonInput}
              onChange={handleJsonChange}
              placeholder='输入JSON数据，例如: {"key": "value"}'
              sx={{ mt: 2 }}
              error={!!jsonError}
              helperText={jsonError || " "}
            />

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleFormatJson}
                disabled={!jsonInput}
              >
                格式化JSON
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonInput);
                    localStorage.setItem("jsonData", JSON.stringify(parsed));
                    alert("JSON数据已手动保存");
                  } catch (error) {
                    setJsonError("保存失败: 无效的JSON格式");
                  }
                }}
                disabled={!jsonInput || !!jsonError}
              >
                保存
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendToBackend}
                disabled={!jsonInput || !!jsonError}
              >
                发送到后端
              </Button>
              <Button
                variant="outlined"
                onClick={() => setJsonInput("")}
                disabled={!jsonInput}
              >
                清空
              </Button>
            </Box>

            {!jsonError && jsonInput && (
              <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                JSON数据有效
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={severity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
