check_sysem(){
    # 检查系统环境
    if [ -f /etc/os-release ]; then
        system_env="Linux"
        source /etc/os-release
        if [ "$NAME" = "Debian GNU/Linux" ]; then
            echo "当前环境是 Debian"
        fi
    elif [ "$MSYSTEM" = "MINGW64" ] || [ "$MSYSTEM" = "MINGW32" ]; then
        system_env="MINGW"
        echo "当前环境是 Git Bash"
    fi
}

check_soft_env(){
    # 检查是否存在 xxd 命令
    if command -v xxd >/dev/null 2>&1; then
        echo "xxd 工具已安装"
    else
        if [ "$system_env" = "Linux" ]; then
            echo "安装 xxd"
            apt install xxd -y
        else
            echo "xxd 工具未安装"
            exit 1
        fi
    fi
}

auth(){
    echo '正在获取授权'
    # 使用 curl 发送 POST 请求
    response=$(curl --location --request POST "https://login.microsoftonline.com/$tenant_id/oauth2/v2.0/token" \
    --header 'Host: login.microsoftonline.com' \
    --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "client_id=$client_id" \
    --data-urlencode 'scope=https://graph.microsoft.com/.default' \
    --data-urlencode "client_secret=$client_secret" \
    --data-urlencode 'grant_type=client_credentials')

    # 使用 jq 解析 JSON 并提取 access_token
    access_token=$(echo $response | jq -r '.access_token')
    # 检查access_token是否为空
    if [ -n "$access_token" ]; then
    echo "授权成功"
    # 输出 access_token
        # echo "Access Token: $access_token"
    else
    echo -e "${YELLOW}警告：授权失败${NC}"
    fi
}

# $1 localPath
# $2 oneDrivePath 
upload(){
    echo 上传文件$1 到 oneDrive $2
    response=$(curl --location --request PUT "https://graph.microsoft.com/v1.0/users/me@lvhongyuan.site/drive/root:/$2:/content" \
    --header "Authorization: Bearer $access_token" \
    --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
    --header 'Content-Type: application/octet-stream' \
    --data-binary "@$1" \
    -w "%{http_code}" \
    -o /dev/null)

    # 检查响应状态码并输出相应信息
    if [ $response -eq 200 ]; then
    echo "文件上传成功"
    elif [ $response -eq 201 ]; then
    echo "文件上传并创建成功"
    else
    echo "上传失败，状态码：$response"
    fi
}

crontab_backup() {
    pwd
    # 判断文件是否存在
    if [ -e "./soft-cfg" ]; then
        echo "soft-cfg 文件存在。"
    else
        echo "文件不存在。"
        echo '{}' | jq '. += {"software_backup": []}' > ./soft-cfg
        cat soft-cfg
    fi

    jq ".software_backup |= if index(\"$backup_soft_name\") == null then . + [\"$backup_soft_name\"] else . end" soft-cfg > temp.json && mv temp.json soft-cfg
    cat soft-cfg
    # 新任务内容
    mkdir -p $HOME/data/cron_backup_log
    new_task="@daily $HOME/data/backup.sh -e $client_id,$client_secret,$tenant_id,auto >> $HOME/data/cron_backup_log/auto_cron_backup_script.log 2>&1"
    # echo $new_task
    # 检查新任务是否已存在
    if crontab -l | grep -Eq "$new_task"; then
        echo "任务已存在，无需重复添加。"
    else
        # 添加新任务
        (crontab -l 2>/dev/null; echo "$new_task") | crontab -
        echo "新任务已添加。"
    fi
}


# localFilePath $1
# oneDriveBackupFolder $2
download(){
    echo "下载 onedrive $2"
    response=$(curl --location --request GET "https://graph.microsoft.com/v1.0/users/me@lvhongyuan.site/drive/root:/$2:/content" \
    --header "Authorization: Bearer $access_token" \
    --header 'User-Agent: Apifox/1.0.0 (https://apifox.com)' \
    --output "$1" \
    -w "%{http_code}" \
    -o /dev/null)

    # 检查响应状态码并输出相应信息
    if [ "$response" -eq 200 ]; then
        echo "文件下载成功 保存路径 $1"
    elif [ "$response" -eq 404 ]; then
        echo "onedrive $2 文件不存在"
    else
        echo "下载失败，状态码：$response"
    fi
}


# 通过 docker 运行
docker_run(){
    if command -v docker >/dev/null 2>&1; then
        docker -v
        docker compose version
        eval "docker compose -f $1 up -d"
    else
        docker_exit="nodocker"
        echo "Docker 未安装 ,跳过运行"
    fi
}

