# 使用官方 Node.js 镜像作为基础镜像
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 将 package.json 和 package-lock.json 复制到工作目录
COPY package*.json ./

# 安装依赖
RUN npm install

# 将应用的所有代码复制到工作目录
COPY . .

# 暴露容器的端口
EXPOSE 3000

# 启动 Node.js 应用
CMD ["node", "index.js"]
