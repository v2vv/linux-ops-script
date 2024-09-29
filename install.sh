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
                    backup_soft_name="all"
                    ;;
                2)
                    backup_soft_name="auto"
                    ;;
                3)
                    backup_soft_name="alist"
                    ;;
                4)
                    backup_soft_name="ddns-go"
                    ;;
                5)
                    backup_soft_name="semaphore"
                    ;;
                6)
                    backup_soft_name="uptime-kuma"
                    ;;
                7)
                    backup_soft_name="xui"
                    ;;
                *)
                    echo "无效的备份软件名称: $OPTARG" >&2
                    exit 1
                    ;;
            esac
            ;;
        e )
            # 处理 -e 选项
            IFS=',' read -r client_id client_secret tenant_id backup_soft_name <<< "$OPTARG"
            ;;
        h )
            show_install_help
            exit 0
            ;;
        \? ) 
            # 未知选项
            echo "Invalid option: -$OPTARG" >&2
            show_install_help
            exit 1
            ;;
        : ) 
            # 缺少参数
            echo "Option -$OPTARG requires an argument." >&2
            show_install_help
            exit 1
            ;;
    esac
done
shift $((OPTIND -1))



restore(){
    echo '开始安装'
    case $1 in
        "alist")
            alist_restore
            ;;
        "ddns-go")
            ddns_go_restore
            ;;
        "semaphore")
            semaphore_restore
            ;;
        "uptime-kuma")
            uptime_kuma_restore
            ;;
        "xui")
            xui_restore
            ;;

        "all")
            alist_restore
            ddns_go_restore
            semaphore_restore
            uptime_kuma_restore
            xui_restore
            ;;
        *)
            echo "未匹配到任何恢复数据名"
            ;;
    esac
}

# mkdir -p ddns-go
# download "$localFilePath/$ddnsgo_config_path" "$(urlencode $oneDriveBackupFolder)/$ddnsgo_config_path"
# download "$localFilePath/$ddnsgo_composefile_path" "$oneDriveBackupFolder/$ddnsgo_composefile_path"
check_sysem
check_soft_env
auth
restore $backup_soft_name
crontab_backup

