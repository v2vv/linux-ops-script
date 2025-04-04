# 使用 Node.js 18 镜像作为基础镜像
FROM node:18-alpine

# 安装必要的工具
RUN apk add --no-cache \
    docker-cli \
    tar \
    bash

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install

# 将应用的其余代码复制到工作目录
COPY . .

# 创建必要的目录
RUN mkdir -p backups temp

# 暴露容器的端口
EXPOSE 3000

# 启动 Node.js 应用
CMD ["npm", "start"]
  