# 使用官方 Node.js 镜像作为基础镜像
FROM node:16-alpine

# 安装 Docker CLI
RUN apk add --no-cache docker-cli

# 设置工作目录
WORKDIR /app

# 将应用的所有代码复制到工作目录
COPY . .

# 安装依赖
RUN npm install

# 暴露容器的端口
EXPOSE 3000

# 启动 Node.js 应用
CMD ["node", "start"]
