#!/bin/sh

set -e

ZIRA_CONFIGURATION_DIR=/etc/zira
ZIRA_CONFIGURATION_FILE=$ZIRA_CONFIGURATION_DIR/zira.conf
ZIRA_DATA_DIR=/var/lib/zira
ZIRA_GROUP="zira"
ZIRA_LOG_DIR=/var/log/zira
ZIRA_LOG_FILE=$ZIRA_LOG_DIR/zira-server.log
ZIRA_USER="zira"

if ! getent passwd | grep -q "^zira:"; then
    groupadd $ZIRA_GROUP
    adduser --system --no-create-home $ZIRA_USER -g $ZIRA_GROUP
fi
# Register "$ZIRA_USER" as a postgres user with "Create DB" role attribute
su - postgres -c "createuser -d -R -S $ZIRA_USER" 2> /dev/null || true
# Configuration file
mkdir -p $ZIRA_CONFIGURATION_DIR
# can't copy debian config-file as addons_path is not the same
if [ ! -f $ZIRA_CONFIGURATION_FILE ]
then
    echo "[options]
; This is the password that allows database operations:
; admin_passwd = admin
db_host = False
db_port = False
db_user = $ZIRA_USER
db_password = False
addons_path = /usr/lib/python3.6/site-packages/zira/addons
" > $ZIRA_CONFIGURATION_FILE
    chown $ZIRA_USER:$ZIRA_GROUP $ZIRA_CONFIGURATION_FILE
    chmod 0640 $ZIRA_CONFIGURATION_FILE
fi
# Log
mkdir -p $ZIRA_LOG_DIR
chown $ZIRA_USER:$ZIRA_GROUP $ZIRA_LOG_DIR
chmod 0750 $ZIRA_LOG_DIR
# Data dir
mkdir -p $ZIRA_DATA_DIR
chown $ZIRA_USER:$ZIRA_GROUP $ZIRA_DATA_DIR

INIT_FILE=/lib/systemd/system/zira.service
touch $INIT_FILE
chmod 0700 $INIT_FILE
cat << EOF > $INIT_FILE
[Unit]
Description=Zira Open Source ERP and CRM
After=network.target

[Service]
Type=simple
User=zira
Group=zira
ExecStart=/usr/bin/zira --config $ZIRA_CONFIGURATION_FILE --logfile $ZIRA_LOG_FILE
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF
