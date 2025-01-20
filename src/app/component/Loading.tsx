import React from "react";
import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

export function Loading() {
  return (
    <Backdrop open={true} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Box display="flex" flexDirection="column" alignItems="center">
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          更新中...
        </Typography>
      </Box>
    </Backdrop>
  );
}
