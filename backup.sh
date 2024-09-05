#!/bin/bash

# 获取脚本所在的目录
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# 切换工作目录为脚本所在目录
cd "$SCRIPT_DIR"

# 加载配置 source ./config.sh
. ./config.sh

# 加载函数
source ./comFunc.sh

# 默认值
verbose=0
file=""



while getopts ":o:e:h" opt; do
    case ${opt} in
        o )
            # 判断文件是否存在
            if [ -e ".env" ]; then
                source .env
            else
                echo ".env 文件不存在, 请先上传 .env 文件"
                exit 1
            fi
            case $OPTARG in
                1)
                    option="alist"
                    ;;
                2)
                    option="ddns-go"
                    ;;
                3)
                    option="semaphore"
                    ;;
                4)
                    option="uptime-kuma"
                    ;;
                5)
                    option="all"
                    ;;
                6)
                    option="auto"
                    ;;
                
                *)
                    echo "无效的备份软件名称: $OPTARG" >&2
                    exit 1
                    ;;
            esac
            ;;
        e )
            # 处理 -e 选项
            IFS=',' read -r client_id client_secret tenant_id option <<< "$OPTARG"
            ;;
        h )
            show_backup_help
            exit 0
            ;;
        \? )
             # 未知选项
            echo "Invalid option: -$OPTARG" >&2
            show_backup_help
            exit 1
            ;;
        : ) 
            # 缺少参数
            echo "Option -$OPTARG requires an argument." >&2
            show_backup_help
            exit 1
            ;;
    esac
done
shift $((OPTIND -1))


# client_id=$1
# client_secret=$2
# tenant_id=$3
# localPath=$4
# oneDriveBackupFolder=$5
# option=$6
# echo $client_id
# echo $client_secret
# echo $tenant_id



auto_backup(){
jq -r '.software_backup[]' soft-cfg | while read software; do
    # echo "处理软件备份: $software"
    backup $software
done
}

backup(){
    echo
    echo "======== backup option: $1 ======"
    echo "日期 $(date +”%Y/%m/%d/%H:%M:%S”)"
    case  $1 in
        "alist")
            alist_backup "alist"
            ;;
        "ddns-go")
            ddns_go_backup "ddns-go"
            ;;
        "semaphore")
            semaphore_backup "semaphore"
            ;;
        "uptime-kuma")
            uptime_kuma_backup "uptime-kuma"
            ;;
        "all")
            alist_backup "alist"
            ddns_go_backup "ddns-go"
            semaphore_backup "semaphore"
            uptime_kuma_backup "uptime-kuma"
            ;;
        "auto")
            auto_backup
            ;;
        *)
            echo "未匹配到任何备份名"
            ;;
    esac
    echo '备份完成'
}


echo "localPath $localPath"
echo "oneDriveBackupFolder $oneDriveBackupFolder"
echo option $option
check_sysem
check_soft_env
auth
backup $option



