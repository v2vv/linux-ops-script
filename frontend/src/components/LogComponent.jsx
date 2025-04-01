import React from "react";
import {
  Paper,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const LogComponent = ({ logs, onClearLogs }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        width: "30%",
        height: "calc(100vh - 120px)",
        borderRadius: 1,
        overflow: "hidden",
        position: "fixed",
        right: 24,
        top: 88,
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
          color: "primary.contrastText",
        }}
      >
        <Typography variant="h6">日志输出</Typography>
        <IconButton
          size="small"
          onClick={onClearLogs}
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
          bgcolor: "background.paper",
        }}
      >
        {logs.length > 0 ? (
          logs
            .slice()
            .reverse()
            .map((log, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={log.message}
                    secondary={log.time}
                    primaryTypographyProps={{
                      variant: "body2",
                      fontFamily: "monospace",
                    }}
                    secondaryTypographyProps={{
                      variant: "caption",
                      color: "text.secondary",
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
                fontStyle: "italic",
              }}
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default LogComponent;