# 检查alist是否运行
stoprunning(){
    if command -v docker >/dev/null 2>&1; then
        docker -v
        # 检查alist是否运行
        container=$(docker ps -a --filter "name=$1" --format "{{.Names}}")
        if [ "$container" == "$1" ]; then
            echo "$1 容器正在运行，停止容器..."
            eval "docker stop $1"
            echo "删除 $1 容器."
            eval "docker rm  $1"
        else 
            echo "$1 未运行"
        fi
    else
        docker_exit="nodocker"
        echo "Docker 未安装"
    fi
}

urlencode() {
    src_url=$(echo -n "$1" | xxd -plain | tr -d '\n' | sed 's/\(..\)/%\1/g')
    echo $src_url
}



# 显示备份帮助信息
show_backup_help() {
    echo "Usage: $0 [-o option] [-e client_id,client_secret,tenant_id,option]"
    echo ""
    echo "  -o  选择备份软件"
    echo "      1 - alist"
    echo "      2 - ddns-go"
    echo "      3 - semaphore"
    echo "      4 - uptime-kuma"
    echo "      5 - xui"
    echo "      6 - all"
    echo "      7 - auto"
    echo ""
    echo "  -e  提供 OneDrive 备份的详细信息，用逗号分隔"
    echo "      client_id,client_secret,tenant_id,localPath,oneDriveBackupFolder,option"
    echo ""
    echo "  -h  显示此帮助信息"
}


# $1 软件名称
alist_backup(){
    # 上传 alist
    if [[ -e $localPath/$alist_config_Path ]]; then
        echo "$1 Backup File exists."
        upload $localPath/$alist_config_Path $(urlencode $oneDriveBackupFolder)/$alist_config_Path
        upload $localPath/$alist_data_path $(urlencode $oneDriveBackupFolder)/$alist_data_path
        upload $localPath/$alist_composefile_path $(urlencode $oneDriveBackupFolder)/$alist_composefile_path
    else
        echo -e "${YELLOW}$1 Backup File does not exist.${NC}"
        # echo "alist Backup File does not exist."
    fi
}

# $1 软件名称
ddns_go_backup(){
    # 上传 ddns-go
    if [[ -e $localPath/$ddnsgo_config_path ]]; then
        echo "$1 Backup File exists."
        stoprunning $1
        # echo $(urlencode $oneDriveBackupFolder/$ddnsgo_config_path)
        # upload $localPath/$ddnsgo_config_path $(urlencode $oneDriveBackupFolder/$ddnsgo_config_path)
        # echo $(urlencode $oneDriveBackupFolder)/$ddnsgo_config_path
        # upload $localPath/$ddnsgo_config_path $(urlencode $oneDriveBackupFolder)/$ddnsgo_config_path
        upload $localPath/$ddnsgo_config_path $(urlencode $oneDriveBackupFolder)/$ddnsgo_config_path
        upload $localPath/$ddnsgo_composefile_path $(urlencode $oneDriveBackupFolder)/$ddnsgo_composefile_path
        docker_run $localPath/$ddnsgo_composefile_path
    else
        echo -e "${YELLOW}$1 Backup File $localPath/$ddnsgo_config_path does not exist.${NC}"
        # echo "ddns-go Backup File does not exist."
    fi
}

# $1 软件名称
semaphore_backup(){
    # 上传 semaphore
    if [[ -e $localPath/$semaphore_config_path ]]; then
        echo "$1 Backup File exists."
        upload $localPath/$semaphore_config_path $(urlencode $oneDriveBackupFolder)/$semaphore_config_path
        upload $localPath/$semaphore_database_path $(urlencode $oneDriveBackupFolder)/$semaphore_database_path
        upload $localPath/$semaphore_composefile_path $(urlencode $oneDriveBackupFolder)/$semaphore_composefile_path
    else
        echo -e "${YELLOW}$1 Backup File does not exist.${NC}"
        # echo "semaphore Backup File does not exist."
    fi
}

# $1 软件名称
uptime_kuma_backup(){
    # 上传 semaphore
    if [[ -e $localPath/$uptimekuma_composefile_path ]]; then
        echo "$1 Backup File exists."
        upload $localPath/$uptimekuma_composefile_path $(urlencode $oneDriveBackupFolder)/$uptimekuma_composefile_path
        upload $localPath/$uptimekuma_database_path $(urlencode $oneDriveBackupFolder)/$uptimekuma_database_path
        # upload $localPath/$semaphore_composefile_path $(urlencode $oneDriveBackupFolder)/$semaphore_composefile_path
    else
        echo -e "${YELLOW}$1 Backup File does not exist.${NC}"
    fi
}


# $1 软件名称
xui_backup(){
    # 上传 xui
    if [[ -e $localPath/$xui_composefile_path ]]; then
        echo "$1 Backup File exists."
        upload $localPath/$xui_composefile_path $(urlencode $oneDriveBackupFolder)/$xui_composefile_path
        upload $localPath/$xui_privkeykey_path $(urlencode $oneDriveBackupFolder)/$xui_privkeykey_path
        upload $localPath/$xui_publickey_path $(urlencode $oneDriveBackupFolder)/$xui_publickey_path
        upload $localPath/$xui_database_path $(urlencode $oneDriveBackupFolder)/$xui_database_path
    else
        echo -e "${YELLOW}$1 Backup File does not exist.${NC}"
    fi
}

