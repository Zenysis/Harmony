#!/usr/bin/env bash
set -x
exec > >(tee /var/log/tf-user-data.log|logger -t user-data ) 2>&1

logger() {
  DT=$(date '+%Y/%m/%d %H:%M:%S')
  echo "$DT $0: $1"
}
echo $(date '+%Y/%m/%d %H:%M:%S')

apt update && apt upgrade -y
apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt install docker-ce
usermod -aG docker ubuntu

echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDEnSaXeGiRjRyEY5MYVh7h9KQjWqT/RFfwThXdMQLdzFPrCLBVycNQewgEpoU1z7TOaNAB+K4RSOk1RBry6mxNwWCMly23UO0oSTfM1cnNWA6rxpeBRBdY+fRiWVa/SLH5SEq1kkxAlXupApmaTHI8tOrwIlN1z71hxVOTpC5z4wqrvh/LVlWXYwkM6M3LY9An6ATdLOJys4BS1oxUBoKh0MFa1TmL+xbBrTXCdXzCkoT1VR7+cTaEBXhcxhDSryPHeR5WMY2IvpW4OngDzcBcHEDHGBrlhK7BHcnUZEWpzlFdfW0JFtE7W9gs1EP3nSpvZG2+t1q84AjjPXyhHHrz Zenysis-CA' > /etc/ssh/zen_ca.pub
chmod 0644 /etc/ssh/zen_ca.pub

echo 'TrustedUserCAKeys  /etc/ssh/zen_ca.pub' >> /etc/ssh/sshd_config
systemctl restart ssh

apt-get install -y build-essential
apt update
apt install -y awscli jq make

echo $(date '+%Y/%m/%d %H:%M:%S')
