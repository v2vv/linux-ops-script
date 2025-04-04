const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');  // Import cors
const app = express();
const port = 3000;

// 存储 OneDrive 配置的变量
let onedriveConfig = null;

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

// 添加 OneDrive 配置接口
app.post('/config-onedrive', (req, res) => {
  try {
    const config = req.body;
    
    // 验证必要的配置字段
    const requiredFields = ['client_id', 'client_secret', 'redirect_uri'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `缺少必要的配置字段: ${missingFields.join(', ')}`
      });
    }

    // 保存配置到变量
    onedriveConfig = {
      ...config,
      timestamp: new Date().toISOString()
    };

    // 返回成功消息和当前配置
    res.json({
      message: 'OneDrive 配置已保存',
      config: onedriveConfig
    });
  } catch (error) {
    res.status(500).json({
      error: `保存配置失败: ${error.message}`
    });
  }
});

// 获取当前 OneDrive 配置的接口
app.get('/config-onedrive', (req, res) => {
  if (!onedriveConfig) {
    return res.status(404).json({
      error: '未找到 OneDrive 配置'
    });
  }
  res.json(onedriveConfig);
});

// 启动服务器
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