# 显示安装帮助信息
show_install_help() {
    echo "Usage: $0 [-o option] [-e client_id,client_secret,tenant_id,backup_soft_name]"
    echo ""
    echo "  -o  选择备份软件"
    echo "      1 - all"
    echo "      2 - auto"
    echo "      3 - alist"
    echo "      4 - ddns-go"
    echo "      5 - semaphore"
    echo "      6 - uptime-kuma"
    echo "      7 - xui"

    echo ""
    echo "  -e  提供 OneDrive 备份的详细信息，用逗号分隔"
    echo "      client_id,client_secret,tenant_id,backup_soft_name"
    echo ""
    echo "  -h  显示此帮助信息"
}



alist_restore(){
    echo "恢复alist备份文件"
    # 检查 alist 容器是否在运行
    stoprunning alist
    mkdir -p alist
    download "$localPath/$alist_config_Path" "$(urlencode $oneDriveBackupFolder)/$alist_config_Path"
    download "$localPath/$alist_data_path" "$(urlencode $oneDriveBackupFolder)/$alist_data_path"
    download "$localPath/$alist_composefile_path" "$(urlencode $oneDriveBackupFolder)/$alist_composefile_path"
    # echo "开始运行 alist 容器"
    docker_run $localPath/$alist_composefile_path
    # docker compose -f "$localPath/$alist_composefile_path" up -d
}

ddns_go_restore(){
    echo "恢复ddns-go备份文件"
    # 检查 ddns-go 容器是否存在
    stoprunning ddns-go
    mkdir -p ddns-go
    download "$localPath/$ddnsgo_config_path" "$(urlencode $oneDriveBackupFolder)/$ddnsgo_config_path"
    download "$localPath/$ddnsgo_composefile_path" "$(urlencode $oneDriveBackupFolder)/$ddnsgo_composefile_path"
    echo "开始运行 ddns-go 容器"
    docker_run $localPath/$ddnsgo_composefile_path
    # docker compose -f "$localPath/$ddnsgo_composefile_path" up -d
}

semaphore_restore(){
    echo "恢复semaphore备份文件"
    # 检查 semaphore 容器是否在运行
    stoprunning semaphore
    mkdir -p semaphore
    download "$localPath/$semaphore_config_path" "$(urlencode $oneDriveBackupFolder)/$semaphore_config_path"
    download "$localPath/$semaphore_database_path" "$(urlencode $oneDriveBackupFolder)/$semaphore_database_path"
    download "$localPath/$semaphore_composefile_path" "$(urlencode $oneDriveBackupFolder)/$semaphore_composefile_path"
    # 授予 "$localPath/$semaphore_database_path" 访问权限
    chmod 666 "$localPath/$semaphore_database_path"
    echo "开始运行 semaphore 容器"
    docker_run $localPath/$semaphore_composefile_path
    # docker compose -f "$localPath/$semaphore_composefile_path" up -d
}

uptime_kuma_restore(){
    stoprunning uptime-kuma
    mkdir -p uptime-kuma
    download "$localPath/$uptimekuma_composefile_path" "$(urlencode $oneDriveBackupFolder)/$uptimekuma_composefile_path"
    download "$localPath/$uptimekuma_database_path" "$(urlencode $oneDriveBackupFolder)/$uptimekuma_database_path"
    # download "$localPath/$uptimekuma_composefile_path" "$(urlencode $oneDriveBackupFolder)/$uptimekuma_composefile_path"
    echo "开始运行 semaphore 容器"
    docker_run $localPath/$uptimekuma_composefile_path
}

openwrt_restore(){
    docker import $openwrt_rootf_path openwrt_rootf
    docker run -itd --name=openwrt_rootf --restart=always --network=macnet --privileged=true -v /var/run/docker.sock:/root/docker.sock openwrt /sbin/init
    docker exec -it /bin/sh "sed -i 's/192.168.2.2/192.168.1.15/' /etc/config/network && /etc/init.d/network restart && ifconfig"
}

xui_restore(){
    stoprunning xui
    mkdir -p xui
    download "$localPath/$xui_database_path" "$(urlencode $oneDriveBackupFolder)/$xui_database_path"
    download "$localPath/$xui_publickey_path" "$(urlencode $oneDriveBackupFolder)/$xui_publickey_path"
    download "$localPath/$xui_privkeykey_path" "$(urlencode $oneDriveBackupFolder)/$xui_privkeykey_path"
    download "$localPath/$xui_composefile_path" "$(urlencode $oneDriveBackupFolder)/$xui_composefile_path"
    echo "开始运行 xui 容器"
    docker_run $localPath/$xui_composefile_path
}

