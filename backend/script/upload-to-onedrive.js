const fs = require('fs').promises;
const path = require('path');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const { ClientSecretCredential } = require('@azure/identity');

// 读取配置文件
async function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'onedrive-config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        throw new Error(`读取配置文件失败: ${error.message}`);
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
async function uploadFile(client, filePath, destinationPath) {
    try {
        // 读取文件
        const fileContent = await fs.readFile(filePath);
        const fileName = path.basename(filePath);
        
        // 如果没有指定目标路径，使用文件名作为目标路径
        const uploadPath = destinationPath || fileName;

        console.log(`开始上传文件: ${fileName} 到 ${uploadPath}`);

        // 对于小文件（小于 4MB），使用简单上传
        if (fileContent.length < 4 * 1024 * 1024) {
            const response = await client.api(`/me/drive/root:/${uploadPath}:/content`)
                .put(fileContent);
            console.log('文件上传成功:', response);
            return response;
        } 
        // 对于大文件，使用分片上传
        else {
            // 创建上传会话
            const session = await client.api(`/me/drive/root:/${uploadPath}:/createUploadSession`)
                .post({});

            const maxSliceSize = 320 * 1024; // 320 KB 分片
            const fileSize = fileContent.length;
            let start = 0;

            while (start < fileSize) {
                const end = Math.min(start + maxSliceSize, fileSize);
                const slice = fileContent.slice(start, end);
                
                // 上传分片
                await fetch(session.uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Length': `${slice.length}`,
                        'Content-Range': `bytes ${start}-${end-1}/${fileSize}`
                    },
                    body: slice
                });

                start = end;
                console.log(`已上传: ${Math.round((start / fileSize) * 100)}%`);
            }

            console.log('大文件上传完成');
            return true;
        }
    } catch (error) {
        console.error('上传文件时出错:', error);
        throw error;
    }
}

// 主函数
async function main() {
    try {
        // 获取命令行参数
        const [,, localFilePath, remoteFilePath] = process.argv;
        
        if (!localFilePath) {
            throw new Error('请提供要上传的文件路径');
        }

        // 加载配置
        const config = await loadConfig();
        console.log('配置加载成功');

        // 获取认证客户端
        const client = await getAuthenticatedClient(config);
        console.log('认证成功');

        // 上传文件
        await uploadFile(client, localFilePath, remoteFilePath);
        console.log('文件上传完成');
    } catch (error) {
        console.error('错误:', error.message);
        process.exit(1);
    }
}

// 运行脚本
main(); 