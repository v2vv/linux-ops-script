# 使用Ubuntu作为基础镜像
FROM ubuntu:latest

# 设置维护者信息（可选）
LABEL maintainer="Eric <eric@example.com>"

# 更新包管理器并安装必要的软件
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    git \
    && apt-get clean

# 设置工作目录
WORKDIR /app

# 复制应用程序文件到容器中（替换为你的文件路径）
COPY . /app

# 暴露端口（可根据实际应用调整）
EXPOSE 8080

# 指定容器启动时的命令（可根据实际应用调整）
CMD ["bash"]

