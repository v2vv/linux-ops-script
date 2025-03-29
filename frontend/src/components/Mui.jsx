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
} from "@mui/material";

const drawerWidth = 240;

export default function SidebarLayout() {
  const [selectedPage, setSelectedPage] = useState("首页");

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
        alert("后端返回: " + data.stdout);
      })
      .catch((err) => alert("请求失败: " + err.message));
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
        alert("后端返回: " + data.stdout);
      })
      .catch((err) => {
        console.error("请求失败:", err);
        alert("请求失败: " + err.message);
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

  const getPageContent = (page) => {
    if (page === "首页") {
      return (
        <Grid container spacing={2}>
          {["模块 1", "模块 2", "模块 3", "模块 4"].map((module, index) => (
            <Grid item xs={2} sm={2} key={index}>
              <Paper sx={{ height: 250, width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 2 }}>
                <Typography variant="h6">{module}</Typography>
                {module === "模块 1" && (
                  <Button variant="contained" sx={{ mt: 2 }} onClick={handleModule1Action1}>
                    操作 1
                  </Button>
                )}
                <Button variant="outlined" sx={{ mt: 1 }} onClick={handleModule1Action2}>
                  操作 2
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    if (page === "设置") {
      return (
        <Box sx={{ p: 2 }}>
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
                color: "white",  // Ensure color is always white
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
                color: "white",  // Ensure color is always white
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
