const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('isomorphic-fetch'); // 需要为 Microsoft Graph Client

// 导入上传功能相关的模块
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');

// 配置信息
const config = {
    containerName: 'openwrt',
    sourcePath: '/etc/openclash',
    backupDir: path.join(__dirname, '..', 'backups')
};

// 读取 OneDrive 配置
async function loadOneDriveConfig() {
    try {
        const configPath = path.join(__dirname, 'onedrive-config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        throw new Error(`读取 OneDrive 配置失败: ${error.message}`);
    }
}

// 获取认证客户端
async function getAuthenticatedClient(config) {
    const credential = new ClientSecretCredential(
        config.tenant_id || 'common',
        config.client_id,
        config.client_secret
    );

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: config.scopes || ['https://graph.microsoft.com/.default']
    });

    return Client.initWithMiddleware({
        authProvider: authProvider
    });
}

// 上传文件到 OneDrive
async function uploadToOneDrive(localFile, remotePath) {
    try {
        console.log('正在上传到 OneDrive...');
        console.log(`本地文件: ${localFile}`);
        console.log(`远程路径: ${remotePath}`);

        // 读取配置并获取客户端
        const oneDriveConfig = await loadOneDriveConfig();
        const client = await getAuthenticatedClient(oneDriveConfig);

        // 读取文件内容
        const fileContent = await fs.readFile(localFile);
        
        // 上传文件
        console.log('开始上传...');
        const response = await client.api(`/me/drive/root:/${remotePath}:/content`)
            .put(fileContent);

        console.log('上传完成:', response);
        return response;
    } catch (error) {
        throw new Error(`上传到 OneDrive 失败: ${error.message}`);
    }
}

// 执行 docker 命令
async function runDockerCommand(command) {
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stderr) {
            console.error('警告:', stderr);
        }
        return stdout.trim();
    } catch (error) {
        throw new Error(`执行命令失败: ${error.message}`);
    }
}

// 检查容器是否运行
async function checkContainer() {
    try {
        const command = `docker ps --filter "name=^${config.containerName}$" --format "{{.Names}}"`;
        const result = await runDockerCommand(command);
        
        if (!result) {
            throw new Error(`找不到运行中的容器: ${config.containerName}`);
        }
        
        console.log(`找到容器: ${result}`);
        return true;
    } catch (error) {
        console.error('检查容器失败:', error.message);
        return false;
    }
}

// 创建备份目录
async function createBackupDir() {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(config.backupDir, timestamp);
        await fs.mkdir(backupPath, { recursive: true });
        return backupPath;
    } catch (error) {
        throw new Error(`创建备份目录失败: ${error.message}`);
    }
}

// 备份 OpenClash 配置
async function backupOpenClash() {
    try {
        // 检查容器
        const containerExists = await checkContainer();
        if (!containerExists) {
            process.exit(1);
        }

        // 创建备份目录
        const backupPath = await createBackupDir();
        console.log(`备份目录: ${backupPath}`);

        // 使用 docker cp 复制配置
        const copyCommand = `docker cp ${config.containerName}:${config.sourcePath}/. ${backupPath}`;
        console.log('正在复制配置文件...');
        await runDockerCommand(copyCommand);

        // 创建压缩文件
        const timestamp = path.basename(backupPath);
        const tarFileName = `openclash-${timestamp}.tar.gz`;
        const tarFilePath = path.join(config.backupDir, tarFileName);
        
        console.log('正在创建压缩文件...');
        const tarCommand = `cd ${backupPath} && tar -czf ${tarFilePath} .`;
        await runDockerCommand(tarCommand);

        console.log(`备份完成: ${tarFilePath}`);
        
        // 返回备份文件信息
        return {
            backupDir: backupPath,
            tarFile: tarFilePath,
            fileName: tarFileName
        };
    } catch (error) {
        console.error('备份失败:', error.message);
        process.exit(1);
    }
}

// 主函数
async function main() {
    try {
        console.log('开始备份 OpenClash 配置...');
        const result = await backupOpenClash();
        console.log('备份过程完成');
        console.log('备份目录:', result.backupDir);
        console.log('压缩文件:', result.tarFile);

        // 检查是否需要上传到 OneDrive
        const shouldUpload = process.argv.includes('--upload');
        if (shouldUpload) {
            console.log('准备上传到 OneDrive...');
            const remotePath = `OpenWrt/openclash-backups/${result.fileName}`;
            await uploadToOneDrive(result.tarFile, remotePath);
        }
    } catch (error) {
        console.error('程序执行失败:', error.message);
        process.exit(1);
    }
}

// 运行脚本
main(); 