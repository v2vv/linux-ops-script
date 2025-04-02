import React, { useState } from "react";
import SettingsPage from "./SettingsPage";
import HomePage from "./HomePage";
import { AppBar, Toolbar, Button, CssBaseline, Box } from "@mui/material";

const SidebarLayout = () => {
  const [selectedPage, setSelectedPage] = useState("首页");
  const getPageContent = (page) => {
    switch (page) {
      case "首页":
        return <HomePage />;
      case "设置":
        return <SettingsPage />;
      default:
        return <Typography variant="h6">请选择一个页面</Typography>;
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed">
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {["首页", "设置"].map((page) => (
              <Button
                key={page}
                variant="outlined"
                sx={{
                  backgroundColor:
                    selectedPage === page
                      ? "linear-gradient(45deg, #FF8E53, #FF6F00)"
                      : "transparent",
                  color: "white",
                  ml: page === "设置" ? 2 : 0,
                  borderRadius: 2,
                  padding: "6px 12px",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor:
                      selectedPage === page
                        ? "linear-gradient(45deg, #FF6F00, #FF8E53)"
                        : "rgba(0, 0, 0, 0.1)",
                  },
                }}
                onClick={() => setSelectedPage(page)}
              >
                {page}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
        {getPageContent(selectedPage)}
      </Box>
    </Box>
  );
};

export default SidebarLayout;
