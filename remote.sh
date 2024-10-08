#!/bin/bash

# 获取脚本所在的目录
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# 切换工作目录为脚本所在目录
cd "$SCRIPT_DIR"

# 检查操作系统类型
OS_TYPE=$(uname)
hosttag=""
option="uptime-kuma"
script=""
system_env=""

while getopts ":n:h" opt; do
  case ${opt} in
    n )
        # 处理 -n 选项
        case $OPTARG in
            [0-9][0-9][0-9])
                hosttag=${OPTARG:0:1}
                action=${OPTARG:1:1}
                option=${OPTARG:2:1}
                ;;
            *)
                echo "选项 -n 的参数无效: $OPTARG" >&2
                exit 1
                ;;
        esac
        ;;
    h )
        # 显示帮助信息
        echo "用法: $0 [-n 主机_软件_操作] [-h]" >&2
        echo "选项:" >&2
        echo "  -n  指定主机、软件和操作，格式为三位数字：" >&2
        echo "        第一位数字: 主机标签 (1: armbian, 2: default, 3: dockerhost, 4: localhost)" >&2
        echo "        第二位数字: 操作 (1: 备份, 2: 恢复)" >&2
        echo "        第三位数字: 选项 (1: all 2: auto 3: alist, 4: ddns-go, 5: semaphore, 6: uptime-kuma 7: xui)" >&2
        echo "  -h  显示帮助信息" >&2
        exit 0
        ;;
    \? ) # 未知选项
        echo "无效选项: -$OPTARG" >&2
        exit 1
        ;;
    : ) # 缺少参数
        echo "选项 -$OPTARG 需要参数." >&2
        exit 1
        ;;
  esac
done

shift $((OPTIND -1))

if [ -z "$hosttag" ] || [ -z "$option" ] || [ -z "$action" ]; then
    echo "缺少参数，请指定主机、软件和操作." >&2
    exit 1
fi

# 根据主机标签设置主机
case $hosttag in
    1)
        hosttag=armbian
        ;;
    2)
        hosttag=default
        ;;
    3)
        hosttag=dockerhost
        ;;
    4)
        hosttag=localhost
        ;;
    *)
        echo "无效的主机标签: $hosttag" >&2
        exit 1
        ;;
esac

# 根据备份软件名称设置软件
case $option in
    1)
        option=all
        ;;
    2)
        option=auto
        ;;
    3)
        option=alist
        ;;
    4)
        option=ddns-go
        ;;
    5)
        option=semaphore
        ;;
    6)
        option=uptime-kuma
        ;;
    7)
        option=xui
        ;;

    *)
        echo "无效的备份软件名称: $option" >&2
        exit 1
        ;;
esac

# 根据操作选项设置操作
case $action in
    1)
        action="备份"
        script=backup.sh
        ;;
    2)
        action="恢复"
        script=install.sh
        ;;
    *)
        echo "无效的操作: $action" >&2
        exit 1
        ;;
esac

# 执行相应操作
echo "主机: $hosttag, 操作: $action",  软件: $option
# 在这里执行你的操作


check_soft_env(){
    # 检查是否存在 jq 命令
    echo "--- 检查 jq 是否已安装 ---"
    if command -v jq >/dev/null 2>&1; then
        echo "jq 工具已安装"
    else
        echo "未检测到 jq 存在"
        if [[ "$OS_TYPE" == "Linux" ]]; then
            echo "当前系统类型为 $OS_TYPE 正在通过 apt 指令安装 jq"
            apt install jq -y
        elif [[ "$OS_TYPE" == "MINGW"* || "$OS_TYPE" == "CYGWIN"* ]]; then
            echo "当前系统类型为 $OS_TYPE 正在通过 winget 安装 jq"
            winget install jqlang.jq          
        fi
    fi
}

# $1 password
sshcommand(){
    local host=$1
    local username=$2
    local password=$3
    local command=$4
    
    if [[ "$OS_TYPE" == "MINGW"* || "$OS_TYPE" == "CYGWIN"* ]]; then
        # Windows 系统使用 plink
        plink -batch -pw "$password" "$username@$host" "$command"
    elif [[ "$OS_TYPE" == "Linux" ]]; then
        # Linux 系统使用 sshpass
        sshpass -p "$password" ssh "$username@$host" "$command"
    else
        echo "Unsupported OS type: $OS_TYPE"
        exit 1
    fi
}

scpcommand(){
    local host=$1
    local username=$2
    local password=$3
    shift 3  # 移动参数指针，前3个参数已被读取
    local local_files=("$@")  # 获取剩余的所有参数作为文件列表
    local remote_dir=${local_files[-1]}  # 最后一个参数是 remote_dir
    unset local_files[-1]  # 移除最后一个参数

    if [[ "$OS_TYPE" == "MINGW"* || "$OS_TYPE" == "CYGWIN"* ]]; then
        # Windows 系统使用 pscp
        pscp -pw "$password" "${local_files[@]}" "$username@$host:$remote_dir"
    elif [[ "$OS_TYPE" == "Linux" ]]; then
        # Linux 系统使用 sshpass
        sshpass -p "$password" scp "$local_file" "$username@$host:$remote_dir"
    else
        echo "Unsupported OS type: $OS_TYPE"
        exit 1
    fi
}

# 检查 jq 软件是否安装
check_soft_env

hostname=$(jq -r ".ungrouped.hosts.$hosttag.ansible_host" host.json)
hostuser=$(jq -r ".ungrouped.hosts.$hosttag.ansible_user" host.json)
hostpw=$(jq -r ".ungrouped.hosts.$hosttag.ansible_password" host.json)


source .env
# echo $client_id $client_secret $tenant_id $localFilePath $oneDriveBackupFolder $option

# 创建 data 文件夹
sshcommand $hostname $hostuser $hostpw "mkdir -p data"
# 复制文件到远程服务器
scpcommand $hostname $hostuser $hostpw backup.sh install.sh config.sh comFunc.sh data
# 给 backup.sh install.sh 增加执行权限
sshcommand $hostname $hostuser $hostpw "chmod +x ~/data/backup.sh && chmod +x ~/data/install.sh && chmod +x ~/data/config.sh && chmod +x ~/data/comFunc.sh"
# 执行操作命令
sshcommand $hostname $hostuser $hostpw "~/data/$script -e $client_id,$client_secret,$tenant_id,$option"

