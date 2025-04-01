import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";

const SettingsPage = ({ onUrlChange }) => {
  // 从localStorage初始化状态
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem("backendUrl") || "http://localhost:3000";
  });

  const [apiList, setApiList] = useState(() => {
    const savedList = localStorage.getItem("apiList");
    return savedList ? JSON.parse(savedList) : ["http://localhost:3000"];
  });

  const [newApi, setNewApi] = useState("");

  // 当backendUrl变化时通知父组件
  useEffect(() => {
    onUrlChange && onUrlChange(backendUrl);
  }, [backendUrl, onUrlChange]);

  // 持久化状态到localStorage
  useEffect(() => {
    localStorage.setItem("backendUrl", backendUrl);
  }, [backendUrl]);

  useEffect(() => {
    localStorage.setItem("apiList", JSON.stringify(apiList));
  }, [apiList]);

  // 添加新的API地址
  const handleAddApi = () => {
    if (newApi && !apiList.includes(newApi)) {
      const updatedList = [...apiList, newApi];
      setApiList(updatedList);
      setNewApi("");

      // 如果是第一个API，自动设置为当前backendUrl
      if (updatedList.length === 1) {
        setBackendUrl(newApi);
      }
    }
  };

  // 删除API地址
  const handleRemoveApi = (url) => {
    const updatedList = apiList.filter((api) => api !== url);
    setApiList(updatedList);

    // 如果删除的是当前使用的API，则切换到列表第一个
    if (backendUrl === url) {
      const newUrl = updatedList.length > 0 ? updatedList[0] : "";
      setBackendUrl(newUrl);
    }
  };

  return (
    <Box sx={{ pr: "32%" }}>
      <Typography variant="h6">设置</Typography>

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
  );
};

export default SettingsPage;
