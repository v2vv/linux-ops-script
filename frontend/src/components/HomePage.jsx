import React, { useEffect } from "react";
import { Box, Grid, Paper, Typography, Button } from "@mui/material";
import LogComponent from "./LogComponent";
const HomePage = () => {
  const [logs, setLogs] = React.useState(() => {
    const savedLogs = localStorage.getItem("appLogs");
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const backendUrl = () =>
    localStorage.getItem("backendUrl") || "http://localhost:3000";
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const newLogs = [...logs, { time: timestamp, message }];
    setLogs(newLogs);
    localStorage.setItem("appLogs", JSON.stringify(newLogs));
  };
  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem("appLogs");
  };
  // 监听页面刷新或关闭事件，清空 localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem("appLogs");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

  const openwrtBackup = () => {
    fetchCommand("node openclash:backup ");
  };

  const openwrtRestore = () => {
    fetchCommand("node openclash:restore ");
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
                    onClick={openwrtBackup}
                  >
                    备份
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ mt: 1 }}
                    onClick={openwrtRestore}
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
