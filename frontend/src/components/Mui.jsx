import React, { useState } from "react";
import { AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemText, CssBaseline, Box, IconButton, Grid, Paper, Button } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 240;

export default function SidebarLayout() {
  const [open, setOpen] = useState(true);
  const [selectedPage, setSelectedPage] = useState("首页");

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const getPageContent = (page) => {
    if (page === "首页") {
      return (
        <Grid container spacing={2}>
          {["模块 1", "模块 2", "模块 3", "模块 4"].map((module, index) => (
            <Grid item xs={2} sm={2} key={index}>
              <Paper sx={{ height: 250, width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: 2 }}>
                <Typography variant="h6">{module}</Typography>
                <Button variant="contained" sx={{ mt: 2 }}>操作 1</Button>
                <Button variant="outlined" sx={{ mt: 1 }}>操作 2</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }

    switch (page) {
      case "关于":
        return "关于页面：这里提供应用的详细信息。";
      case "设置":
        return "设置页面：您可以在这里自定义应用配置。";
      default:
        return "请选择一个页面。";
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* 侧边栏 */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          width: open ? drawerWidth : 0,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: open ? drawerWidth : 0, boxSizing: "border-box", transition: "width 0.3s" },
        }}
      >
        <Toolbar />
        <List>
          {["首页", "关于", "设置"].map((text) => (
            <ListItem button key={text} onClick={() => setSelectedPage(text)}>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      {/* 主体内容区域 */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <AppBar position="fixed" sx={{ width: `calc(100% - ${open ? drawerWidth : 0}px)`, ml: `${open ? drawerWidth : 0}px`, transition: "width 0.3s, margin-left 0.3s" }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap>
              {selectedPage}
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        {getPageContent(selectedPage)}
      </Box>
    </Box>
  );
}
