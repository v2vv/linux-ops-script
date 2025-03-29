import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  CssBaseline,
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const drawerWidth = 240;

export default function SidebarLayout() {
  const [selectedPage, setSelectedPage] = useState("首页");
  const [logs, setLogs] = useState([]);

  // 添加日志函数
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, { time: timestamp, message: message }]);
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 读取存储的 API 地址列表
  const [apiList, setApiList] = useState(() => {
    const savedList = localStorage.getItem("apiList");
    return savedList ? JSON.parse(savedList) : ["http://localhost:3000"];
  });

  // 读取当前选中的 API 地址
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem("backendUrl") || "http://localhost:3000";
  });

  // 监听 `backendUrl` 变化并保存
  useEffect(() => {
    localStorage.setItem("backendUrl", backendUrl);
  }, [backendUrl]);

  // 监听 `apiList` 变化并保存
  useEffect(() => {
    localStorage.setItem("apiList", JSON.stringify(apiList));
  }, [apiList]);

  // 发送命令到后端
  const handleModule1Action1 = () => {
    fetch(`${backendUrl}/run-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "echo Hello from server" }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("后端返回:", data);
        addLog("后端返回: " + data.stdout);
      })
      .catch((err) => addLog("请求失败: " + err.message));
  };

  // 发送命令到后端
  const handleModule1Action2 = () => {
    fetch(`${backendUrl}/run-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "docker ps" }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.json();
          throw new Error(`服务器错误 ${res.status}: ${errorText.error}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("后端返回:", data);
        addLog("后端返回: " + data.stdout);
      })
      .catch((err) => {
        console.error("请求失败:", err);
        addLog("请求失败: " + err.message);
      });
  };

  // 添加新的 API 地址
  const [newApi, setNewApi] = useState("");
  const handleAddApi = () => {
    if (newApi && !apiList.includes(newApi)) {
      setApiList([...apiList, newApi]);
      setNewApi("");
    }
  };

  // 删除 API 地址
  const handleRemoveApi = (url) => {
    const updatedList = apiList.filter((api) => api !== url);
    setApiList(updatedList);

    // 如果删除的是当前使用的 API，则切换到列表第一个
    if (backendUrl === url && updatedList.length > 0) {
      setBackendUrl(updatedList[0]);
    }
  };

  // 日志组件 - 提取为单独的组件以便在不同页面中复用
  const LogComponent = () => (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        height: "calc(100vh - 120px)",
        borderRadius: 1,
        overflow: "hidden",
        position: "fixed",
        right: 24,
        top: 88,
        width: "30%"
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "primary.main",
          color: "primary.contrastText"
        }}
      >
        <Typography variant="h6">日志输出</Typography>
        <IconButton
          size="small"
          onClick={clearLogs}
          sx={{ color: "primary.contrastText" }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <List
        sx={{
          height: "calc(100% - 48px)",
          overflowY: "auto",
          p: 0,
          bgcolor: "background.paper"
        }}
      >
        {logs.length > 0 ? (
          logs.slice().reverse().map((log, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={log.message}
                  secondary={log.time}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontFamily: "monospace"
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary"
                  }}
                />
              </ListItem>
              {index < logs.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))
        ) : (
          <ListItem>
            <ListItemText
              primary="暂无日志..."
              primaryTypographyProps={{
                variant: "body2",
                color: "text.secondary",
                fontStyle: "italic"
              }}
            />
          </ListItem>
        )}

      </List>
    </Paper>
  );

  const getPageContent = (page) => {
    if (page === "首页") {
      return (
        <Box sx={{ pr: "33%" }}>
          <Grid container spacing={2}>
            {["主机", "Openwrt", "模块 3", "模块 4"].map((module, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper sx={{
                  height: 250,
                  width: 200,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  p: 2
                }}>
                  <Typography variant="h6">{module}</Typography>
                  {module === "Openwrt" && (
                    <>
                      <Button variant="contained" sx={{ mt: 1 }} onClick={handleModule1Action1}>
                        查询状态
                      </Button>
                      <Button variant="contained" sx={{ mt: 1 }} onClick={handleModule1Action2}>
                        重启
                      </Button>
                      <Button variant="outlined" sx={{ mt: 1 }} onClick={handleModule1Action2}>
                        备份
                      </Button>
                      <Button variant="outlined" sx={{ mt: 1 }} onClick={handleModule1Action2}>
                        恢复备份
                      </Button>
                    </>
                  )}
                  {module === "主机" && (
                    <>
                      <Button variant="contained" sx={{ mt: 1 }} onClick={handleModule1Action1}>
                        查询容器
                      </Button>
                    </>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* 右侧固定的日志组件 */}
          <LogComponent />
        </Box>
      );
    }

    if (page === "设置") {
      return (
        <Box sx={{ pr: "32%" }}>
          <Typography variant="h6">设置</Typography>

          {/* API 地址选择 */}
          <Typography variant="body2" sx={{ mt: 2 }}>当前 API 地址：</Typography>
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

          {/* 添加 API */}
          <Typography variant="body2" sx={{ mt: 2 }}>添加 API 地址：</Typography>
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

          {/* API 地址列表 */}
          <Typography variant="body2" sx={{ mt: 2 }}>API 地址列表：</Typography>
          {apiList.map((api, index) => (
            <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="body2">{api}</Typography>
              <Button color="error" size="small" onClick={() => handleRemoveApi(api)}>删除</Button>
            </Box>
          ))}

        </Box>
      );
    }

    return "请选择一个页面。";
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              variant="outlined"
              sx={{
                backgroundColor: selectedPage === "首页" ? "linear-gradient(45deg, #FF8E53, #FF6F00)" : "transparent",
                color: "white",
                borderRadius: 2,
                padding: "6px 12px",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: selectedPage === "首页" ? "linear-gradient(45deg, #FF6F00, #FF8E53)" : "rgba(0, 0, 0, 0.1)",
                },
              }}
              onClick={() => setSelectedPage("首页")}
            >
              首页
            </Button>
            <Button
              variant="outlined"
              sx={{
                backgroundColor: selectedPage === "设置" ? "linear-gradient(45deg, #FF8E53, #FF6F00)" : "transparent",
                color: "white",
                ml: 2,
                borderRadius: 2,
                padding: "6px 12px",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: selectedPage === "设置" ? "linear-gradient(45deg, #FF6F00, #FF8E53)" : "rgba(0, 0, 0, 0.1)",
                },
              }}
              onClick={() => setSelectedPage("设置")}
            >
              设置
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        {getPageContent(selectedPage)}
      </Box>
    </Box>
  );
}