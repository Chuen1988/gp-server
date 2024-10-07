#Start Docker and install in AWS EC2
#!/bin/sh
sudo yum update -y
sudo amazon-linux-extras install docker
sudo service docker start
sudo usermod -a -G docker ec2-user
cd /home/ec2-user/gp-server/
sudo docker-compose up --build -d
sudo docker system prune -f