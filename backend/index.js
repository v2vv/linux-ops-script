const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');  // Import cors
const app = express();
const port = 3000;

// 使用 express 内置的 JSON 解析中间件
app.use(express.json());

// Enable CORS for all origins or you can specify the origin
app.use(cors());  // This will allow all domains, or you can customize it

// 定义 POST 接口
app.post('/run-command', (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'No command provided' });
  }

  // 执行传入的指令
  exec(command, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: `Exec error: ${error.message}` });
    }
    if (stderr) {
      return res.status(500).json({ error: `stderr: ${stderr}` });
    }

    // 返回执行结果
    res.json({ stdout });
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
