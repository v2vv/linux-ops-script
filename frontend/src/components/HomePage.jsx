import React from "react";
import { Box, Grid, Paper, Typography, Button } from "@mui/material";
import LogComponent from "./LogComponent"; // 确保路径正确

const HomePage = () => {
  const [logs, setLogs] = React.useState([]);
  const backendUrl = () =>
    localStorage.getItem("backendUrl") || "http://localhost:3000";
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { time: timestamp, message }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const fetchCommand = (command) => {
    fetch(`${backendUrl()}/run-command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: `${command}` }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.json();
          throw new Error(`服务器错误 ${res.status}: ${errorText.error}`);
        }
        return res.json();
      })
      .then((data) => {
        addLog("后端返回: " + data.stdout);
      })
      .catch((err) => {
        addLog("请求失败: " + err.message);
      });
  };

  const hostStatus = () => {
    fetchCommand("echo 连接正常，主机正常");
  };

  const openwrtStatus = () => {
    fetchCommand("docker ps");
  };

  const openwrtRestart = () => {
    fetchCommand("docker restart openwrt");
  };

  return (
    <Box sx={{ pr: "33%" }}>
      <Grid container spacing={2}>
        {["主机", "Openwrt", "模块 3", "模块 4"].map((module, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper
              sx={{
                height: 250,
                width: 200,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <Typography variant="h6">{module}</Typography>
              {module === "Openwrt" && (
                <>
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={openwrtStatus}
                  >
                    查询状态
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={openwrtRestart}
                  >
                    重启容器
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ mt: 1 }}
                    onClick={openwrtStatus}
                  >
                    备份
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ mt: 1 }}
                    onClick={openwrtStatus}
                  >
                    恢复备份
                  </Button>
                </>
              )}
              {module === "主机" && (
                <>
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={hostStatus}
                  >
                    查询状态
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={hostStatus}
                  >
                    查询容器
                  </Button>
                </>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <LogComponent logs={logs} onClearLogs={clearLogs} />
    </Box>
  );
};

export default HomePage;
